import React from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node } from "@/vendor/react-flow-renderer";
import type { ComputationGraphResponse } from "@/types/monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface Props {
  graph: ComputationGraphResponse | null;
}
const statusStyles: Record<string, React.CSSProperties> = {
  healthy: {
    background: "#064e3b",
    color: "#a7f3d0",
    border: "1px solid rgba(16,185,129,0.4)"
  },
  degraded: {
    background: "#513c06",
    color: "#fde68a",
    border: "1px solid rgba(234,179,8,0.4)"
  },
  down: {
    background: "#601b1d",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.4)"
  }
};
export function ComputationMapDashboard({
  graph
}: Props) {
  const nodes: Node[] = (graph?.nodes ?? []).map(n => ({
    id: n.id,
    data: {
      label: `${n.data.label}`
    },
    position: n.position,
    style: statusStyles[n.data.status] ?? {
      background: "#111827",
      color: "#e5e7eb",
      border: "1px solid rgba(255,255,255,0.08)"
    }
  }));
  const edges: Edge[] = (graph?.edges ?? []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target
  }));
  return <Card className="border-border/60 bg-muted/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Computation Map</CardTitle>
      </CardHeader>
      <CardContent style={{
      height: 420
    }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap />
          <Controls />
          <Background gap={16} size={1} />
        </ReactFlow>
      </CardContent>
    </Card>;
}
export default ComputationMapDashboard;