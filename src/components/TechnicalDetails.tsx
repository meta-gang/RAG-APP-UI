import React from 'react';

function format(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? '미기록';
  } catch {
    return '표시할 수 없는 메타데이터';
  }
}
/** Raw identifiers remain available on request without occupying the primary reading flow. */
export function TechnicalDetails({ entries }: { entries: [string, unknown][] }) {
  const present = entries.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!present.length) return null;
  return (
    <details data-technical-details style={{ fontSize: 13, overflowWrap: 'anywhere' }}>
      <summary>기술 정보</summary>
      <dl>
        {present.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{format(value)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
