# npm dependency risk triage

기준일: 2026-08-20

## 결론

- `npm audit`: 13 package nodes — high 7, moderate 6, critical 0
- underlying advisory: 8건
- P0/P1: 없음
- P2: 8건
- 현재 상태: **ACCEPTED RISK**

`npm audit fix --force`는 실행하지 않았다. 남은 모든 수정 경로가 direct tool 또는
runtime dependency의 major upgrade를 요구하고, 현재 정적 dashboard demo에 실제로
도달 가능한 P0 결함은 확인되지 않았다. 0건을 만들기 위한 강제 변경보다 별도
호환성 branch에서 router/build tool을 업그레이드하는 편이 안전하다.

`npm audit --omit=dev`도 7개 node를 보고하지만, 이 저장소는 webpack·dev server
같은 build tool 일부를 `dependencies`에 두고 있어 해당 명령만으로 browser runtime
도달성을 판정할 수 없다. 아래 분류는 dependency path와 실제 코드 사용을 함께
검토한 결과다.

## Advisory별 판정

| package/advisory | severity | dependency path | 분류 | RAGANG 현실적 exploit relevance | major 필요 | 조치 |
| --- | --- | --- | --- | --- | --- | --- |
| `minimatch` [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | high | `@typescript-eslint/parser@6.21.0 → typescript-estree → minimatch@9.0.3` | development-only | 악성 glob pattern을 lint/parser tooling에 입력해야 한다. lint script가 없고 package는 dashboard에 bundle되지 않는다. | `@typescript-eslint` 8 major | P2 / ACCEPTED RISK |
| `minimatch` [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | high | 위와 동일 | development-only | 여러 `GLOBSTAR`를 가진 공격자 입력이 필요하며 production/browser 경로에서 호출되지 않는다. | 예 | P2 / ACCEPTED RISK |
| `minimatch` [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | high | 위와 동일 | development-only | nested extglob ReDoS는 local tooling 입력에 한정되고 배포 정적 자산에는 포함되지 않는다. | 예 | P2 / ACCEPTED RISK |
| `react-router` [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) | moderate | `react-router-dom@6.30.6 → react-router@6.30.6` | production runtime | app은 `HashRouter`와 고정된 `/dashboard`, `/test`, `/run-queries` 경로만 사용한다. 외부 입력을 `Link`/`navigate` target으로 전달하는 경로는 발견되지 않아 현재 exploit reachability는 낮다. | `react-router-dom` 7.18 major | P2 / ACCEPTED RISK |
| `react-router` [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg) | moderate | 위와 동일 | unreachable/irrelevant to packaged dashboard | advisory는 SSR hydration `deserializeErrors()` 경로다. RAGANG은 client-only webpack app이며 SSR/data router를 사용하지 않는다. | 예 | P2 / ACCEPTED RISK |
| `serialize-javascript` [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) | high | `css-minimizer-webpack-plugin@5.0.1 → serialize-javascript@6.0.2` | production build-time | repository가 통제하는 webpack config/CSS만 처리한다. 공격자 RegExp/Date object를 build에 주입하는 서비스가 없고 package는 browser bundle에 포함되지 않는다. | `css-minimizer-webpack-plugin` 8 major | P2 / ACCEPTED RISK |
| `serialize-javascript` [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) | moderate | 위와 동일 | production build-time | crafted array-like object를 build input으로 넣어야 하며 현재 trusted-source build에서 도달하지 않는다. | 예 | P2 / ACCEPTED RISK |
| `uuid` [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | moderate | `webpack-dev-server@5.2.6 → sockjs@0.3.24 → uuid@8.3.2` | development-only | 취약한 v3/v5/v6 buffer API는 RAGANG application이 호출하지 않는다. webpack dev server와 SockJS는 production 정적 dashboard/runtime에 배포되지 않는다. | `webpack-dev-server` 6 major | P2 / ACCEPTED RISK |

## Package node 전파 설명

13이라는 audit 수는 advisory 수가 아니라 영향 node 수다.

- `minimatch` 영향이 `@typescript-eslint/typescript-estree`, `parser`,
  `type-utils`, `utils`, `eslint-plugin`으로 전파되어 high 6 node가 된다.
- `react-router` 영향이 `react-router-dom`으로 전파되어 moderate 2 node가 된다.
- `serialize-javascript` 영향이 `css-minimizer-webpack-plugin`으로 전파된다.
- `uuid` 영향이 `sockjs`, `webpack-dev-server`로 전파된다.

## 후속 remediation

별도 dependency branch에서 다음 순서로 major compatibility를 검증한다.

1. `@typescript-eslint` 8과 ESLint configuration
2. `css-minimizer-webpack-plugin` 8과 deterministic build
3. `webpack-dev-server` 6과 local dev WebSocket
4. `react-router-dom` 7.18 이상과 모든 hash route/navigation

각 변경 후 `npm ci`, `npm test`, `npm run typecheck`, production build 2회 hash
비교와 실제 browser checklist를 수행한다. demo branch에서 audit 숫자만 줄이기 위한
override나 `--force`는 사용하지 않는다.
