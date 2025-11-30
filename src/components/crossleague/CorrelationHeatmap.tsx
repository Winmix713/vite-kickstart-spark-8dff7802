import React from "react";
export interface CorrelationHeatmapProps {
  labels: string[];
  matrix: number[][]; // values in [-1, 1]
  size?: number; // cell size in px
}
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function valueToColor(v: number): string {
  // clamp
  const x = Math.max(-1, Math.min(1, v));
  // red -> white -> green
  const red = [239, 68, 68];
  const white = [255, 255, 255];
  const green = [34, 197, 94];
  let r: number, g: number, b: number;
  if (x < 0) {
    const t = (x + 1) / 1; // -1..0 -> 0..1
    r = lerp(red[0], white[0], t);
    g = lerp(red[1], white[1], t);
    b = lerp(red[2], white[2], t);
  } else {
    const t = x; // 0..1
    r = lerp(white[0], green[0], t);
    g = lerp(white[1], green[1], t);
    b = lerp(white[2], green[2], t);
  }
  return `rgb(${r}, ${g}, ${b})`;
}
const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  labels,
  matrix,
  size = 32
}) => {
  const n = labels.length;
  const width = size * (n + 1);
  const height = size * (n + 1);
  return <div className="overflow-x-auto">
      <svg width={width} height={height} className="rounded-lg ring-1 ring-border bg-card">
        {/* Labels top */}
        {labels.map((lab, i) => <text key={`t-${i}`} x={(i + 1) * size + size / 2} y={size / 2} textAnchor="middle" fontSize={11} fill="#6b7280">
            {lab}
          </text>)}
        {/* Labels left */}
        {labels.map((lab, i) => <text key={`l-${i}`} x={size / 2} y={(i + 1) * size + size / 2} textAnchor="middle" fontSize={11} fill="#6b7280">
            {lab}
          </text>)}
        {/* Grid */}
        {matrix.map((row, i) => row.map((val, j) => {
        const x = (j + 1) * size;
        const y = (i + 1) * size;
        const v = typeof val === "number" && Number.isFinite(val) ? val : 0;
        const fill = valueToColor(v);
        return <g key={`c-${i}-${j}`}> 
                <rect x={x} y={y} width={size - 2} height={size - 2} fill={fill} rx={4} />
                <text x={x + (size - 2) / 2} y={y + (size - 2) / 2 + 4} textAnchor="middle" fontSize={11} fill="#111827">
                  {v.toFixed(2)}
                </text>
              </g>;
      }))}
      </svg>
    </div>;
};
export default CorrelationHeatmap;