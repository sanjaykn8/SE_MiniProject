// returns {distance, pathArray}
function dijkstra(nodes, edges, source, target) {
  // build adjacency
  const adj = {};
  nodes.forEach(n => adj[n] = []);
  edges.forEach(e => {
    adj[e.from].push({to: e.to, w: e.weight});
    adj[e.to].push({to: e.from, w: e.weight}); // undirected
  });

  const dist = {};
  const prev = {};
  const visited = new Set();
  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[source] = 0;

  // simple priority queue (min-heap) using array - ok for 67 nodes
  const pq = [{node: source, d: 0}];

  while (pq.length) {
    // pop min
    pq.sort((a,b) => a.d - b.d);
    const {node: u} = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === target) break;
    for (const {to, w} of adj[u]) {
      const alt = dist[u] + w;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        pq.push({node: to, d: alt});
      }
    }
  }

  if (dist[target] === Infinity) return { distance: Infinity, path: [] };
  const path = [];
  let cur = target;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  return { distance: dist[target], path };
}

module.exports = { dijkstra };
