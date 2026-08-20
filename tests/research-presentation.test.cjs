const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8');

test('dashboard does not publish a heterogeneous overall score or module ranking', () => {
  const view = read('src', 'pages', 'Dashboard', 'DashboardView.tsx');
  const page = read('src', 'pages', 'Dashboard', 'index.tsx');

  assert.doesNotMatch(view, /Overall Score|Perf\. Change|Lowest Module/);
  assert.doesNotMatch(page, /overallScore|worstModule|performanceChange/);
  assert.match(view, /Evaluator Coverage by Module/);
});

test('live score presentation keeps declared units and every repeated snapshot', () => {
  const livePage = read('src', 'pages', 'TestQuery', 'index.tsx');
  const liveView = read('src', 'pages', 'TestQuery', 'TestQueryView.tsx');
  const dashboardTransform = read('src', 'pages', 'Dashboard', 'transformData.ts');

  assert.doesNotMatch(livePage, /score\s*<=\s*1/);
  assert.doesNotMatch(livePage, /snapshots\[0\]/);
  assert.doesNotMatch(dashboardTransform, /moduleSnapshots\[0\]/);
  assert.match(livePage, /m\.unit/);
  assert.match(liveView, /scores retain declared units/);
});
