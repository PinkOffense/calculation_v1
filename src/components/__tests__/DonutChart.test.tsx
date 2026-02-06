import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DonutChart from '../DonutChart';

const segments = [
  { label: 'Líquido', value: 1000, color: '#e8436f' },
  { label: 'SS', value: 165, color: '#ff8fa3' },
  { label: 'IRS', value: 200, color: '#2d2d3f' },
];

describe('DonutChart', () => {
  it('renders SVG with segments', () => {
    const { container } = render(
      <DonutChart segments={segments} centerLabel="Mensal" centerValue="€1 000,00" />
    );
    // One background circle + 3 segment circles
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4); // bg + 3 segments
  });

  it('renders center label and value', () => {
    render(
      <DonutChart segments={segments} centerLabel="Mensal" centerValue="€1 000,00" />
    );
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('€1 000,00')).toBeInTheDocument();
  });

  it('renders legend items', () => {
    render(
      <DonutChart segments={segments} centerLabel="Mensal" centerValue="€1 000,00" />
    );
    expect(screen.getByText('Líquido')).toBeInTheDocument();
    expect(screen.getByText('SS')).toBeInTheDocument();
    expect(screen.getByText('IRS')).toBeInTheDocument();
  });

  it('returns null when total is zero', () => {
    const { container } = render(
      <DonutChart
        segments={[{ label: 'A', value: 0, color: '#f00' }]}
        centerLabel="Test"
        centerValue="€0"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows segment info on hover', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DonutChart segments={segments} centerLabel="Mensal" centerValue="€1 000,00" />
    );

    // Hover over the first segment circle (index 1, because 0 is bg)
    const segmentCircles = container.querySelectorAll('circle.donut-segment');
    expect(segmentCircles.length).toBe(3);

    await user.hover(segmentCircles[0]);

    // "Líquido" appears in both SVG center text and legend
    expect(screen.getAllByText('Líquido').length).toBeGreaterThanOrEqual(2);
  });
});
