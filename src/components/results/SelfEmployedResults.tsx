import { useState } from 'react';
import type { SelfEmployedResult } from '../../utils';
import { formatCurrency, formatPercent } from '../../utils';
import DonutChart from '../DonutChart';
import { AnimatedCurrency } from './AnimatedCurrency';

export function SelfEmployedResults({ result }: { result: SelfEmployedResult }) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const m = view === 'monthly';

  const gross = m ? result.grossMonthly : result.grossAnnual;
  const irs = m ? result.irsWithholding : result.irsAnnual;
  const ss = m ? result.ssContribution : result.ssAnnual;
  const vat = m ? result.vatCollected : result.vatAnnual;
  const net = m ? result.totalNetMonthly : result.totalNetAnnual;

  const donutSegments = [
    { label: 'Rendimento Líquido', value: net, color: '#e8436f' },
    { label: 'Seg. Social', value: ss, color: '#ff8fa3' },
    { label: 'Retenção IRS', value: irs, color: '#2d2d3f' },
  ];
  if (vat > 0) {
    donutSegments.push({ label: 'IVA', value: vat, color: '#ffb3c1' });
  }

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
        <span className="hero-label">Rendimento Líquido {m ? 'Mensal' : 'Anual'}</span>
        <span className="hero-value">
          <AnimatedCurrency value={net} />
        </span>
        <span className="hero-subtitle">
          Após retenção IRS + Seg. Social
        </span>
      </div>

      <DonutChart
        segments={donutSegments}
        centerLabel={m ? 'Mensal' : 'Anual'}
        centerValue={formatCurrency(net)}
      />

      <div className="breakdown-table">
        <div className="breakdown-row gross">
          <span className="breakdown-label">Faturação Bruta</span>
          <span className="breakdown-value">{formatCurrency(gross)}</span>
        </div>
        <div className="breakdown-divider" />

        <div className="breakdown-row deduction">
          <span className="breakdown-label">
            <span className="dot" style={{ backgroundColor: '#2d2d3f' }} />
            Retenção IRS ({formatPercent(result.irsWithholdingRate)})
          </span>
          <span className="breakdown-value negative">- {formatCurrency(irs)}</span>
        </div>

        <div className="breakdown-row deduction">
          <span className="breakdown-label">
            <span className="dot" style={{ backgroundColor: '#ff8fa3' }} />
            Seg. Social ({formatPercent(result.ssRate)} s/ {formatPercent(result.grossMonthly > 0 ? result.ssBase / result.grossMonthly : 0)})
          </span>
          <span className="breakdown-value negative">- {formatCurrency(ss)}</span>
        </div>

        {vat > 0 && (
          <div className="breakdown-row deduction">
            <span className="breakdown-label">
              <span className="dot" style={{ backgroundColor: '#ffb3c1' }} />
              IVA a entregar ({formatPercent(result.vatRate)})
            </span>
            <span className="breakdown-value negative">- {formatCurrency(vat)}</span>
          </div>
        )}

        <div className="breakdown-divider accent" />
        <div className="breakdown-row total">
          <span className="breakdown-label">Rendimento Líquido</span>
          <span className="breakdown-value"><AnimatedCurrency value={net} /></span>
        </div>
      </div>

      {/* Fiscal info */}
      <div className="employer-section">
        <h3>Informação Fiscal</h3>
        <div className="employer-row">
          <span>Coeficiente aplicável</span>
          <span>{result.coefficient}</span>
        </div>
        <div className="employer-row">
          <span>Rendimento coletável anual</span>
          <span>{formatCurrency(result.taxableIncome)}</span>
        </div>
        {result.annualExpenses > 0 && (
          <div className="employer-row">
            <span>Despesas dedutíveis anuais</span>
            <span>{formatCurrency(result.annualExpenses)}</span>
          </div>
        )}
        <div className="employer-row">
          <span>Base SS mensal ({result.grossMonthly > 0 ? formatPercent(result.ssBase / result.grossMonthly) : '—'})</span>
          <span>{formatCurrency(result.ssBase)}</span>
        </div>
      </div>

      {/* Equivalence card */}
      <div className="equivalence-card">
        <div className="equivalence-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
        <div className="equivalence-content">
          <span className="equivalence-label">Equivalente por conta de outrem</span>
          <span className="equivalence-value">{formatCurrency(result.equivalentGrossEmployed)}</span>
          <span className="equivalence-hint">Bruto mensal (14 meses) para o mesmo líquido anual</span>
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
