import type { SalaryInput } from '../utils/taxCalculator';

interface InputFormProps {
  input: SalaryInput;
  onChange: (input: SalaryInput) => void;
}

export default function InputForm({ input, onChange }: InputFormProps) {
  const update = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <div className="input-form">
      <div className="form-header">
        <div className="form-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h2>Dados Salariais</h2>
      </div>

      <div className="form-group">
        <label htmlFor="grossMonthly">Salário Bruto Mensal</label>
        <div className="input-wrapper currency-input">
          <input
            id="grossMonthly"
            type="number"
            min="0"
            step="50"
            value={input.grossMonthly || ''}
            onChange={(e) => update('grossMonthly', Math.max(0, Number(e.target.value)))}
            placeholder="1 500"
          />
          <span className="input-suffix">€</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="maritalStatus">Estado Civil</label>
        <div className="input-wrapper select-wrapper">
          <select
            id="maritalStatus"
            value={input.maritalStatus}
            onChange={(e) => update('maritalStatus', e.target.value as SalaryInput['maritalStatus'])}
          >
            <option value="single">Não Casado</option>
            <option value="married_single_holder">Casado - Único Titular</option>
            <option value="married_two_holders">Casado - Dois Titulares</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dependents">Dependentes</label>
          <div className="input-wrapper">
            <input
              id="dependents"
              type="number"
              min="0"
              max="10"
              value={input.dependents}
              onChange={(e) => update('dependents', Math.max(0, Math.min(10, Number(e.target.value))))}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="numberOfMonths">Meses de Salário</label>
          <div className="input-wrapper select-wrapper">
            <select
              id="numberOfMonths"
              value={input.numberOfMonths}
              onChange={(e) => update('numberOfMonths', Number(e.target.value) as 12 | 14)}
            >
              <option value={14}>14 meses</option>
              <option value={12}>12 meses (duodécimos)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="mealAllowance">Subsídio de Alimentação / dia</label>
        <div className="input-wrapper currency-input">
          <input
            id="mealAllowance"
            type="number"
            min="0"
            max="20"
            step="0.10"
            value={input.mealAllowancePerDay || ''}
            onChange={(e) => update('mealAllowancePerDay', Math.max(0, Number(e.target.value)))}
            placeholder="6.00"
          />
          <span className="input-suffix">€</span>
        </div>
        <span className="form-hint">Isento até 6,00€/dia em cartão</span>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={input.hasDisability}
            onChange={(e) => update('hasDisability', e.target.checked)}
          />
          <span className="checkbox-custom" />
          <span>Portador de deficiência</span>
        </label>
      </div>
    </div>
  );
}
