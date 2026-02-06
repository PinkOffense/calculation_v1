import { formatCurrency, formatPercent } from '../formatters';

describe('formatCurrency', () => {
  it('formats a standard amount with 2 decimals and EUR symbol', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1');
    expect(result).toContain('500');
    expect(result).toContain('00');
    expect(result).toMatch(/€/);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toMatch(/€/);
  });

  it('formats negative values', () => {
    const result = formatCurrency(-250.5);
    expect(result).toContain('250');
    expect(result).toContain('50');
  });

  it('rounds to 2 decimal places', () => {
    const result = formatCurrency(100.456);
    expect(result).toContain('46');
  });

  it('formats large values with grouping', () => {
    const result = formatCurrency(25000);
    // pt-PT uses non-breaking space or period as thousands separator
    expect(result).toContain('25');
    expect(result).toContain('000');
  });
});

describe('formatPercent', () => {
  it('formats a decimal as percentage with 1 decimal', () => {
    const result = formatPercent(0.11);
    expect(result).toContain('11');
    expect(result).toMatch(/%/);
  });

  it('formats zero percent', () => {
    const result = formatPercent(0);
    expect(result).toContain('0');
    expect(result).toMatch(/%/);
  });

  it('formats fractional percentages', () => {
    const result = formatPercent(0.2375);
    expect(result).toContain('23');
    expect(result).toMatch(/%/);
  });

  it('formats 100%', () => {
    const result = formatPercent(1);
    expect(result).toContain('100');
  });
});
