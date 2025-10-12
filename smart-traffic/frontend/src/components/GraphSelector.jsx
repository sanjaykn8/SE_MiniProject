// src/components/GraphSelector.jsx
import React, { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

/*
Auto-resizing GraphSelector. Click node = source, Ctrl/Cmd+Click = dest.
Props:
  graph: { nodes, links }
  onSelect(nodeId, role)
  selected: { src, dest }
  highlightPath: []
*/

export default function GraphSelector({
  graph = { nodes: [], links: [] },
  onSelect = () => {},
  selected = {},
  highlightPath = []
}) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 420 });

  // ResizeObserver to auto-size canvas to container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function update() {
      const w = Math.max(300, el.clientWidth);
      const h = Math.max(300, Math.round(Math.max(400, window.innerHeight * 0.55)));
      setSize({ width: w, height: h });
      // fit to view after resize
      if (fgRef.current && typeof fgRef.current.zoomToFit === 'function') {
        fgRef.current.zoomToFit(400, 50);
      }
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // build quick lookup set for path highlight
  const pathSet = new Set();
  if (highlightPath && highlightPath.length) {
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = highlightPath[i], b = highlightPath[i+1];
      pathSet.add(`${a}__${b}`);
      pathSet.add(`${b}__${a}`);
    }
  }

  // ensure nodes have ids (force-graph expects id fields)
  const nodes = (graph.nodes || []).map(n => (typeof n === 'string' ? { id: n } : n));
  const links = (graph.links || []).map(l => ({ source: l.source, target: l.target, weight: l.weight || 1 }));

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 360 }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        width={size.width}
        height={size.height}
        nodeLabel={n => `${n.id}`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const r = 6;
          const label = node.id;
          // choose fill
          let fill = "#888";
          if (selected.src === node.id) fill = "#06B6D4";
          else if (selected.dest === node.id) fill = "#6D28D9";
          else if (highlightPath && highlightPath.includes(node.id)) fill = "#ffd54f";
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2*Math.PI, false);
          ctx.fillStyle = fill;
          ctx.fill();
          // label
          ctx.fillStyle = "#fff";
          ctx.font = `${12/globalScale}px Sans-Serif`;
          ctx.fillText(label, node.x + 8, node.y + 4);
        }}
        onNodeClick={(node, event) => {
          // ensure we get actual mouse event (some browsers may give undefined)
          const isDest = (event && (event.ctrlKey || event.metaKey));
          const role = isDest ? "dest" : "src";
          onSelect(node.id, role);
        }}
        onNodeHover={() => {}}
        linkColor={link => pathSet.has(`${link.source}__${link.target}`) ? "#ffd54f" : "rgba(255,255,255,0.12)"}
        linkWidth={link => pathSet.has(`${link.source}__${link.target}`) ? 3 : 1}
        linkDirectionalParticles={link => pathSet.has(`${link.source}__${link.target}`) ? 2 : 0}
        nodeRelSize={6}
        backgroundColor="transparent"
        enablePointerInteraction={true}
        cooldownTicks={100}
      />
    </div>
  );
}
