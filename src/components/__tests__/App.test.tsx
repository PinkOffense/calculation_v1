import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock useAnimatedValue for deterministic rendering
vi.mock('../../hooks/useAnimatedValue', () => ({
  useAnimatedValue: (v: number) => v,
}));

// Mock useTaxTables to avoid network fetches in tests
vi.mock('../../hooks/useTaxTables', () => ({
  useTaxTables: () => ({
    tables: null,
    version: '2026.1',
    loading: false,
    error: false,
  }),
}));

describe('App — full integration', () => {
  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByText('Salário PT')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    expect(screen.getByText(/Calculadora de Salário Líquido/)).toBeInTheDocument();
  });

  it('renders input form and results panel', () => {
    render(<App />);
    // Input form elements
    expect(screen.getByLabelText(/Salário Bruto Mensal/)).toBeInTheDocument();
    // Results panel elements
    expect(screen.getByText('Resultados')).toBeInTheDocument();
  });

  it('renders footer disclaimer', () => {
    render(<App />);
    expect(screen.getByText(/Valores indicativos/)).toBeInTheDocument();
  });

  it('updates results when salary changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    const grossInput = screen.getByLabelText(/Salário Bruto Mensal/);

    // Get initial hero value text
    const heroBefore = screen.getByText('Salário Líquido Mensal')
      .closest('.net-salary-hero')?.textContent;

    // Change salary
    await user.clear(grossInput);
    await user.type(grossInput, '3000');

    // Hero value should have changed
    const heroAfter = screen.getByText('Salário Líquido Mensal')
      .closest('.net-salary-hero')?.textContent;

    expect(heroAfter).not.toBe(heroBefore);
  });

  it('switches to self-employed mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click the "Independente" button
    const selfEmpBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Independente')
    );
    await user.click(selfEmpBtn!);

    // Should show self-employed results
    expect(screen.getByText('Rendimento Líquido Mensal')).toBeInTheDocument();
    expect(screen.getByText('Faturação Bruta')).toBeInTheDocument();
  });

  it('switches to comparison mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    const compareBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Comparar')
    );
    await user.click(compareBtn!);

    // "Comparação" appears in both form header and results header
    expect(screen.getAllByText('Comparação').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('region change affects IRS results', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Get initial IRS
    const getIrsText = () =>
      screen.getByText(/Retenção IRS/).closest('.breakdown-row')?.textContent;

    const irsBefore = getIrsText();

    // Switch to Açores
    await user.selectOptions(screen.getByLabelText('Região'), 'acores');

    const irsAfter = getIrsText();
    expect(irsAfter).not.toBe(irsBefore);
  });

  it('adding dependents changes results', async () => {
    const user = userEvent.setup();
    render(<App />);

    const getIrsText = () =>
      screen.getByText(/Retenção IRS/).closest('.breakdown-row')?.textContent;

    const irsBefore = getIrsText();

    const depsInput = screen.getByLabelText('Dependentes');
    await user.clear(depsInput);
    await user.type(depsInput, '3');

    const irsAfter = getIrsText();
    expect(irsAfter).not.toBe(irsBefore);
  });
});
