const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadTS } = require('./load-ts.cjs');
const display = loadTS('src/utils/display.ts');
const { metricIdentity } = loadTS('src/pages/Dashboard/analysis.ts');
const metric = (fingerprint = 'opaque-config-a') => ({
  name: 'Groundedness',
  unit: '0 to 1',
  score: 0,
  didEval: true,
  evaluator: {
    implementation: 'opaque-source-class',
    implementation_fingerprint: 'opaque-implementation',
    fingerprint,
    adapters: [{ role: 'llm', model: 'opaque-model', implementation_fingerprint: 'opaque-adapter' }],
  },
});
const withoutTechnical = (html) => html.replace(/<details[^>]*data-technical-details[^>]*>[\s\S]*?<\/details>/g, '');

test('metric display names explain purpose and keep different evaluation settings distinct', () => {
  const a = metric(),
    b = metric('opaque-config-b'),
    catalog = new display.MetricDisplayNames();
  assert.equal(catalog.labelsFor([a])[metricIdentity(a)], 'Groundedness [0 to 1]');
  const labels = catalog.labelsFor([a, b]);
  assert.notEqual(labels[metricIdentity(a)], labels[metricIdentity(b)]);
  assert.ok(Object.values(labels).every((label) => /^Groundedness \[0 to 1\] · 평가 설정 \d+$/.test(label)));
  assert.doesNotMatch(Object.values(labels).join(' '), /opaque|config:|fingerprint/);
  assert.notEqual(metricIdentity(a), metricIdentity(b));
});
test('evaluation setting numbers are stable after reorder and appending another configuration', () => {
  const a = metric(),
    b = metric('opaque-config-b'),
    c = metric('opaque-config-0');
  const one = new display.MetricDisplayNames(),
    two = new display.MetricDisplayNames();
  const original = one.labelsFor([a, b]);
  assert.deepEqual(two.labelsFor([b, a]), original);
  assert.deepEqual(one.labelsFor([b, a]), original);
  const expanded = one.labelsFor([c, b, a]);
  assert.equal(expanded[metricIdentity(a)], original[metricIdentity(a)]);
  assert.equal(expanded[metricIdentity(b)], original[metricIdentity(b)]);
});
test('run and question names use order and content rather than opaque identifiers', () => {
  const runs = [
    { runId: 'opaque-run-b', timestamp: 'b', date: '2026-10-25 12:01:00 KST' },
    { runId: 'opaque-run-a', timestamp: 'a', date: '2026-10-25 12:00:00 KST' },
  ];
  const names = display.runDisplayNames(runs);
  assert.equal(names['opaque-run-a'], '실행 1 · 2026-10-25 12:00:00 KST');
  assert.equal(names['opaque-run-b'], '실행 2 · 2026-10-25 12:01:00 KST');
  assert.doesNotMatch(Object.values(names).join(' '), /opaque-run/);
  assert.equal(display.questionDisplayName('', 1), '질문 1');
  assert.equal(display.questionDisplayName('근거가 무엇인가요?', 2), '질문 2 · 근거가 무엇인가요?');
});
test('trace labels preserve ancestry and repetition using readable steps', () => {
  const trace = [
    {
      query: '근거는?',
      queryId: 'opaque-query',
      executionId: 'opaque-exec-a',
      moduleId: 'retrieval',
      executionIndex: 1,
      parentExecutionIds: [],
      nextModules: ['generation'],
      status: 'completed',
    },
    {
      query: '근거는?',
      queryId: 'opaque-query',
      executionId: 'opaque-exec-b',
      moduleId: 'generation',
      executionIndex: 2,
      parentExecutionIds: ['opaque-exec-a'],
      nextModules: [],
      status: 'failed',
    },
  ];
  const rows = display.traceDisplayRows(trace, display.moduleDisplayNames(['retrieval', 'generation']));
  assert.equal(rows[1].questionLabel, '질문 1 · 근거는?');
  assert.equal(rows[1].moduleLabel, '답변 생성 · 2회차');
  assert.deepEqual(rows[1].parentLabels, ['단계 1 (검색)']);
  assert.equal(rows[1].statusLabel, '실패');
  assert.doesNotMatch(JSON.stringify(rows.map(({ event, ...labels }) => labels)), /opaque-/);
  assert.equal(rows[1].event.executionId, 'opaque-exec-b');
  const names = display.moduleDisplayNames([
    'aabbccddeeff00112233#1',
    'aabbccddeeff00112233#2',
    'ffeeddccbbaa99887766#1',
  ]);
  assert.equal(names['aabbccddeeff00112233#2'], '모듈 1 · 2회차');
  assert.equal(names['ffeeddccbbaa99887766#1'], '모듈 2 · 1회차');
  const retrievers = display.moduleDisplayNames(['ret', 'retrieval', 'ret#2']);
  assert.notEqual(retrievers.ret, retrievers.retrieval);
  assert.equal(retrievers['ret#2'], `${retrievers.ret} · 2회차`);
});
test('metric evidence keeps zero and units visible while raw provenance is in closed technical details', () => {
  const { MetricDetails } = loadTS('src/components/MetricDetails.tsx');
  const value = {
    ...metric(),
    direction: 'higher',
    scope: { input_execution_ids: { 'retrieval.ret_docs': 'opaque-bound-execution' } },
    evidence: [
      { claim_id: 'opaque-claim', claim: '검색 문서에 근거가 있습니다.', grounded: true, source_document_indices: [0] },
    ],
    sourceDocuments: ['확인된 문서 내용'],
  };
  const html = renderToStaticMarkup(React.createElement(MetricDetails, { metric: value }));
  assert.match(html, /opaque-implementation/);
  assert.match(html, /opaque-claim/);
  assert.match(html, /opaque-bound-execution/);
  assert.match(html, /data-technical-details/);
  assert.doesNotMatch(html, /<details[^>]*open/);
  const primary = withoutTechnical(html);
  assert.doesNotMatch(primary, /opaque-|fingerprint|config:/);
  assert.match(primary, /주장 1/);
  assert.match(primary, /근거 문서 1/);
  assert.match(primary, /높을수록 좋음/);
  assert.equal(value.score, 0);
  assert.equal(display.directionDisplayName('unknown-distance'), '지표 설명 확인');
});
test('live chart labels retain original data keys and declare setting differences without hashes', () => {
  const a = metric(),
    b = metric('opaque-config-b'),
    groups = [{ moduleName: 'generation#1', metrics: [a, b] }];
  const labels = new display.MetricDisplayNames().labelsFor([a, b]);
  const series = display.liveSeriesDisplayNames(groups, labels, display.moduleDisplayNames(['generation#1']));
  assert.equal(Object.keys(series).length, 2);
  assert.ok(Object.keys(series).every((key) => key.includes('opaque-config')));
  assert.ok(Object.values(series).every((label) => label.startsWith('답변 생성 · 1회차 · Groundedness [0 to 1]')));
  assert.doesNotMatch(Object.values(series).join(' '), /opaque-|config:/);
});
test('dashboard primary presentation hides raw run query config and execution IDs without discarding them', () => {
  const { DashboardView } = loadTS('src/pages/Dashboard/DashboardView.tsx');
  const m = metric(),
    identity = metricIdentity(m),
    labels = new display.MetricDisplayNames().labelsFor([m]);
  const event = {
    query: '근거는?',
    queryId: 'opaque-query',
    executionId: 'opaque-execution',
    moduleId: 'generation',
    executionIndex: 1,
    revisitCount: 0,
    parentExecutionIds: [],
    nextModules: [],
    status: 'failed',
    latencySeconds: 0.01,
  };
  const run = {
    runId: 'opaque-run',
    timestamp: 'opaque-timestamp',
    date: '2026-10-25 12:00:00 KST',
    modules: [],
    queryOutcomes: [],
    pipelineHealth: { attempted: 1, succeeded: 0, failed: 1, unknown: 0 },
  };
  const props = {
    metricLabels: labels,
    moduleLabels: display.moduleDisplayNames(['generation']),
    selectedRunLabel: '실행 1 · 2026-10-25 12:00:00 KST',
    baselineRunLabel: '',
    kpiData: { evaluatedMetrics: '1', notEvaluatedMetrics: '0', evaluatorCoverage: '100.0%', traceExecutions: '1' },
    selectedRun: run,
    comparisons: [],
    aggregation: 'final',
    notEvaluated: [],
    zoomedMetric: null,
    selectedDate: run.date,
    selectedModule: 'generation',
    zoomedFrequencyData: [],
    modulePerformanceData: [],
    handleDotClick() {},
    handleFrequencyBarClick() {},
    moduleColors: ['#123456'],
    detailedQueryData: [],
    selectedScoreRange: null,
    metricDistributionData: [],
    metricPerformanceBreakdownData: {},
    handleZoomClick() {},
    handleZoomOut() {},
    allModuleNames: ['generation'],
    diagnosticObservations: [],
    diagnosticInferences: [],
    configFingerprint: 'opaque-run-config',
    executionTrace: [event],
    graphHealth: { totalExecutions: 1, failedExecutions: 1, moduleRevisits: 0, terminatedQueries: 1 },
  };
  const html = renderToStaticMarkup(React.createElement(DashboardView, props));
  assert.match(html, /opaque-run/);
  assert.match(html, /opaque-query/);
  assert.match(html, /opaque-execution/);
  const primary = withoutTechnical(html);
  assert.doesNotMatch(primary, /opaque-run|opaque-query|opaque-execution|opaque-run-config/);
  assert.match(primary, /실행 1/);
  assert.match(primary, /단계 1/);
  assert.match(primary, /답변 생성/);
  assert.match(primary, /100.0%/);
});

test('full canonical identities keep the reproduced 32-bit collision configurations separate', () => {
  const a = {
    name: 'same',
    unit: '',
    score: 0,
    didEval: true,
    evaluator: { implementation: 'Judge', settings: { seed: '1dzz9sv' } },
  };
  const b = { ...a, score: 1, evaluator: { implementation: 'Judge', settings: { seed: '1my1y60' } } };
  const labels = new display.MetricDisplayNames().labelsFor([a, b]);
  assert.notEqual(metricIdentity(a), metricIdentity(b));
  assert.equal(Object.keys(labels).length, 2);
  assert.notEqual(labels[metricIdentity(a)], labels[metricIdentity(b)]);
  const { metricSamples } = loadTS('src/pages/Dashboard/analysis.ts');
  const qs = [
    { query: 'same', queryId: 'q1', answer: 'a', metrics: [a] },
    { query: 'same', queryId: 'q2', answer: 'a', metrics: [b] },
  ];
  assert.deepEqual(
    metricSamples(qs, metricIdentity(a), 'step').map((sample) => sample.score),
    [0],
  );
});
test('output names stay neutral and trace numbers use the full run question order', () => {
  assert.equal(display.moduleDisplayName('output'), '답변 출력');
  assert.equal(display.moduleDisplayName('final'), '답변 출력');
  const trace = [
    {
      query: 'second',
      queryId: 'q2',
      executionId: 'step2',
      moduleId: 'output',
      executionIndex: 1,
      parentExecutionIds: [],
      nextModules: ['critic'],
      status: 'completed',
    },
  ];
  const rows = display.traceDisplayRows(trace, display.moduleDisplayNames(['output', 'critic']), ['q1', 'q2']);
  assert.equal(rows[0].questionLabel, '질문 2 · second');
  assert.equal(rows[0].moduleLabel, '답변 출력 · 1회차');
  assert.deepEqual(rows[0].nextLabels, ['답변 검증']);
});
