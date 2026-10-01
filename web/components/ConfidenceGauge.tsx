"use client";
import { useId } from "react";

export function ConfidenceGauge({
  score,
  threshold,
  passed,
  width = 280,
}: {
  score: number;
  threshold: number;
  passed: boolean;
  width?: number;
}) {
  const gradientId = useId();
  const min = -0.3;
  const max = 1.0;
  const barHeight = 14;
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const toX = (v: number) => ((clamp(v) - min) / (max - min)) * width;

  const scoreX = toX(score);
  const thresholdX = toX(threshold);

  return (
    <div className="my-3 inline-block">
      <svg width={width} height={50} viewBox={`0 0 ${width} 50`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <rect x={0} y={18} width={width} height={barHeight} rx={7} fill={`url(#${gradientId})`} opacity={0.85} />
        <line x1={thresholdX} y1={10} x2={thresholdX} y2={40} stroke="#374151" strokeWidth={2} strokeDasharray="3,2" />
        <text x={thresholdX} y={9} fontSize={9} textAnchor="middle" fill="#374151">
          threshold
        </text>
        <circle
          cx={scoreX}
          cy={25}
          r={9}
          fill={passed ? "#16a34a" : "#dc2626"}
          stroke="white"
          strokeWidth={2}
          className="transition-all duration-500"
        />
      </svg>
      <div className="flex justify-between text-xs text-gray-500" style={{ width }}>
        <span>
          score: <strong className={passed ? "text-green-700" : "text-red-700"}>{score.toFixed(3)}</strong>
        </span>
        <span>needs ≥ {threshold.toFixed(2)}</span>
      </div>
    </div>
  );
}
