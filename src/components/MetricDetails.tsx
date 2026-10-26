import React from 'react';
import { directionDisplayName } from '../utils/display';
import { TechnicalDetails } from './TechnicalDetails';
import type { MetricScore } from '../globals/types';

/** A score stays connected to the declared evaluator, evaluated scope, and claim evidence. */
export function MetricDetails({ metric }: { metric: MetricScore }) {
  const scope = metric.scope;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere' }}>
      {metric.failure && (
        <p role="status">미평가 사유: {metric.failure.message || '평가 결과가 생성되지 않았습니다.'}</p>
      )}
      <p>이 값은 해당 지표의 계산 결과입니다. 정답 확률이나 종합 품질 점수를 뜻하지 않습니다.</p>
      {metric.direction && <p>점수 방향: {directionDisplayName(metric.direction)}</p>}
      {scope && (
        <div>
          {typeof scope.documents_total === 'number' && (
            <p>
              평가 문서: {typeof scope.documents_evaluated === 'number' ? scope.documents_evaluated : '미기록'} /{' '}
              {scope.documents_total}
            </p>
          )}
          {typeof scope.answer_chars_total === 'number' && (
            <p>
              평가 답변: {typeof scope.answer_chars_evaluated === 'number' ? scope.answer_chars_evaluated : '미기록'} /{' '}
              {scope.answer_chars_total}자
            </p>
          )}
          {(scope.documents_truncated === true || scope.answer_truncated === true) && (
            <p style={{ color: '#fcd34d' }}>일부 입력만 평가했습니다. 전체 답변·전체 문서의 평가로 해석하지 마세요.</p>
          )}
          {typeof scope.claims_evaluated === 'number' && <p>평가 주장 수: {scope.claims_evaluated}</p>}
        </div>
      )}
      {metric.evidence?.map((e, index) => (
        <div key={`${e.claim_id || index}`} style={{ borderTop: '1px solid #64748b', paddingTop: 8, marginTop: 8 }}>
          <p>
            <strong>
              {`주장 ${index + 1}`} ·{' '}
              {e.grounded === true ? '근거 있음' : e.grounded === false ? '근거 부족' : '판정 정보 없음'}
            </strong>
          </p>
          {e.claim && <p>{e.claim}</p>}
          {e.reason && <p>판정 이유: {e.reason}</p>}
          <TechnicalDetails entries={[['주장 ID', e.claim_id]]} />
          {e.source_document_indices?.map((i) => (
            <details key={i}>
              <summary>근거 문서 {i + 1}</summary>
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {metric.sourceDocuments?.[i] || '이 이력에는 해당 문서 내용이 연결되어 있지 않습니다.'}
              </p>
            </details>
          ))}
        </div>
      ))}
      {metric.sourceDocuments?.length ? (
        <details>
          <summary>검색된 전체 문서 {metric.sourceDocuments.length}개 확인</summary>
          {metric.sourceDocuments.map((d, i) => (
            <p key={i} style={{ whiteSpace: 'pre-wrap' }}>
              문서 {i + 1}: {d}
            </p>
          ))}
        </details>
      ) : null}
      <TechnicalDetails
        entries={[
          ['평가자 원본 정보', metric.evaluator],
          ['평가 입력 범위 원본', metric.scope],
          ['실패 원본 정보', metric.failure],
          ['지표 버전', metric.metricVersion],
          ['원본 방향', metric.direction],
        ]}
      />
    </div>
  );
}
