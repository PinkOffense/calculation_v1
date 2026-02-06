import { formatCurrency, formatPercent } from '../utils/taxCalculator';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}

export default function DonutChart({ segments, centerLabel, centerValue, size = 220 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = 80;
  const strokeWidth = 28;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="donut-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, i) => {
          const ratio = segment.value / total;
          const dashLength = circumference * ratio;
          const dashOffset = circumference * cumulativeOffset;
          cumulativeOffset += ratio;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              className="donut-segment"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          );
        })}
        <text x={center} y={center - 8} textAnchor="middle" className="donut-center-label">
          {centerLabel}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" className="donut-center-value">
          {centerValue}
        </text>
      </svg>

      <div className="donut-legend">
        {segments.map((segment, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: segment.color }} />
            <span className="legend-label">{segment.label}</span>
            <span className="legend-value">{formatCurrency(segment.value)}</span>
            <span className="legend-percent">{formatPercent(segment.value / total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
