import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsPanel from '../results';
import { calculateSalary } from '../../utils';
import { createInput } from '../../test/fixtures';
import type { EmployedResult, SelfEmployedResult, ComparisonResult } from '../../utils';

// Mock useAnimatedValue to return value instantly (no RAF in tests)
vi.mock('../../hooks/useAnimatedValue', () => ({
  useAnimatedValue: (v: number) => v,
}));

// Mock pdfExport to avoid jsPDF in DOM tests
vi.mock('../../utils/pdfExport', () => ({
  exportPdf: vi.fn(),
}));

describe('ResultsPanel — employed results', () => {
  const input = createInput({ grossMonthly: 1500 });
  const result = calculateSalary(input) as EmployedResult;

  it('renders the results header', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Resultados')).toBeInTheDocument();
  });

  it('renders monthly/annual toggle', () => {
    render(<ResultsPanel result={result} />);
    // "Mensal" appears in toggle button and donut center
    expect(screen.getAllByText('Mensal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Anual')).toBeInTheDocument();
  });

  it('shows hero label "Salário Líquido Mensal"', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Salário Líquido Mensal')).toBeInTheDocument();
  });

  it('shows SS deduction row', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText(/Segurança Social/)).toBeInTheDocument();
  });

  it('shows IRS deduction row', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText(/Retenção IRS/)).toBeInTheDocument();
  });

  it('shows employer cost section', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Custo para a Empresa')).toBeInTheDocument();
  });

  it('shows effective rate cards', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Taxa Efetiva IRS')).toBeInTheDocument();
    expect(screen.getByText('Taxa Total Descontos')).toBeInTheDocument();
  });

  it('switches to annual view when clicking Anual', async () => {
    const user = userEvent.setup();
    render(<ResultsPanel result={result} />);

    await user.click(screen.getByText('Anual'));

    expect(screen.getByText('Salário Líquido Anual')).toBeInTheDocument();
  });

  it('shows meal allowance info when present', () => {
    const withMeal = calculateSalary(createInput({
      grossMonthly: 1500, mealAllowancePerDay: 7.63,
    })) as EmployedResult;
    render(<ResultsPanel result={withMeal} />);
    // "sub. alimentação" appears in hero subtitle and breakdown row
    expect(screen.getAllByText(/sub\. alimentação/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows IRS Jovem badge when active', () => {
    const withJovem = calculateSalary(createInput({
      grossMonthly: 2000, irsJovem: true, irsJovemYear: 1,
    })) as EmployedResult;
    render(<ResultsPanel result={withJovem} />);
    expect(screen.getByText(/IRS Jovem/)).toBeInTheDocument();
  });
});

describe('ResultsPanel — self-employed results', () => {
  const input = createInput({
    employmentType: 'self_employed',
    grossMonthly: 3000,
    activityType: 'services',
  });
  const result = calculateSalary(input) as SelfEmployedResult;

  it('shows "Rendimento Líquido Mensal" hero', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Rendimento Líquido Mensal')).toBeInTheDocument();
  });

  it('shows "Faturação Bruta" in breakdown', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Faturação Bruta')).toBeInTheDocument();
  });

  it('shows fiscal info section', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Informação Fiscal')).toBeInTheDocument();
    expect(screen.getByText('Coeficiente aplicável')).toBeInTheDocument();
  });

  it('shows equivalence card', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Equivalente por conta de outrem')).toBeInTheDocument();
  });

  it('shows IVA row when VAT is active', () => {
    const withVat = calculateSalary(createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      vatRegime: 'normal',
    })) as SelfEmployedResult;
    render(<ResultsPanel result={withVat} />);
    expect(screen.getByText(/IVA a entregar/)).toBeInTheDocument();
  });
});

describe('ResultsPanel — comparison results', () => {
  const input = createInput({ employmentType: 'compare', grossMonthly: 2000 });
  const result = calculateSalary(input) as ComparisonResult;

  it('shows "Comparação" header', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Comparação')).toBeInTheDocument();
  });

  it('shows winner banner', () => {
    render(<ResultsPanel result={result} />);
    expect(
      screen.getByText(/Melhor opção|Resultado semelhante/)
    ).toBeInTheDocument();
  });

  it('shows VS divider', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('shows side-by-side breakdown table', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText('Detalhe')).toBeInTheDocument();
    // "Outrem" and "Indep." appear in both breakdown header and rate labels
    expect(screen.getAllByText('Outrem').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Indep.').length).toBeGreaterThanOrEqual(1);
  });

  it('shows employer cost section for employed side', () => {
    render(<ResultsPanel result={result} />);
    expect(screen.getByText(/Custo Empregador/)).toBeInTheDocument();
  });

  it('has comparison-mode class', () => {
    const { container } = render(<ResultsPanel result={result} />);
    expect(container.querySelector('.comparison-mode')).toBeInTheDocument();
  });

  it('shows rate comparison bars', () => {
    render(<ResultsPanel result={result} />);
    const irsHeaders = screen.getAllByText('Taxa Efetiva IRS');
    expect(irsHeaders.length).toBeGreaterThanOrEqual(1);
  });
});

describe('ResultsPanel — PDF export button', () => {
  it('shows export button when input is provided', () => {
    const input = createInput({ grossMonthly: 1500 });
    const result = calculateSalary(input) as EmployedResult;
    render(<ResultsPanel result={result} input={input} />);
    expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
  });

  it('does not show export button when input is not provided', () => {
    const input = createInput({ grossMonthly: 1500 });
    const result = calculateSalary(input) as EmployedResult;
    render(<ResultsPanel result={result} />);
    expect(screen.queryByText('Exportar PDF')).not.toBeInTheDocument();
  });

  it('calls exportPdf when button is clicked', async () => {
    const { exportPdf } = await import('../../utils/pdfExport');
    const user = userEvent.setup();
    const input = createInput({ grossMonthly: 2000 });
    const result = calculateSalary(input) as EmployedResult;
    render(<ResultsPanel result={result} input={input} />);

    await user.click(screen.getByText('Exportar PDF'));

    expect(exportPdf).toHaveBeenCalledWith(input, result);
  });
});
