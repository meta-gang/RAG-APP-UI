export type GraphPair = [string, string];
export const GRAPH_NODE_WIDTH = 280;
export const GRAPH_NODE_HEIGHT = 120;
export const GRAPH_FIT_VIEW_OPTIONS = { padding: 0.15, minZoom: 0.1, maxZoom: 1 };
const MAX_COLUMNS = 3;
const COLUMN_SPACING = 360;
const ROW_SPACING = 180;

/** Strongly connected components identify actual cycles; a cross edge in a DAG is never a loop. */
export function layoutGraph(input: GraphPair[], additionalIds: string[] = []) {
  const pairs = input.filter(
    (p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'string' && x.length),
  );
  const ids = Array.from(
    new Set([...pairs.flat(), ...additionalIds.filter((id) => typeof id === 'string' && id.length)]),
  ).sort();
  const adjacency = new Map(ids.map((id) => [id, pairs.filter((p) => p[0] === id).map((p) => p[1])]));
  let index = 0;
  const indexes = new Map<string, number>(),
    low = new Map<string, number>(),
    stack: string[] = [],
    onStack = new Set<string>(),
    components: string[][] = [];
  function visit(id: string) {
    indexes.set(id, index);
    low.set(id, index++);
    stack.push(id);
    onStack.add(id);
    for (const next of adjacency.get(id) || []) {
      if (!indexes.has(next)) {
        visit(next);
        low.set(id, Math.min(low.get(id)!, low.get(next)!));
      } else if (onStack.has(next)) low.set(id, Math.min(low.get(id)!, indexes.get(next)!));
    }
    if (low.get(id) === indexes.get(id)) {
      const component: string[] = [];
      let node: string;
      do {
        node = stack.pop()!;
        onStack.delete(node);
        component.push(node);
      } while (node !== id);
      components.push(component.sort());
    }
  }
  ids.forEach((id) => {
    if (!indexes.has(id)) visit(id);
  });
  const componentOf = new Map<string, number>();
  components.forEach((c, i) => c.forEach((id) => componentOf.set(id, i)));
  const edges = new Set(
    pairs
      .filter(([a, b]) => componentOf.get(a) !== componentOf.get(b))
      .map(([a, b]) => `${componentOf.get(a)}:${componentOf.get(b)}`),
  );
  const levels = components.map(() => 0),
    indegrees = components.map(() => 0);
  edges.forEach((e) => indegrees[Number(e.split(':')[1])]++);
  const queue = indegrees.flatMap((d, i) => (d === 0 ? [i] : []));
  while (queue.length) {
    const from = queue.shift()!;
    for (const edge of Array.from(edges)) {
      const [a, b] = edge.split(':').map(Number);
      if (a !== from) continue;
      levels[b] = Math.max(levels[b], levels[a] + 1);
      if (--indegrees[b] === 0) queue.push(b);
    }
  }
  const rows = new Map<number, string[]>();
  ids.forEach((id) => {
    const level = levels[componentOf.get(id)!];
    rows.set(level, [...(rows.get(level) || []), id]);
  });
  const positions = new Map<string, { x: number; y: number }>();
  const columns = Math.min(MAX_COLUMNS, Math.max(1, ...Array.from(rows.values()).map((row) => row.length)));
  let nextY = 0;
  // A large SCC shares a topological level but must not become one unbounded
  // horizontal row. Reserve every wrapped row before laying out downstream levels.
  Array.from(rows.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([, row]) => {
      const rowCount = Math.ceil(row.length / columns);
      row.forEach((id, index) => {
        const wrappedRow = Math.floor(index / columns),
          column = index % columns;
        const countInRow = Math.min(columns, row.length - wrappedRow * columns);
        const centerOffset = ((columns - countInRow) * COLUMN_SPACING) / 2;
        positions.set(id, { x: centerOffset + column * COLUMN_SPACING, y: nextY + wrappedRow * ROW_SPACING });
      });
      nextY += rowCount * ROW_SPACING;
    });
  return {
    nodes: ids.map((id) => ({ id, position: positions.get(id)! })),
    edges: pairs.map(([source, target]) => ({
      source,
      target,
      isCycle:
        componentOf.get(source) === componentOf.get(target) &&
        (source === target || components[componentOf.get(source)!].length > 1),
    })),
  };
}
