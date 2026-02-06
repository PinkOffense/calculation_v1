import type { SalaryInput } from '../../utils';
import { CONSTANTS } from '../../utils';

interface SelfEmployedFieldsProps {
  input: SalaryInput;
  update: <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => void;
  isCompare: boolean;
}

export function SelfEmployedFields({ input, update, isCompare }: SelfEmployedFieldsProps) {
  return (
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
          Retenção na fonte: {input.selfEmployedExemptRetention
            ? 'Isento'
            : input.activityType === 'services' ? '23%' : 'Sem retenção'}
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

      {/* Exemptions */}
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={input.selfEmployedFirstYear}
            onChange={(e) => update('selfEmployedFirstYear', e.target.checked)}
          />
          <span className="checkbox-custom" />
          <span>1.º ano de atividade (isento SS 12 meses)</span>
        </label>
      </div>

      {input.activityType === 'services' && (
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={input.selfEmployedExemptRetention}
              onChange={(e) => update('selfEmployedExemptRetention', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span>Isento de retenção na fonte</span>
          </label>
          <span className="form-hint" style={{ paddingLeft: '1.75rem' }}>
            Rendimentos &lt; €14.500 no ano anterior
          </span>
        </div>
      )}

      {/* SS Info */}
      <div className="form-hint-box info">
        {input.selfEmployedFirstYear
          ? 'SS: Isento nos primeiros 12 meses de atividade (Art. 157 Código Contributivo)'
          : <>
              SS: {(CONSTANTS.SS_SELF_EMPLOYED_RATE * 100).toFixed(1)}% sobre{' '}
              {input.activityType === 'services'
                ? `${(CONSTANTS.SS_SELF_EMPLOYED_BASE_SERVICES * 100).toFixed(0)}%`
                : `${(CONSTANTS.SS_SELF_EMPLOYED_BASE_SALES * 100).toFixed(0)}%`}{' '}
              do rendimento (efetivo ≈{' '}
              {input.activityType === 'services'
                ? (CONSTANTS.SS_SELF_EMPLOYED_RATE * CONSTANTS.SS_SELF_EMPLOYED_BASE_SERVICES * 100).toFixed(1)
                : (CONSTANTS.SS_SELF_EMPLOYED_RATE * CONSTANTS.SS_SELF_EMPLOYED_BASE_SALES * 100).toFixed(1)}%)
            </>
        }
      </div>
    </>
  );
}
