import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputForm from '../InputForm';
import { createInput } from '../../test/fixtures';
import type { SalaryInput } from '../../utils';

function renderForm(overrides: Partial<SalaryInput> = {}) {
  const input = createInput(overrides);
  const onChange = vi.fn();
  const utils = render(<InputForm input={input} onChange={onChange} />);
  return { ...utils, onChange, input };
}

describe('InputForm', () => {
  describe('rendering', () => {
    it('renders employment type toggle buttons', () => {
      renderForm();
      expect(screen.getByText('Conta de Outrem')).toBeInTheDocument();
      expect(screen.getByText('Independente')).toBeInTheDocument();
      expect(screen.getByText('Comparar')).toBeInTheDocument();
    });

    it('renders gross monthly input', () => {
      renderForm();
      expect(screen.getByLabelText(/Salário Bruto Mensal/)).toBeInTheDocument();
    });

    it('renders region selector', () => {
      renderForm();
      expect(screen.getByLabelText('Região')).toBeInTheDocument();
      expect(screen.getByText('Portugal Continental')).toBeInTheDocument();
    });

    it('renders marital status selector', () => {
      renderForm();
      expect(screen.getByLabelText('Estado Civil')).toBeInTheDocument();
    });

    it('renders dependents input', () => {
      renderForm();
      expect(screen.getByLabelText('Dependentes')).toBeInTheDocument();
    });
  });

  describe('employed mode', () => {
    it('shows meal allowance field', () => {
      renderForm({ employmentType: 'employed' });
      expect(screen.getByLabelText(/Subsídio de Alimentação/)).toBeInTheDocument();
    });

    it('shows IRS Jovem checkbox', () => {
      renderForm({ employmentType: 'employed' });
      expect(screen.getByText('IRS Jovem (até 35 anos)')).toBeInTheDocument();
    });

    it('shows salary months selector', () => {
      renderForm({ employmentType: 'employed' });
      expect(screen.getByLabelText('Meses de Salário')).toBeInTheDocument();
    });

    it('shows IRS Jovem year selector when enabled', () => {
      renderForm({ employmentType: 'employed', irsJovem: true });
      expect(screen.getByLabelText('Ano de Benefício')).toBeInTheDocument();
      expect(screen.getByText('1.º ano — 100% isento')).toBeInTheDocument();
    });

    it('does not show self-employed fields', () => {
      renderForm({ employmentType: 'employed' });
      expect(screen.queryByLabelText('Tipo de Atividade')).not.toBeInTheDocument();
    });
  });

  describe('self-employed mode', () => {
    it('shows activity type selector', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.getByLabelText('Tipo de Atividade')).toBeInTheDocument();
    });

    it('shows fiscal regime selector', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.getByLabelText('Regime')).toBeInTheDocument();
    });

    it('shows VAT regime selector', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.getByLabelText('IVA')).toBeInTheDocument();
    });

    it('shows first year checkbox', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.getByText(/1.º ano de atividade/)).toBeInTheDocument();
    });

    it('shows exempt retention checkbox for services', () => {
      renderForm({ employmentType: 'self_employed', activityType: 'services' });
      expect(screen.getByText('Isento de retenção na fonte')).toBeInTheDocument();
    });

    it('does not show meal allowance field', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.queryByLabelText(/Subsídio de Alimentação/)).not.toBeInTheDocument();
    });

    it('shows label as "Faturação Mensal" for gross', () => {
      renderForm({ employmentType: 'self_employed' });
      expect(screen.getByLabelText('Faturação Mensal')).toBeInTheDocument();
    });
  });

  describe('compare mode', () => {
    it('shows both employed and self-employed sections', () => {
      renderForm({ employmentType: 'compare' });
      // Toggle button + section title both contain these texts
      expect(screen.getAllByText('Conta de Outrem').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Independente').length).toBeGreaterThanOrEqual(1);
    });

    it('shows meal allowance (employed section)', () => {
      renderForm({ employmentType: 'compare' });
      expect(screen.getByLabelText(/Subsídio de Alimentação/)).toBeInTheDocument();
    });

    it('shows activity type (self-employed section)', () => {
      renderForm({ employmentType: 'compare' });
      expect(screen.getByLabelText('Tipo de Atividade')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onChange when gross monthly is changed', async () => {
      const user = userEvent.setup();
      const { onChange } = renderForm();
      const grossInput = screen.getByLabelText(/Salário Bruto Mensal/);

      await user.clear(grossInput);
      await user.type(grossInput, '2000');

      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when region is changed', async () => {
      const user = userEvent.setup();
      const { onChange } = renderForm();
      const regionSelect = screen.getByLabelText('Região');

      await user.selectOptions(regionSelect, 'acores');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'acores' })
      );
    });

    it('calls onChange when dependents is changed', async () => {
      const user = userEvent.setup();
      const { onChange } = renderForm();
      const depsInput = screen.getByLabelText('Dependentes');

      await user.clear(depsInput);
      await user.type(depsInput, '2');

      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when employment type toggle is clicked', async () => {
      const user = userEvent.setup();
      const { onChange } = renderForm({ employmentType: 'employed' });

      // Click self-employed toggle (the button with "Independente" text)
      const selfEmpBtn = screen.getAllByRole('button').find(
        (btn) => btn.textContent?.includes('Independente')
      );
      expect(selfEmpBtn).toBeDefined();
      await user.click(selfEmpBtn!);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ employmentType: 'self_employed' })
      );
    });

    it('calls onChange when marital status is changed', async () => {
      const user = userEvent.setup();
      const { onChange } = renderForm();

      await user.selectOptions(
        screen.getByLabelText('Estado Civil'),
        'married_single_holder'
      );

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ maritalStatus: 'married_single_holder' })
      );
    });
  });
});
