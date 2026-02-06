import { useState } from 'react';
import type { EmployedResult } from '../../utils';
import { formatCurrency, formatPercent } from '../../utils';
import DonutChart from '../DonutChart';
import { AnimatedCurrency } from './AnimatedCurrency';

export function EmployedResults({ result }: { result: EmployedResult }) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const m = view === 'monthly';

  const gross = m ? result.totalGrossMonthly : result.grossAnnual;
  const hasSupplements = result.otherTaxableIncome > 0;
  const ss = m ? result.ssEmployee : result.ssAnnualEmployee;
  const irs = m ? result.irsWithholding : result.irsAnnual;
  const net = m ? result.netMonthly : result.netAnnual;
  const meal = m ? result.mealAllowanceMonthly : result.mealAllowanceAnnual;
  const mealTaxable = m ? result.mealTaxableMonthly : result.mealTaxableAnnual;
  const mealExempt = m ? result.mealExemptMonthly : (result.mealAllowanceAnnual - result.mealTaxableAnnual);
  const totalNet = m ? result.totalNetMonthly : result.totalNetAnnual;

  const donutSegments = [
    { label: 'Salário Líquido', value: net + mealExempt, color: '#e8436f' },
    { label: 'Seg. Social (11%)', value: ss, color: '#ff8fa3' },
    { label: 'IRS', value: irs, color: '#2d2d3f' },
  ];

  return (
    <>
      <div className="results-header">
        <h2>Resultados</h2>
        <div className="view-toggle">
          <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>Mensal</button>
          <button className={view === 'annual' ? 'active' : ''} onClick={() => setView('annual')}>Anual</button>
        </div>
      </div>

      <div className="net-salary-hero">
        <span className="hero-label">Salário Líquido {m ? 'Mensal' : 'Anual'}</span>
        <span className="hero-value">
          <AnimatedCurrency value={totalNet} />
        </span>
        {meal > 0 && (
          <span className="hero-subtitle">
            incl. {formatCurrency(meal)} sub. alimentação
            {mealTaxable > 0 && <> ({formatCurrency(mealExempt)} isento + {formatCurrency(mealTaxable)} tributável)</>}
          </span>
        )}
        {result.irsJovemDiscount > 0 && (
          <span className="hero-badge">
            IRS Jovem: poupa {formatCurrency(m ? result.irsJovemDiscount : result.irsJovemDiscount * 14)}/
            {m ? 'mês' : 'ano'}
          </span>
        )}
      </div>

      <DonutChart
        segments={donutSegments}
        centerLabel={m ? 'Mensal' : 'Anual'}
        centerValue={formatCurrency(totalNet)}
      />

      <div className="breakdown-table">
        <div className="breakdown-row gross">
          <span className="breakdown-label">
            {hasSupplements ? 'Remuneração Total' : 'Salário Bruto'}
          </span>
          <span className="breakdown-value">{formatCurrency(gross)}</span>
        </div>
        {hasSupplements && (
          <div className="breakdown-row sub-detail">
            <span className="breakdown-label">
              Base {formatCurrency(m ? result.grossMonthly : result.grossAnnual - result.otherTaxableIncome * 12)} + Complementos {formatCurrency(m ? result.otherTaxableIncome : result.otherTaxableIncome * 12)}
            </span>
          </div>
        )}
        {mealTaxable > 0 && (
          <div className="breakdown-row sub-detail">
            <span className="breakdown-label">
              + Sub. alimentação tributável: {formatCurrency(mealTaxable)}
            </span>
          </div>
        )}
        <div className="breakdown-divider" />
        <div className="breakdown-row deduction">
          <span className="breakdown-label">
            <span className="dot" style={{ backgroundColor: '#ff8fa3' }} />
            Segurança Social ({formatPercent(result.ssRate)})
          </span>
          <span className="breakdown-value negative">- {formatCurrency(ss)}</span>
        </div>
        <div className="breakdown-row deduction">
          <span className="breakdown-label">
            <span className="dot" style={{ backgroundColor: '#2d2d3f' }} />
            Retenção IRS ({formatPercent(result.irsRate)})
          </span>
          <span className="breakdown-value negative">- {formatCurrency(irs)}</span>
        </div>
        <div className="breakdown-divider" />
        <div className="breakdown-row net">
          <span className="breakdown-label">Salário Líquido</span>
          <span className="breakdown-value">{formatCurrency(net)}</span>
        </div>
        {meal > 0 && (
          <div className="breakdown-row meal">
            <span className="breakdown-label">
              <span className="dot" style={{ backgroundColor: '#ffb3c1' }} />
              Sub. Alimentação {mealTaxable > 0 ? '(isento)' : ''}
            </span>
            <span className="breakdown-value positive">+ {formatCurrency(mealExempt)}</span>
          </div>
        )}
        <div className="breakdown-divider accent" />
        <div className="breakdown-row total">
          <span className="breakdown-label">Total Líquido</span>
          <span className="breakdown-value"><AnimatedCurrency value={totalNet} /></span>
        </div>
      </div>

      <div className="employer-section">
        <h3>Custo para a Empresa</h3>
        <div className="employer-row">
          <span>SS Patronal ({formatPercent(0.2375)})</span>
          <span>{formatCurrency(m ? result.ssEmployer : result.ssEmployerAnnual)}</span>
        </div>
        <div className="employer-row total">
          <span>Custo Total Anual</span>
          <span>{formatCurrency(result.totalEmployerCostAnnual)}</span>
        </div>
      </div>

      <div className="rates-section">
        <div className="rate-card">
          <span className="rate-value">{formatPercent(result.effectiveIrsRate)}</span>
          <span className="rate-label">Taxa Efetiva IRS</span>
        </div>
        <div className="rate-card">
          <span className="rate-value">{formatPercent(result.effectiveTotalRate)}</span>
          <span className="rate-label">Taxa Total Descontos</span>
        </div>
      </div>
    </>
  );
}
