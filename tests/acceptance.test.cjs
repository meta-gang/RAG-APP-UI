const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTS } = require('./load-ts.cjs');
const analysis = loadTS('src/pages/Dashboard/analysis.ts');
const transform = loadTS('src/pages/Dashboard/transformData.ts');
const metric = (score, extras = {}) => ({ name: 'quality', unit: '0 to 1', score, didEval: score !== null, ...extras });

test('selected run KPIs and pipeline status stay independent of latest run', () => {
  const old = transform.transformData({
    ts: '261025120000',
    states: {
      q: {
        query: 'q',
        gen: 'a',
        performances: [
          { metric: 'm', score: 1, did_eval: true },
          { metric: 'm', did_eval: false },
        ],
        execution_summary: { terminated: true, termination_reason: 'module_error' },
      },
    },
  });
  const latest = transform.transformData({
    ts: '261025120100',
    states: { q: { query: 'q', gen: 'a', performances: [{ metric: 'm', score: 1, did_eval: true }] } },
  });
  assert.equal(analysis.selectedKpis(old).evaluatorCoverage, '50.0%');
  assert.equal(analysis.selectedKpis(old).notEvaluatedMetrics, '1');
  assert.equal(analysis.selectedKpis(latest).evaluatorCoverage, '100.0%');
  assert.equal(old.pipelineHealth.failed, 1);
});
test('normalization preserves verdict evidence and invalid numeric results remain unevaluated', () => {
  const value = transform.normalizeMetric({
    _Performance__metric: 'judge',
    _Performance__score: 0,
    _Performance__did_eval: true,
    _Performance__evaluator: { fingerprint: 'a' },
    _Performance__scope: { documents_total: 6, documents_evaluated: 5, documents_truncated: true },
    _Performance__evidence: [{ claim: 'c', grounded: false }],
    _Performance__metric_version: '2',
  });
  assert.equal(value.score, 0);
  assert.equal(value.scope.documents_evaluated, 5);
  assert.equal(value.evidence[0].grounded, false);
  assert.equal(value.metricVersion, '2');
  for (const score of [NaN, Infinity, true, '1', null])
    assert.equal(transform.normalizeMetric({ score, did_eval: true }).didEval, false);
});
test('histogram drilldown uses exactly the same half-open bounds, including negatives and final edge', () => {
  const scores = [-1, -0.8, 0, 0.8, 1],
    bins = analysis.histogram(scores);
  assert.equal(
    bins.reduce((s, b) => s + b.count, 0),
    scores.length,
  );
  bins.forEach((bin) => assert.equal(scores.filter((s) => analysis.inScoreBin(s, bin)).length, bin.count));
  const boundary = bins[1].start;
  assert.equal(analysis.inScoreBin(boundary, bins[0]), false);
  assert.equal(analysis.inScoreBin(boundary, bins[1]), true);
  assert.equal(analysis.histogram([0, 0])[0].count, 2);
  assert.deepEqual(analysis.histogram([NaN]), []);
});
test('step and question aggregation have explicit weights and do not replace a failed final metric', () => {
  const identity = analysis.metricIdentity(metric(0));
  const qs = [
    ...Array.from({ length: 9 }, (_, i) => ({
      query: 'same text',
      queryId: 'q1',
      answer: 'a',
      executionIndex: i + 1,
      metrics: [metric(0)],
    })),
    { query: 'same text', queryId: 'q2', answer: 'b', executionIndex: 1, metrics: [metric(1)] },
  ];
  const mean = (xs) => xs.reduce((s, x) => s + x.score, 0) / xs.length;
  assert.equal(mean(analysis.metricSamples(qs, identity, 'step')), 0.1);
  assert.equal(mean(analysis.metricSamples(qs, identity, 'query')), 0.5);
  assert.equal(analysis.metricSamples(qs, identity, 'final').length, 2);
  qs.push({ query: 'same text', queryId: 'q2', answer: 'b', executionIndex: 2, metrics: [metric(null)] });
  assert.equal(analysis.metricSamples(qs, identity, 'final').length, 1);
});
test('same metric name with different evaluator configuration is kept separate', () => {
  assert.notEqual(
    analysis.metricIdentity(metric(0.5, { evaluator: { fingerprint: 'one', implementation: 'same' } })),
    analysis.metricIdentity(metric(0.5, { evaluator: { fingerprint: 'two', implementation: 'same' } })),
  );
});
test('actual cycles and parallel branches are laid out without fake DAG loops or overlap', () => {
  const { layoutGraph } = loadTS('src/pages/TestQuery/graph.ts');
  const dag = layoutGraph([
    ['a', 'b'],
    ['a', 'c'],
    ['a', 'd'],
    ['a', 'e'],
    ['b', 'c'],
  ]);
  assert.ok(dag.edges.every((e) => !e.isCycle));
  const sameRow = dag.nodes.filter((n) => n.position.y === 180);
  assert.equal(new Set(sameRow.map((n) => n.position.x)).size, sameRow.length);
  const cycle = layoutGraph([
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'b'],
    ['c', 'd'],
  ]);
  assert.deepEqual(
    cycle.edges.filter((e) => e.isCycle).map((e) => `${e.source}-${e.target}`),
    ['b-c', 'c-b'],
  );
});
test('all live batch queries and repeated snapshots are consumed once including failure without metrics', () => {
  const { appendLiveResult, normalizedStatus, statusKey } = loadTS('src/pages/TestQuery/liveData.ts');
  const previous = { messages: [], metrics: [], moduleStatuses: {}, liveMetricsHistory: [], activeConnections: [] };
  const states = {
    one: {
      query: 'one',
      gen: 'a',
      snapshots: {
        ret: [
          { performances: [{ score: 0, did_eval: true, metric: 'm' }] },
          { performances: [{ score: 1, did_eval: true, metric: 'm' }] },
        ],
      },
    },
    two: { query: 'two', execution_summary: { terminated: true, termination_reason: 'module_error' } },
  };
  const result = appendLiveResult(previous, states);
  assert.equal(result.messages.length, 2);
  assert.equal(result.metrics.length, 2);
  assert.equal(result.liveMetricsHistory.length, 2);
  assert.match(result.messages[1].text, /실행 실패/);
  assert.equal(appendLiveResult(result, states).messages.length, 2);
  assert.equal(normalizedStatus({ statu: 'end', status: 'failed' }), 'failed');
  assert.equal(normalizedStatus({ statu: 'completed' }), 'completed');
  assert.equal(normalizedStatus({ statu: 'running' }), 'loading');
  assert.notEqual(statusKey('ret', 'one'), statusKey('ret', 'two'));
});
test('reconnection restores subscriptions before queued work and authenticates without payload logging', () => {
  const sockets = [],
    timers = [];
  class WS {
    static OPEN = 1;
    static CONNECTING = 0;
    constructor(url) {
      this.url = url;
      this.sent = [];
      this.readyState = 0;
      sockets.push(this);
    }
    send(s) {
      this.sent.push(JSON.parse(s));
    }
    close() {
      this.onclose?.({ code: 1000 });
    }
  }
  const { SocketClient } = loadTS('src/apis/socket.ts', {
    WebSocket: WS,
    window: { __RAGANG_SESSION_TOKEN__: 'synthetic-session' },
    setTimeout: (cb) => {
      timers.push(cb);
      return 1;
    },
    clearTimeout: () => {},
  });
  const client = new SocketClient('ws://127.0.0.1:8081');
  client.subscribe(['history']);
  client.send({ topic: 'start!' });
  client.connect();
  sockets[0].readyState = 1;
  sockets[0].onopen();
  assert.equal(new URL(sockets[0].url).searchParams.get('session_token'), 'synthetic-session');
  assert.deepEqual(
    sockets[0].sent.map((m) => m.topic),
    ['subscribe', 'start!'],
  );
  sockets[0].onclose();
  timers.shift()();
  sockets[1].readyState = 1;
  sockets[1].onopen();
  assert.deepEqual(
    sockets[1].sent.map((m) => m.topic),
    ['subscribe', 'start!'],
  );
  const scheduled = timers.length;
  client.disconnect();
  assert.equal(timers.length, scheduled);
});
test('malformed history is safe and full run dates preserve seconds', () => {
  assert.equal(
    transform.transformData({ states: { q: { snapshots: { ret: 'malformed' }, execution_trace: 'bad' } } }).modules
      .length,
    0,
  );
  assert.equal(analysis.formatRunTime('261025120001'), '2026-10-25 12:00:01');
  assert.notEqual(analysis.formatRunTime('261025120001'), analysis.formatRunTime('261025120002'));
});

test('paired comparison never treats changed questions or judges as a numeric improvement', () => {
  const run = (id, qs) => ({ runId: id, modules: [{ moduleName: 'ret', queries: qs }] });
  const q = (query, id, score, fp = 'same') => ({
    query,
    queryId: id,
    answer: 'a',
    metrics: [metric(score, { evaluator: { implementation: 'judge', fingerprint: fp } })],
  });
  let rows = analysis.compareModuleRuns(
    run('before', [q('hard', 'b', 0.1)]),
    run('after', [q('easy', 'c', 0.9)]),
    'ret',
  );
  assert.equal(rows[0].delta, null);
  assert.equal(rows[0].pairedQueries, 0);
  rows = analysis.compareModuleRuns(run('before', [q('same', 'b', 0.1)]), run('after', [q('same', 'c', 0.9)]), 'ret');
  assert.equal(rows[0].pairedQueries, 1);
  assert.equal(rows[0].evaluatedPairs, 1);
  assert.ok(Math.abs(rows[0].delta - 0.8) < 1e-10);
  rows = analysis.compareModuleRuns(
    run('before', [q('same', 'b', 0.1)]),
    run('after', [q('same', 'c', 0.9, 'changed')]),
    'ret',
  );
  assert.ok(rows.every((r) => r.delta === null));
  const explicitBefore = { ...q('same text', 'b', 0.1), sampleId: 'first' },
    explicitAfter = { ...q('same text', 'c', 0.9), sampleId: 'second' };
  rows = analysis.compareModuleRuns(run('before', [explicitBefore]), run('after', [explicitAfter]), 'ret');
  assert.equal(rows[0].pairedQueries, 0);
  const prior = run('before', [q('one', 'b1', 0.1), q('two', 'b2', 0.2)]);
  const next = run('after', [q('one', 'c1', 0.2), q('two', 'c2', 0.3), q('three', 'c3', 0.4)]);
  prior.queryOutcomes = [
    { queryId: 'b1', query: 'one', answer: 'a' },
    { queryId: 'b2', query: 'two', answer: 'a' },
    { queryId: 'b3', query: 'three', answer: '' },
  ];
  next.queryOutcomes = [
    { queryId: 'c1', query: 'one', answer: 'a' },
    { queryId: 'c2', query: 'two', answer: 'a' },
    { queryId: 'c3', query: 'three', answer: 'a' },
  ];
  rows = analysis.compareModuleRuns(prior, next, 'ret');
  assert.equal(rows[0].pairedQueries, 3);
  assert.equal(rows[0].pairedModuleRecords, 2);
  assert.equal(rows[0].missingModulePairs, 1);
  assert.equal(rows[0].unmatchedQueries, 0);
  assert.equal(rows[0].evaluatedPairs, 2);
});

test('server restart refreshes the same-origin bootstrap before reconnecting with a rotated token', () => {
  const sockets = [],
    timers = [],
    browser = { __RAGANG_SESSION_TOKEN__: 'synthetic-old' };
  class WS {
    static OPEN = 1;
    static CONNECTING = 0;
    constructor(url) {
      this.url = url;
      this.sent = [];
      this.readyState = 0;
      sockets.push(this);
    }
    send(s) {
      this.sent.push(JSON.parse(s));
    }
    close() {
      this.onclose?.();
    }
  }
  const dom = {
    createElement: () => ({ remove() {} }),
    head: {
      appendChild(script) {
        assert.equal(script.src, '/ragang-session.js');
        browser.__RAGANG_SESSION_TOKEN__ = 'synthetic-new';
        script.onload();
      },
    },
  };
  const { SocketClient } = loadTS('src/apis/socket.ts', {
    WebSocket: WS,
    window: browser,
    document: dom,
    setTimeout: (fn) => {
      timers.push(fn);
      return 1;
    },
    clearTimeout() {},
  });
  const client = new SocketClient('ws://127.0.0.1:8081');
  client.connect();
  sockets[0].readyState = 1;
  sockets[0].onopen();
  sockets[0].onclose();
  timers.shift()();
  assert.equal(new URL(sockets[1].url).searchParams.get('session_token'), 'synthetic-new');
});

test('comparison checks sample content and full adapter provenance even when advertised fingerprints match', () => {
  const run = (id, query, adapterVersion) => ({
    runId: id,
    modules: [
      {
        moduleName: 'ret',
        queries: [
          {
            sampleId: 'shared',
            queryId: id,
            query,
            answer: 'a',
            metrics: [
              metric(id === 'before' ? 0.1 : 0.9, {
                evaluator: {
                  fingerprint: 'same',
                  implementation: 'judge',
                  adapters: [{ role: 'llm', model: 'same', implementation_fingerprint: adapterVersion }],
                },
              }),
            ],
          },
        ],
      },
    ],
  });
  const before = run('before', 'hard', 'v1'),
    after = run('after', 'unrelated easy', 'v1');
  assert.equal(analysis.compareModuleRuns(before, after, 'ret')[0].pairedQueries, 0);
  const changed = run('after', 'hard', 'v2');
  assert.notEqual(
    analysis.metricIdentity(before.modules[0].queries[0].metrics[0]),
    analysis.metricIdentity(changed.modules[0].queries[0].metrics[0]),
  );
  assert.ok(analysis.compareModuleRuns(before, changed, 'ret').every((row) => row.delta === null));
});
test('missing initial token can recover and delayed messages from an old connection are ignored', () => {
  const sockets = [],
    timers = [],
    browser = {};
  let received = 0;
  class WS {
    static OPEN = 1;
    static CONNECTING = 0;
    constructor(url) {
      this.url = url;
      this.sent = [];
      this.readyState = 0;
      sockets.push(this);
    }
    send(s) {
      this.sent.push(JSON.parse(s));
    }
    close() {
      this.onclose?.();
    }
  }
  const dom = {
    createElement: () => ({ remove() {} }),
    head: {
      appendChild(script) {
        browser.__RAGANG_SESSION_TOKEN__ = 'synthetic-recovered';
        script.onload();
      },
    },
  };
  const { SocketClient } = loadTS('src/apis/socket.ts', {
    WebSocket: WS,
    window: browser,
    document: dom,
    setTimeout: (fn) => {
      timers.push(fn);
      return 1;
    },
    clearTimeout() {},
  });
  const client = new SocketClient('ws://127.0.0.1:8081');
  client.on('history', () => received++);
  client.connect();
  sockets[0].readyState = 1;
  sockets[0].onopen();
  sockets[0].onclose();
  timers.shift()();
  assert.equal(new URL(sockets[1].url).searchParams.get('session_token'), 'synthetic-recovered');
  sockets[0].onmessage({ data: '{"topic":"history"}' });
  assert.equal(received, 0);
});

test('untrusted history display fields are normalized before React renders them', () => {
  const value = transform.normalizeMetric({
    metric: { bad: 1 },
    unit: { bad: 1 },
    score: 1,
    did_eval: true,
    failure: { type: { bad: 1 }, message: { bad: 1 } },
    scope: { documents_total: 6, documents_evaluated: { bad: 1 } },
    evidence: [{ claim: { bad: 1 }, reason: { bad: 1 }, grounded: 'true', source_document_indices: [{}, -1, 0] }],
    evaluator: { adapters: [null, { role: { bad: 1 }, model: { bad: 1 } }] },
  });
  assert.equal(typeof value.name, 'string');
  assert.equal(typeof value.unit, 'string');
  assert.equal(typeof value.failure.type, 'string');
  assert.equal(typeof value.evidence[0].claim, 'string');
  assert.deepEqual(value.evidence[0].source_document_indices, [0]);
  assert.doesNotThrow(() => analysis.metricIdentity(value));
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { MetricDetails } = loadTS('src/components/MetricDetails.tsx');
  value.evaluator.implementation_fingerprint = { bad: 1 };
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(MetricDetails, { metric: value })));
  const run = transform.transformData({
    run_id: { bad: 1 },
    states: {
      q: {
        execution_trace: [{ execution_id: {}, module_id: {}, status: {}, failure: { type: {} } }],
        diagnosis: { observations: [{ code: {}, message: {} }], inferences: [{ possible_cause: {}, next_action: {} }] },
      },
    },
  });
  assert.equal(typeof run.runId, 'string');
  assert.equal(typeof run.observations[0].message, 'string');
  assert.equal(typeof run.executionTrace[0].moduleId, 'string');
});
test('a valid singleton flow still has a visible topology node', () => {
  const { layoutGraph } = loadTS('src/pages/TestQuery/graph.ts');
  assert.equal(layoutGraph([], ['only']).nodes[0].id, 'only');
});
