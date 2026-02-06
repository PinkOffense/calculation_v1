import type { SalaryInput } from '../../utils';
import { CONSTANTS } from '../../utils';

interface EmployedFieldsProps {
  input: SalaryInput;
  update: <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => void;
  isCompare: boolean;
}

export function EmployedFields({ input, update, isCompare }: EmployedFieldsProps) {
  return (
    <>
      {isCompare && <div className="form-section-title">Conta de Outrem</div>}

      <div className="form-group">
        <label htmlFor="mealAllowance">Subsídio de Alimentação / dia</label>
        <div className="form-row meal-row">
          <div className="input-wrapper currency-input">
            <input
              id="mealAllowance"
              type="number"
              min="0"
              max="20"
              step="0.10"
              value={input.mealAllowancePerDay || ''}
              onChange={(e) => update('mealAllowancePerDay', Math.max(0, Number(e.target.value)))}
              placeholder="7.63"
            />
            <span className="input-suffix">€</span>
          </div>
          <div className="input-wrapper select-wrapper">
            <select
              id="mealType"
              value={input.mealAllowanceType}
              onChange={(e) => update('mealAllowanceType', e.target.value as 'cash' | 'card')}
            >
              <option value="card">Cartão</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>
        </div>
        <span className="form-hint">
          Isento até {input.mealAllowanceType === 'card'
            ? `${CONSTANTS.MEAL_ALLOWANCE_EXEMPT_CARD.toFixed(2)}€/dia em cartão`
            : `${CONSTANTS.MEAL_ALLOWANCE_EXEMPT_CASH.toFixed(2)}€/dia em dinheiro`}
        </span>
      </div>

      {/* Other Taxable Income (overtime, bonuses, shift pay) */}
      <div className="form-group">
        <label htmlFor="otherTaxableIncome">
          Complementos Tributáveis / mês
          <span className="label-info" title="Horas extra, subsídio de turno, prémios, isenção de horário, comissões, etc. Sujeitos a IRS + Segurança Social.">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
        </label>
        <div className="input-wrapper currency-input">
          <input
            id="otherTaxableIncome"
            type="number"
            min="0"
            step="25"
            value={input.otherTaxableIncome || ''}
            onChange={(e) => update('otherTaxableIncome', Math.max(0, Number(e.target.value)))}
            placeholder="0"
          />
          <span className="input-suffix">€</span>
        </div>
        <span className="form-hint">
          Horas extra, turnos, prémios, comissões (sujeitos a IRS + SS)
        </span>
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
              onChange={(e) => update('irsJovemYear', Number(e.target.value))}
            >
              <option value={1}>1.º ano — 100% isento</option>
              <option value={2}>2.º ano — 75% isento</option>
              <option value={3}>3.º ano — 75% isento</option>
              <option value={4}>4.º ano — 75% isento</option>
              <option value={5}>5.º ano — 50% isento</option>
              <option value={6}>6.º ano — 50% isento</option>
              <option value={7}>7.º ano — 50% isento</option>
              <option value={8}>8.º ano — 25% isento</option>
              <option value={9}>9.º ano — 25% isento</option>
              <option value={10}>10.º ano — 25% isento</option>
            </select>
          </div>
        </div>
      )}

    </>
  );
}
