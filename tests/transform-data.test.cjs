const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadTransformData() {
  const sourcePath = path.join(__dirname, '..', 'src', 'pages', 'Dashboard', 'transformData.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;
  const localModule = { exports: {} };
  Function('module', 'exports', 'require', compiled)(localModule, localModule.exports, require);
  return localModule.exports.transformData;
}

test('transformData preserves explicit not-evaluated metric state', () => {
  const transformData = loadTransformData();
  const run = transformData({
    ts: '260820120000',
    states: {
      query1: {
        query: 'question',
        gen: 'answer',
        snapshots: {
          output: [
            {
              data: { gen: 'answer' },
              performances: [
                {
                  _Performance__score: null,
                  _Performance__metric: 'Judge metric',
                  _Performance__did_eval: false,
                },
              ],
            },
          ],
        },
        performances: [],
      },
    },
  });

  assert.deepEqual(run.modules[0].queries[0].metrics[0], {
    name: 'Judge metric',
    score: null,
    didEval: false,
    unit: '',
  });
});

test('transformData keeps a valid zero distinct from missing data', () => {
  const transformData = loadTransformData();
  const run = transformData({
    ts: '260820120000',
    states: {
      query1: {
        query: 'question',
        gen: 'answer',
        snapshots: {},
        performances: [
          {
            _Performance__score: 0,
            _Performance__metric: 'Valid zero',
            _Performance__did_eval: true,
          },
        ],
      },
    },
  });

  assert.deepEqual(run.modules[0].queries[0].metrics[0], {
    name: 'Valid zero',
    score: 0,
    didEval: true,
    unit: '',
  });
});

test('transformData exposes evaluator health and separates diagnostic evidence', () => {
  const transformData = loadTransformData();
  const run = transformData({
    ts: '260820120000',
    states: {
      query1: {
        query: 'question',
        gen: 'answer',
        run_metadata: { config_fingerprint: 'config-123' },
        snapshots: {},
        performances: [
          { _Performance__metric: 'Good', _Performance__score: 10, _Performance__did_eval: true },
          { _Performance__metric: 'Failed', _Performance__score: 0, _Performance__did_eval: false },
        ],
        diagnosis: {
          observations: [
            { code: 'evaluator.not_evaluated', stage: 'e2e', message: 'parse failed', failure_type: 'parse_error' },
          ],
          inferences: [
            { code: 'evaluator_health_risk', possible_cause: 'judge unstable', confidence: 'medium', next_action: 'retry' },
          ],
        },
      },
    },
  });

  assert.deepEqual(run.evaluatorHealth, { evaluated: 1, notEvaluated: 1, coverage: 0.5 });
  assert.equal(run.configFingerprint, 'config-123');
  assert.equal(run.observations[0].failureType, 'parse_error');
  assert.equal(run.inferences[0].possibleCause, 'judge unstable');
});

test('transformData preserves every repeated module execution and graph trace', () => {
  const transformData = loadTransformData();
  const run = transformData({
    ts: '260820120000',
    states: {
      query1: {
        query: 'question',
        gen: 'answer',
        snapshots: {
          rewrite: [
            { data: {}, performances: [{ _Performance__metric: 'Score', _Performance__score: 10, _Performance__did_eval: true, _Performance__unit: '%' }] },
            { data: {}, performances: [{ _Performance__metric: 'Score', _Performance__score: 20, _Performance__did_eval: true, _Performance__unit: '%' }] },
            { data: {}, performances: [{ _Performance__metric: 'Score', _Performance__score: 30, _Performance__did_eval: true, _Performance__unit: '%' }] },
          ],
        },
        execution_trace: [
          { execution_id: 'exec-1', module_id: 'rewrite', execution_index: 1, revisit_count: 0, status: 'completed', latency_seconds: 0.1 },
          { execution_id: 'exec-2', module_id: 'rewrite', execution_index: 2, revisit_count: 1, parent_execution_ids: ['exec-1'], status: 'completed', latency_seconds: 0.2 },
          { execution_id: 'exec-3', module_id: 'rewrite', execution_index: 3, revisit_count: 2, parent_execution_ids: ['exec-2'], status: 'completed', latency_seconds: 0.3 },
        ],
        execution_summary: { terminated: false },
        performances: [],
      },
    },
  });

  assert.equal(run.modules[0].queries.length, 3);
  assert.deepEqual(run.modules[0].queries.map((query) => query.executionIndex), [1, 2, 3]);
  assert.deepEqual(run.modules[0].queries.map((query) => query.metrics[0].score), [10, 20, 30]);
  assert.equal(run.executionTrace.length, 3);
  assert.equal(run.executionTrace[1].parentExecutionIds[0], 'exec-1');
  assert.equal(run.graphHealth.moduleRevisits, 2);
  assert.equal(run.graphHealth.totalLatencySeconds, 0.6000000000000001);
});
