const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function generate(n=67) {
  const nodes = [];
  for (let i=0;i<n;i++) nodes.push('N'+(i+1));
  const edges = [];

  // first make a spanning chain to ensure connectivity
  for (let i=0;i<n-1;i++) {
    edges.push({ from: nodes[i], to: nodes[i+1], weight: Math.floor(Math.random()*10)+1, capacity: Math.floor(Math.random()*8)+3 });
  }

  // add random extra edges
  const extra = Math.floor(n * 1.5);
  for (let i=0;i<extra;i++) {
    const a = nodes[Math.floor(Math.random()*n)];
    const b = nodes[Math.floor(Math.random()*n)];
    if (a===b) continue;
    edges.push({ from: a, to: b, weight: Math.floor(Math.random()*12)+1, capacity: Math.floor(Math.random()*8)+3 });
  }

  return { nodes, edges };
}

const g = generate(67);
fs.writeFileSync('graph.json', JSON.stringify(g, null, 2));
console.log('graph.json created with', g.nodes.length, 'nodes and', g.edges.length, 'edges');
