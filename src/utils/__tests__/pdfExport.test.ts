import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPdf } from '../pdfExport';
import { calculateSalary } from '../calculator';
import { createInput } from '../../test/fixtures';

// Mock jsPDF to avoid actual PDF generation in tests
const mockSave = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockAddPage = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: function jsPDF() {
      return {
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        text: mockText,
        rect: mockRect,
        roundedRect: mockRoundedRect,
        line: mockLine,
        setFont: mockSetFont,
        setFontSize: mockSetFontSize,
        setTextColor: mockSetTextColor,
        setFillColor: mockSetFillColor,
        setDrawColor: mockSetDrawColor,
        setLineWidth: mockSetLineWidth,
        addPage: mockAddPage,
        save: mockSave,
      };
    },
  };
});

describe('exportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates PDF for employed result and calls save', () => {
    const input = createInput({ grossMonthly: 2000 });
    const result = calculateSalary(input);

    exportPdf(input, result);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining('salario-pt-employed'));
  });

  it('generates PDF for self-employed result', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      activityType: 'services',
    });
    const result = calculateSalary(input);

    exportPdf(input, result);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining('salario-pt-self_employed'));
  });

  it('generates PDF for comparison result', () => {
    const input = createInput({
      employmentType: 'compare',
      grossMonthly: 2500,
    });
    const result = calculateSalary(input);

    exportPdf(input, result);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining('salario-pt-comparison'));
  });

  it('includes the header with correct title', () => {
    const input = createInput({ grossMonthly: 1500 });
    const result = calculateSalary(input);

    exportPdf(input, result);

    expect(mockText).toHaveBeenCalledWith(
      'Simulação Salarial',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('renders meal allowance info when present', () => {
    const input = createInput({
      grossMonthly: 2000,
      mealAllowancePerDay: 7.63,
    });
    const result = calculateSalary(input);

    exportPdf(input, result);

    const allTextCalls = mockText.mock.calls.map(c => c[0]);
    expect(allTextCalls.some((t: string) => t.includes('Sub. Alimentação'))).toBe(true);
  });

  it('renders IRS Jovem info when active', () => {
    const input = createInput({
      grossMonthly: 2000,
      irsJovem: true,
      irsJovemYear: 1,
    });
    const result = calculateSalary(input);

    exportPdf(input, result);

    const allTextCalls = mockText.mock.calls.map(c => c[0]);
    expect(allTextCalls.some((t: string) => t.includes('IRS Jovem'))).toBe(true);
  });

  it('filename includes current date', () => {
    const input = createInput({ grossMonthly: 1500 });
    const result = calculateSalary(input);
    const today = new Date().toISOString().slice(0, 10);

    exportPdf(input, result);

    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining(today));
  });
});
