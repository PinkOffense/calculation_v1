import type { SalaryInput } from '../../utils';
import { EmploymentToggle } from './EmploymentToggle';
import { EmployedFields } from './EmployedFields';
import { SelfEmployedFields } from './SelfEmployedFields';

interface InputFormProps {
  input: SalaryInput;
  onChange: (input: SalaryInput) => void;
}

export default function InputForm({ input, onChange }: InputFormProps) {
  const update = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  const isEmployed = input.employmentType === 'employed';
  const isSelfEmployed = input.employmentType === 'self_employed';
  const isCompare = input.employmentType === 'compare';

  const showEmployedFields = isEmployed || isCompare;
  const showSelfEmployedFields = isSelfEmployed || isCompare;

  return (
    <div className="input-form">
      <EmploymentToggle
        value={input.employmentType}
        onChange={(v) => update('employmentType', v)}
      />

      <div className="form-header">
        <div className="form-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h2>{isCompare ? 'Comparação' : isEmployed ? 'Dados Salariais' : 'Dados de Faturação'}</h2>
      </div>

      {/* Gross Monthly */}
      <div className="form-group">
        <label htmlFor="grossMonthly">
          {isCompare ? 'Valor Bruto Mensal' : isEmployed ? 'Salário Bruto Mensal' : 'Faturação Mensal'}
        </label>
        <div className="input-wrapper currency-input">
          <input
            id="grossMonthly"
            type="number"
            min="0"
            step="50"
            value={input.grossMonthly}
            onChange={(e) => update('grossMonthly', Math.max(0, Number(e.target.value)))}
            placeholder={isEmployed ? '1 500' : '3 000'}
          />
          <span className="input-suffix">€</span>
        </div>
        <input
          type="range"
          className="salary-slider"
          min="0"
          max="25000"
          step="10"
          value={input.grossMonthly}
          onChange={(e) => update('grossMonthly', Number(e.target.value))}
          style={{
            '--slider-progress': `${(input.grossMonthly / 25000) * 100}%`,
          } as React.CSSProperties}
        />
        <div className="slider-labels">
          <span>€0</span>
          <span>€25 000</span>
        </div>
        {isCompare && (
          <span className="form-hint">O mesmo valor bruto será usado para ambos os cenários</span>
        )}
      </div>

      {/* Region */}
      <div className="form-group">
        <label htmlFor="region">Região</label>
        <div className="input-wrapper select-wrapper">
          <select
            id="region"
            value={input.region}
            onChange={(e) => update('region', e.target.value as SalaryInput['region'])}
          >
            <option value="continente">Portugal Continental</option>
            <option value="acores">Açores (-30% IRS)</option>
            <option value="madeira">Madeira (-30% IRS)</option>
          </select>
        </div>
      </div>

      {/* Marital Status */}
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

      {/* Dependents + Months */}
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

        {showEmployedFields && (
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
        )}
      </div>

      {/* Employed-specific fields */}
      {showEmployedFields && (
        <EmployedFields input={input} update={update} isCompare={isCompare} />
      )}

      {/* Self-employed-specific fields */}
      {showSelfEmployedFields && (
        <SelfEmployedFields input={input} update={update} isCompare={isCompare} />
      )}

    </div>
  );
}
