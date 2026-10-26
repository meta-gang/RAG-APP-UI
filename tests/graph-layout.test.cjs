const assert = require('node:assert/strict');
const test = require('node:test');
const { getViewportForBounds } = require('reactflow');
const { loadTS } = require('./load-ts.cjs');
const edges = require('./fixtures/hybrid-cycle-edges.json');
const { layoutGraph, GRAPH_NODE_WIDTH, GRAPH_NODE_HEIGHT, GRAPH_FIT_VIEW_OPTIONS } =
  loadTS('src/pages/TestQuery/graph.ts');

test('hybrid cyclic graph wraps its six-node SCC and reserves downstream vertical space', () => {
  const graph = layoutGraph(edges),
    byId = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  assert.equal(graph.nodes.length, 8);
  assert.equal(graph.edges.length, 9);
  const scc = ['router', 'keyword', 'graph_search', 'merge', 'draft', 'critic'].map((id) => byId[id]);
  assert.equal(new Set(scc.map((node) => node.position.y)).size, 2);
  const rows = new Map();
  graph.nodes.forEach((node) => rows.set(node.position.y, [...(rows.get(node.position.y) || []), node]));
  assert.ok(Array.from(rows.values()).every((row) => row.length <= 3));
  assert.ok(byId.starter.position.y + GRAPH_NODE_HEIGHT <= Math.min(...scc.map((node) => node.position.y)));
  assert.ok(byId.final.position.y >= Math.max(...scc.map((node) => node.position.y)) + GRAPH_NODE_HEIGHT);
  assert.equal(new Set(graph.nodes.map((node) => `${node.position.x}:${node.position.y}`)).size, graph.nodes.length);
  graph.nodes.forEach((a, i) =>
    graph.nodes.slice(i + 1).forEach((b) => {
      const separated =
        a.position.x + GRAPH_NODE_WIDTH <= b.position.x ||
        b.position.x + GRAPH_NODE_WIDTH <= a.position.x ||
        a.position.y + GRAPH_NODE_HEIGHT <= b.position.y ||
        b.position.y + GRAPH_NODE_HEIGHT <= a.position.y;
      assert.ok(separated, `${a.id} and ${b.id} must not overlap`);
    }),
  );
});

test('the complete hybrid graph bounding box fits the actual desktop and narrow panel sizes', () => {
  const nodes = layoutGraph(edges).nodes;
  const left = Math.min(...nodes.map((node) => node.position.x)),
    top = Math.min(...nodes.map((node) => node.position.y));
  const bounds = {
    x: left,
    y: top,
    width: Math.max(...nodes.map((node) => node.position.x + GRAPH_NODE_WIDTH)) - left,
    height: Math.max(...nodes.map((node) => node.position.y + GRAPH_NODE_HEIGHT)) - top,
  };
  for (const [width, height] of [
    [710, 552],
    [488, 352],
  ]) {
    const viewport = getViewportForBounds(
      bounds,
      width,
      height,
      GRAPH_FIT_VIEW_OPTIONS.minZoom,
      GRAPH_FIT_VIEW_OPTIONS.maxZoom,
      GRAPH_FIT_VIEW_OPTIONS.padding,
    );
    assert.ok(viewport.zoom >= 0.1);
    nodes.forEach((node) => {
      const x = node.position.x * viewport.zoom + viewport.x,
        y = node.position.y * viewport.zoom + viewport.y;
      assert.ok(
        x >= 0 &&
          y >= 0 &&
          x + GRAPH_NODE_WIDTH * viewport.zoom <= width &&
          y + GRAPH_NODE_HEIGHT * viewport.zoom <= height,
        `${node.id} must fit ${width}x${height}`,
      );
    });
  }
});
