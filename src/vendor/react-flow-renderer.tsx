import React from "react";
export type Node = {
  id: string;
  data?: Record<string, unknown>;
  position: {
    x: number;
    y: number;
  };
  style?: React.CSSProperties;
};
export type Edge = {
  id: string;
  source: string;
  target: string;
};
export default function ReactFlow({
  nodes,
  children
}: {
  nodes: Node[];
  edges?: Edge[];
  children?: React.ReactNode;
  fitView?: boolean;
}) {
  return <div style={{
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden"
  }}>
      {nodes.map(n => <div key={n.id} style={{
      position: "absolute",
      left: n.position.x,
      top: n.position.y,
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 12,
      ...n.style
    }}>
          {n.data?.label ?? n.id}
        </div>)}
      {children}
    </div>;
}
export function MiniMap() {
  return null;
}
export function Controls() {
  return null;
}
export function Background({
  gap,
  size
}: {
  gap?: number;
  size?: number;
}) {
  return null;
}