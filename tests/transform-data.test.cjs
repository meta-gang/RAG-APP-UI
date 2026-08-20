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
