import { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils';

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
  const [hovered, setHovered] = useState<number | null>(null);

  if (total === 0) return null;

  const radius = 80;
  const strokeWidth = 28;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute cumulative offsets to avoid mutation during render
  const offsets = segments.reduce<number[]>((acc, _segment, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + segments[i - 1].value / total);
    return acc;
  }, []);

  const chartDescription = segments
    .map(s => `${s.label}: ${formatCurrency(s.value)} (${formatPercent(s.value / total)})`)
    .join(', ');

  return (
    <div className="donut-chart-container" role="figure" aria-label="Gráfico de distribuição salarial">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Gráfico circular: ${chartDescription}`}
      >
        <title>Distribuição salarial - {centerLabel}: {centerValue}</title>

        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.03)"
          strokeWidth={strokeWidth}
        />

        {segments.map((segment, i) => {
          const ratio = segment.value / total;
          const dashLength = circumference * ratio;
          const dashOffset = circumference * offsets[i];
          const isHovered = hovered === i;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              className="donut-segment"
              role="graphics-symbol"
              aria-label={`${segment.label}: ${formatCurrency(segment.value)}`}
              style={{
                animationDelay: `${i * 0.15}s`,
                opacity: hovered !== null && !isHovered ? 0.5 : 1,
                transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Center text */}
        {hovered !== null ? (
          <>
            <text x={center} y={center - 8} textAnchor="middle" className="donut-center-label">
              {segments[hovered].label}
            </text>
            <text x={center} y={center + 16} textAnchor="middle" className="donut-center-value">
              {formatCurrency(segments[hovered].value)}
            </text>
          </>
        ) : (
          <>
            <text x={center} y={center - 8} textAnchor="middle" className="donut-center-label">
              {centerLabel}
            </text>
            <text x={center} y={center + 16} textAnchor="middle" className="donut-center-value">
              {centerValue}
            </text>
          </>
        )}
      </svg>

      <div className="donut-legend" role="list" aria-label="Legenda do gráfico">
        {segments.map((segment, i) => (
          <div
            key={i}
            className={`legend-item ${hovered === i ? 'hovered' : ''}`}
            role="listitem"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="legend-dot" style={{ backgroundColor: segment.color }} aria-hidden="true" />
            <span className="legend-label">{segment.label}</span>
            <span className="legend-value">{formatCurrency(segment.value)}</span>
            <span className="legend-percent">{formatPercent(segment.value / total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
