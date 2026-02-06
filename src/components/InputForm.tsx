import type { SalaryInput, EmploymentType } from '../utils/taxCalculator';
import { CONSTANTS } from '../utils/taxCalculator';

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
      {/* Employment Type Toggle */}
      <div className="employment-toggle triple">
        <button
          className={isEmployed ? 'active' : ''}
          onClick={() => update('employmentType', 'employed' as EmploymentType)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span className="toggle-label-full">Conta de Outrem</span>
          <span className="toggle-label-short">Outrem</span>
        </button>
        <button
          className={isSelfEmployed ? 'active' : ''}
          onClick={() => update('employmentType', 'self_employed' as EmploymentType)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="toggle-label-full">Independente</span>
          <span className="toggle-label-short">Indep.</span>
        </button>
        <button
          className={isCompare ? 'active compare' : ''}
          onClick={() => update('employmentType', 'compare' as EmploymentType)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="toggle-label-full">Comparar</span>
          <span className="toggle-label-short">Comp.</span>
        </button>
      </div>

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
            value={input.grossMonthly || ''}
            onChange={(e) => update('grossMonthly', Math.max(0, Number(e.target.value)))}
            placeholder={isEmployed ? '1 500' : '3 000'}
          />
          <span className="input-suffix">€</span>
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
            <option value="madeira">Madeira (-20% IRS)</option>
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

      {/* Dependents + Months (employed) or Dependents (self-employed) */}
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

      {/* ---- EMPLOYED-SPECIFIC FIELDS ---- */}
      {showEmployedFields && (
        <>
          {isCompare && <div className="form-section-title">Conta de Outrem</div>}

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
            <span className="form-hint">Isento até {CONSTANTS.MEAL_ALLOWANCE_EXEMPT_CASH.toFixed(2)}€/dia em cartão</span>
          </div>

          {/* IRS Jovem */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={input.irsJovem}
                onChange={(e) => update('irsJovem', e.target.checked)}
              />
              <span className="checkbox-custom" />
              <span>IRS Jovem (até 35 anos)</span>
            </label>
          </div>

          {input.irsJovem && (
            <div className="form-group irs-jovem-year">
              <label htmlFor="irsJovemYear">Ano de Benefício</label>
              <div className="input-wrapper select-wrapper">
                <select
                  id="irsJovemYear"
                  value={input.irsJovemYear}
                  onChange={(e) => update('irsJovemYear', Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                >
                  <option value={1}>1.º ano — 100% isento</option>
                  <option value={2}>2.º ano — 75% isento</option>
                  <option value={3}>3.º ano — 50% isento</option>
                  <option value={4}>4.º ano — 50% isento</option>
                  <option value={5}>5.º ano — 25% isento</option>
                </select>
              </div>
            </div>
          )}

          {!isCompare && (
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
          )}
        </>
      )}

      {/* ---- SELF-EMPLOYED SPECIFIC FIELDS ---- */}
      {showSelfEmployedFields && (
        <>
          <div className="form-section-title">{isCompare ? 'Independente' : 'Regime Fiscal'}</div>

          <div className="form-group">
            <label htmlFor="activityType">Tipo de Atividade</label>
            <div className="input-wrapper select-wrapper">
              <select
                id="activityType"
                value={input.activityType}
                onChange={(e) => update('activityType', e.target.value as SalaryInput['activityType'])}
              >
                <option value="services">Prestação de Serviços (coef. 0.75)</option>
                <option value="sales">Vendas / Produção (coef. 0.15)</option>
              </select>
            </div>
            <span className="form-hint">
              Retenção na fonte: {input.activityType === 'services' ? '25%' : '11,5%'}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fiscalRegime">Regime</label>
              <div className="input-wrapper select-wrapper">
                <select
                  id="fiscalRegime"
                  value={input.fiscalRegime}
                  onChange={(e) => update('fiscalRegime', e.target.value as SalaryInput['fiscalRegime'])}
                >
                  <option value="simplified">Simplificado</option>
                  <option value="organized">Contab. Organizada</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="vatRegime">IVA</label>
              <div className="input-wrapper select-wrapper">
                <select
                  id="vatRegime"
                  value={input.vatRegime}
                  onChange={(e) => update('vatRegime', e.target.value as SalaryInput['vatRegime'])}
                >
                  <option value="exempt_art53">Isento (Art. 53)</option>
                  <option value="normal">Regime Normal (23%)</option>
                </select>
              </div>
            </div>
          </div>

          {input.vatRegime === 'exempt_art53' && (
            <div className="form-hint-box">
              Isento de IVA se faturação anual &lt; {CONSTANTS.VAT_EXEMPT_THRESHOLD.toLocaleString('pt-PT')}€
            </div>
          )}

          {input.fiscalRegime === 'organized' && (
            <div className="form-group">
              <label htmlFor="monthlyExpenses">Despesas Mensais Dedutíveis</label>
              <div className="input-wrapper currency-input">
                <input
                  id="monthlyExpenses"
                  type="number"
                  min="0"
                  step="50"
                  value={input.monthlyExpenses || ''}
                  onChange={(e) => update('monthlyExpenses', Math.max(0, Number(e.target.value)))}
                  placeholder="500"
                />
                <span className="input-suffix">€</span>
              </div>
            </div>
          )}

          {/* SS Info */}
          <div className="form-hint-box info">
            SS: {(CONSTANTS.SS_SELF_EMPLOYED_RATE * 100).toFixed(1)}% sobre {(CONSTANTS.SS_SELF_EMPLOYED_INCOME_BASE * 100).toFixed(0)}% do rendimento
            (efetivo ≈ {(CONSTANTS.SS_SELF_EMPLOYED_RATE * CONSTANTS.SS_SELF_EMPLOYED_INCOME_BASE * 100).toFixed(1)}%)
          </div>
        </>
      )}

      {isCompare && (
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
      )}
    </div>
  );
}
