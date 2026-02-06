import { useState } from 'react';
import type { SalaryResult } from '../utils/taxCalculator';
import { formatCurrency, formatPercent } from '../utils/taxCalculator';
import DonutChart from './DonutChart';

interface ResultsPanelProps {
  result: SalaryResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');

  const isMonthly = view === 'monthly';

  const gross = isMonthly ? result.grossMonthly : result.grossAnnual;
  const ss = isMonthly ? result.ssEmployee : result.ssAnnualEmployee;
  const irs = isMonthly ? result.irsWithholding : result.irsAnnual;
  const net = isMonthly ? result.netMonthly : result.netAnnual;
  const meal = isMonthly ? result.mealAllowanceMonthly : result.mealAllowanceAnnual;
  const totalNet = isMonthly ? result.totalNetMonthly : result.totalNetAnnual;

  const donutSegments = [
    { label: 'Salário Líquido', value: net, color: '#e8436f' },
    { label: 'Seg. Social (11%)', value: ss, color: '#ff8fa3' },
    { label: 'IRS', value: irs, color: '#2d2d3f' },
  ];

  if (meal > 0) {
    donutSegments.splice(1, 0, { label: 'Sub. Alimentação', value: meal, color: '#ffb3c1' });
  }

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2>Resultados</h2>
        <div className="view-toggle">
          <button
            className={view === 'monthly' ? 'active' : ''}
            onClick={() => setView('monthly')}
          >
            Mensal
          </button>
          <button
            className={view === 'annual' ? 'active' : ''}
            onClick={() => setView('annual')}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Hero net salary */}
      <div className="net-salary-hero">
        <span className="hero-label">Salário Líquido {isMonthly ? 'Mensal' : 'Anual'}</span>
        <span className="hero-value animate-value" key={`${view}-${totalNet}`}>
          {formatCurrency(totalNet)}
        </span>
        {meal > 0 && (
          <span className="hero-subtitle">
            {formatCurrency(net)} + {formatCurrency(meal)} sub. alimentação
          </span>
        )}
      </div>

      {/* Donut chart */}
      <DonutChart
        segments={donutSegments}
        centerLabel={isMonthly ? 'Mensal' : 'Anual'}
        centerValue={formatCurrency(totalNet)}
      />

      {/* Breakdown table */}
      <div className="breakdown-table">
        <div className="breakdown-row gross">
          <span className="breakdown-label">Salário Bruto</span>
          <span className="breakdown-value">{formatCurrency(gross)}</span>
        </div>

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
              Sub. Alimentação
            </span>
            <span className="breakdown-value positive">+ {formatCurrency(meal)}</span>
          </div>
        )}

        <div className="breakdown-divider accent" />

        <div className="breakdown-row total">
          <span className="breakdown-label">Total Líquido</span>
          <span className="breakdown-value">{formatCurrency(totalNet)}</span>
        </div>
      </div>

      {/* Employer cost */}
      <div className="employer-section">
        <h3>Custo para a Empresa</h3>
        <div className="employer-row">
          <span>SS Patronal ({formatPercent(0.2375)})</span>
          <span>{formatCurrency(isMonthly ? result.ssEmployer : result.ssEmployerAnnual)}</span>
        </div>
        <div className="employer-row total">
          <span>Custo Total Anual</span>
          <span>{formatCurrency(result.totalEmployerCostAnnual)}</span>
        </div>
      </div>

      {/* Effective rates */}
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
    </div>
  );
}
