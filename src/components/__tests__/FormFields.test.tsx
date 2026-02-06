import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployedFields } from '../form/EmployedFields';
import { SelfEmployedFields } from '../form/SelfEmployedFields';
import { EmploymentToggle } from '../form/EmploymentToggle';
import { createInput } from '../../test/fixtures';
import type { SalaryInput } from '../../utils';

// ---- EmploymentToggle ----

describe('EmploymentToggle', () => {
  it('highlights employed when selected', () => {
    const onChange = vi.fn();
    render(<EmploymentToggle value="employed" onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].className).toContain('active');
    expect(buttons[1].className).not.toContain('active');
  });

  it('highlights self-employed when selected', () => {
    const onChange = vi.fn();
    render(<EmploymentToggle value="self_employed" onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[1].className).toContain('active');
  });

  it('highlights compare when selected', () => {
    const onChange = vi.fn();
    render(<EmploymentToggle value="compare" onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[2].className).toContain('active');
    expect(buttons[2].className).toContain('compare');
  });

  it('calls onChange with correct type', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EmploymentToggle value="employed" onChange={onChange} />);

    await user.click(screen.getAllByRole('button')[1]);
    expect(onChange).toHaveBeenCalledWith('self_employed');

    await user.click(screen.getAllByRole('button')[2]);
    expect(onChange).toHaveBeenCalledWith('compare');
  });
});

// ---- EmployedFields ----

describe('EmployedFields', () => {
  function renderEmployedFields(overrides: Partial<SalaryInput> = {}, isCompare = false) {
    const input = createInput(overrides);
    const update = vi.fn();
    const utils = render(<EmployedFields input={input} update={update} isCompare={isCompare} />);
    return { ...utils, update, input };
  }

  it('renders meal allowance input', () => {
    renderEmployedFields();
    expect(screen.getByLabelText(/Subsídio de Alimentação/)).toBeInTheDocument();
  });

  it('renders meal type selector (card/cash)', () => {
    renderEmployedFields();
    expect(screen.getByText('Cartão')).toBeInTheDocument();
    expect(screen.getByText('Dinheiro')).toBeInTheDocument();
  });

  it('shows card exempt limit hint', () => {
    renderEmployedFields({ mealAllowanceType: 'card' });
    expect(screen.getByText(/10.46€\/dia em cartão/)).toBeInTheDocument();
  });

  it('shows cash exempt limit hint', () => {
    renderEmployedFields({ mealAllowanceType: 'cash' });
    expect(screen.getByText(/6.15€\/dia em dinheiro/)).toBeInTheDocument();
  });

  it('renders other taxable income field', () => {
    renderEmployedFields();
    expect(screen.getByLabelText(/Complementos Tributáveis/)).toBeInTheDocument();
  });

  it('renders IRS Jovem checkbox', () => {
    renderEmployedFields();
    expect(screen.getByText('IRS Jovem (até 35 anos)')).toBeInTheDocument();
  });

  it('shows IRS Jovem year selector when enabled', () => {
    renderEmployedFields({ irsJovem: true });
    expect(screen.getByLabelText('Ano de Benefício')).toBeInTheDocument();
    expect(screen.getByText('1.º ano — 100% isento')).toBeInTheDocument();
    expect(screen.getByText('10.º ano — 25% isento')).toBeInTheDocument();
  });

  it('hides IRS Jovem year selector when disabled', () => {
    renderEmployedFields({ irsJovem: false });
    expect(screen.queryByLabelText('Ano de Benefício')).not.toBeInTheDocument();
  });

  it('shows extras toggle button', () => {
    renderEmployedFields();
    expect(screen.getByText('Mais opções')).toBeInTheDocument();
  });

  it('reveals disability checkbox on extras toggle', async () => {
    const user = userEvent.setup();
    renderEmployedFields();

    expect(screen.queryByText('Portador de deficiência')).not.toBeInTheDocument();

    await user.click(screen.getByText('Mais opções'));

    expect(screen.getByText('Portador de deficiência')).toBeInTheDocument();
    expect(screen.getByText('Menos opções')).toBeInTheDocument();
  });

  it('shows section title in compare mode', () => {
    renderEmployedFields({}, true);
    expect(screen.getByText('Conta de Outrem')).toBeInTheDocument();
  });

  it('does not show section title outside compare mode', () => {
    renderEmployedFields({}, false);
    expect(screen.queryByText('Conta de Outrem')).not.toBeInTheDocument();
  });

  it('calls update when meal allowance changes', async () => {
    const user = userEvent.setup();
    const { update } = renderEmployedFields();

    const mealInput = screen.getByLabelText(/Subsídio de Alimentação/);
    await user.clear(mealInput);
    await user.type(mealInput, '10');

    expect(update).toHaveBeenCalled();
  });

  it('calls update when IRS Jovem is toggled', async () => {
    const user = userEvent.setup();
    const { update } = renderEmployedFields();

    const checkbox = screen.getByRole('checkbox', { name: /IRS Jovem/ });
    await user.click(checkbox);

    expect(update).toHaveBeenCalledWith('irsJovem', true);
  });
});

// ---- SelfEmployedFields ----

describe('SelfEmployedFields', () => {
  function renderSelfEmployedFields(overrides: Partial<SalaryInput> = {}, isCompare = false) {
    const input = createInput({ employmentType: 'self_employed', ...overrides });
    const update = vi.fn();
    const utils = render(<SelfEmployedFields input={input} update={update} isCompare={isCompare} />);
    return { ...utils, update, input };
  }

  it('renders activity type selector', () => {
    renderSelfEmployedFields();
    expect(screen.getByLabelText('Tipo de Atividade')).toBeInTheDocument();
    expect(screen.getByText(/Prestação de Serviços/)).toBeInTheDocument();
    expect(screen.getByText(/Vendas/)).toBeInTheDocument();
  });

  it('renders fiscal regime selector', () => {
    renderSelfEmployedFields();
    expect(screen.getByLabelText('Regime')).toBeInTheDocument();
    expect(screen.getByText('Simplificado')).toBeInTheDocument();
    expect(screen.getByText('Contab. Organizada')).toBeInTheDocument();
  });

  it('renders VAT regime selector', () => {
    renderSelfEmployedFields();
    expect(screen.getByLabelText('IVA')).toBeInTheDocument();
  });

  it('shows retention hint for services (23%)', () => {
    renderSelfEmployedFields({ activityType: 'services', selfEmployedExemptRetention: false });
    expect(screen.getByText(/Retenção na fonte: 23%/)).toBeInTheDocument();
  });

  it('shows retention hint as "Isento" when exempt', () => {
    renderSelfEmployedFields({ activityType: 'services', selfEmployedExemptRetention: true });
    expect(screen.getByText(/Retenção na fonte: Isento/)).toBeInTheDocument();
  });

  it('shows retention hint as "Sem retenção" for sales', () => {
    renderSelfEmployedFields({ activityType: 'sales' });
    expect(screen.getByText(/Sem retenção/)).toBeInTheDocument();
  });

  it('shows VAT exempt info when Art. 53', () => {
    renderSelfEmployedFields({ vatRegime: 'exempt_art53' });
    expect(screen.getByText(/Isento de IVA/)).toBeInTheDocument();
  });

  it('does not show VAT exempt info when normal', () => {
    renderSelfEmployedFields({ vatRegime: 'normal' });
    expect(screen.queryByText(/Isento de IVA/)).not.toBeInTheDocument();
  });

  it('shows expenses field for organized accounting', () => {
    renderSelfEmployedFields({ fiscalRegime: 'organized' });
    expect(screen.getByLabelText('Despesas Mensais Dedutíveis')).toBeInTheDocument();
  });

  it('hides expenses field for simplified regime', () => {
    renderSelfEmployedFields({ fiscalRegime: 'simplified' });
    expect(screen.queryByLabelText('Despesas Mensais Dedutíveis')).not.toBeInTheDocument();
  });

  it('shows first year checkbox', () => {
    renderSelfEmployedFields();
    expect(screen.getByText(/1.º ano de atividade/)).toBeInTheDocument();
  });

  it('shows exempt retention checkbox for services', () => {
    renderSelfEmployedFields({ activityType: 'services' });
    expect(screen.getByText('Isento de retenção na fonte')).toBeInTheDocument();
  });

  it('hides exempt retention checkbox for sales', () => {
    renderSelfEmployedFields({ activityType: 'sales' });
    expect(screen.queryByText('Isento de retenção na fonte')).not.toBeInTheDocument();
  });

  it('shows SS info for first year exemption', () => {
    renderSelfEmployedFields({ selfEmployedFirstYear: true });
    expect(screen.getByText(/Isento nos primeiros 12 meses/)).toBeInTheDocument();
  });

  it('shows SS info with percentages for services', () => {
    renderSelfEmployedFields({ selfEmployedFirstYear: false, activityType: 'services' });
    expect(screen.getByText(/21\.4% sobre/)).toBeInTheDocument();
    expect(screen.getByText(/70%/)).toBeInTheDocument();
  });

  it('shows SS info with percentages for sales', () => {
    renderSelfEmployedFields({ selfEmployedFirstYear: false, activityType: 'sales' });
    expect(screen.getByText(/21\.4% sobre/)).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  it('shows "Independente" title in compare mode', () => {
    renderSelfEmployedFields({}, true);
    expect(screen.getByText('Independente')).toBeInTheDocument();
  });

  it('shows "Regime Fiscal" title outside compare mode', () => {
    renderSelfEmployedFields({}, false);
    expect(screen.getByText('Regime Fiscal')).toBeInTheDocument();
  });

  it('calls update when activity type changes', async () => {
    const user = userEvent.setup();
    const { update } = renderSelfEmployedFields();

    await user.selectOptions(screen.getByLabelText('Tipo de Atividade'), 'sales');
    expect(update).toHaveBeenCalledWith('activityType', 'sales');
  });

  it('calls update when first year is toggled', async () => {
    const user = userEvent.setup();
    const { update } = renderSelfEmployedFields();

    const checkbox = screen.getByRole('checkbox', { name: /1.º ano/ });
    await user.click(checkbox);

    expect(update).toHaveBeenCalledWith('selfEmployedFirstYear', true);
  });
});
