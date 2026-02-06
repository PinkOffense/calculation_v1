import { useState } from 'react';
import type { ComparisonResult } from '../../utils';
import { formatCurrency, formatPercent } from '../../utils';
import { AnimatedCurrency } from './AnimatedCurrency';

export function ComparisonResults({ result }: { result: ComparisonResult }) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const m = view === 'monthly';

  const emp = result.employed;
  const se = result.selfEmployed;
  const diff = result.difference;

  const empNet = m ? emp.totalNetMonthly : emp.totalNetAnnual;
  const seNet = m ? se.totalNetMonthly : se.totalNetAnnual;
  const netDiff = m ? diff.monthlyNet : diff.annualNet;

  const empGross = m ? emp.totalGrossMonthly : emp.grossAnnual;
  const seGross = m ? se.grossMonthly : se.grossAnnual;

  const empSS = m ? emp.ssEmployee : emp.ssAnnualEmployee;
  const seSS = m ? se.ssContribution : se.ssAnnual;

  const empIRS = m ? emp.irsWithholding : emp.irsAnnual;
  const seIRS = m ? se.irsWithholding : se.irsAnnual;

  const empMeal = m ? emp.mealExemptMonthly : (emp.mealAllowanceAnnual - emp.mealTaxableAnnual);

  const seVat = m ? se.vatCollected : se.vatAnnual;

  const betterLabel = diff.betterOption === 'employed' ? 'Conta de Outrem' :
    diff.betterOption === 'self_employed' ? 'Independente' : 'Igual';

  return (
    <>
      <div className="results-header">
        <h2>Comparação</h2>
        <div className="view-toggle">
          <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>Mensal</button>
          <button className={view === 'annual' ? 'active' : ''} onClick={() => setView('annual')}>Anual</button>
        </div>
      </div>

      {/* Winner banner */}
      <div className={`comparison-winner ${diff.betterOption}`}>
        <div className="winner-icon">
          {diff.betterOption === 'equal' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="9" x2="19" y2="9" />
              <line x1="5" y1="15" x2="19" y2="15" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          )}
        </div>
        <div className="winner-text">
          <span className="winner-label">
            {diff.betterOption === 'equal' ? 'Resultado semelhante' : `Melhor opção: ${betterLabel}`}
          </span>
          {diff.betterOption !== 'equal' && (
            <span className="winner-diff">
              Diferença: +{formatCurrency(Math.abs(netDiff))} {m ? '/mês' : '/ano'}
            </span>
          )}
        </div>
      </div>

      {/* Side by side hero values */}
      <div className="comparison-heroes">
        <div className={`comparison-hero-card ${diff.betterOption === 'employed' ? 'winner' : ''}`}>
          <span className="comp-hero-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <span className="comp-hero-title">Conta de Outrem</span>
          <span className="comp-hero-value">
            <AnimatedCurrency value={empNet} />
          </span>
          {empMeal > 0 && (
            <span className="comp-hero-sub">incl. {formatCurrency(empMeal)} sub. alim.</span>
          )}
        </div>

        <div className="comparison-vs">VS</div>

        <div className={`comparison-hero-card ${diff.betterOption === 'self_employed' ? 'winner' : ''}`}>
          <span className="comp-hero-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <span className="comp-hero-title">Independente</span>
          <span className="comp-hero-value">
            <AnimatedCurrency value={seNet} />
          </span>
          <span className="comp-hero-sub">após IRS + SS{seVat > 0 ? ' + IVA' : ''}</span>
        </div>
      </div>

      {/* Side by side breakdown */}
      <div className="comparison-breakdown">
        <div className="comp-breakdown-header">
          <span>Detalhe</span>
          <span>Outrem</span>
          <span>Indep.</span>
        </div>

        <div className="comp-breakdown-row">
          <span className="comp-breakdown-label">Bruto</span>
          <span className="comp-breakdown-val">{formatCurrency(empGross)}</span>
          <span className="comp-breakdown-val">{formatCurrency(seGross)}</span>
        </div>

        <div className="comp-breakdown-divider" />

        <div className="comp-breakdown-row deduction">
          <span className="comp-breakdown-label">Seg. Social</span>
          <span className="comp-breakdown-val neg">-{formatCurrency(empSS)}</span>
          <span className="comp-breakdown-val neg">-{formatCurrency(seSS)}</span>
        </div>

        <div className="comp-breakdown-row deduction">
          <span className="comp-breakdown-label">IRS</span>
          <span className="comp-breakdown-val neg">-{formatCurrency(empIRS)}</span>
          <span className="comp-breakdown-val neg">-{formatCurrency(seIRS)}</span>
        </div>

        {seVat > 0 && (
          <div className="comp-breakdown-row deduction">
            <span className="comp-breakdown-label">IVA</span>
            <span className="comp-breakdown-val">—</span>
            <span className="comp-breakdown-val neg">-{formatCurrency(seVat)}</span>
          </div>
        )}

        {empMeal > 0 && (
          <div className="comp-breakdown-row positive">
            <span className="comp-breakdown-label">Sub. Alim.</span>
            <span className="comp-breakdown-val pos">+{formatCurrency(empMeal)}</span>
            <span className="comp-breakdown-val">—</span>
          </div>
        )}

        <div className="comp-breakdown-divider accent" />

        <div className="comp-breakdown-row total">
          <span className="comp-breakdown-label">Líquido</span>
          <span className={`comp-breakdown-val ${diff.betterOption === 'employed' ? 'winner' : ''}`}>
            {formatCurrency(empNet)}
          </span>
          <span className={`comp-breakdown-val ${diff.betterOption === 'self_employed' ? 'winner' : ''}`}>
            {formatCurrency(seNet)}
          </span>
        </div>

        <div className="comp-breakdown-row diff-row">
          <span className="comp-breakdown-label">Diferença</span>
          <span className="comp-breakdown-val diff-val" style={{ gridColumn: '2 / 4', textAlign: 'center' }}>
            {netDiff >= 0 ? '+' : ''}{formatCurrency(netDiff)} p/ conta de outrem
          </span>
        </div>
      </div>

      {/* Rates comparison */}
      <div className="comparison-rates">
        <div className="comp-rate-group">
          <h4>Taxa Efetiva IRS</h4>
          <div className="comp-rate-bars">
            <div className="comp-rate-item">
              <span className="comp-rate-label">Outrem</span>
              <div className="comp-rate-bar-track">
                <div
                  className="comp-rate-bar-fill employed"
                  style={{ width: `${Math.min(emp.effectiveIrsRate * 200, 100)}%` }}
                />
              </div>
              <span className="comp-rate-value">{formatPercent(emp.effectiveIrsRate)}</span>
            </div>
            <div className="comp-rate-item">
              <span className="comp-rate-label">Indep.</span>
              <div className="comp-rate-bar-track">
                <div
                  className="comp-rate-bar-fill self-employed"
                  style={{ width: `${Math.min(se.effectiveIrsRate * 200, 100)}%` }}
                />
              </div>
              <span className="comp-rate-value">{formatPercent(se.effectiveIrsRate)}</span>
            </div>
          </div>
        </div>

        <div className="comp-rate-group">
          <h4>Taxa Total Descontos</h4>
          <div className="comp-rate-bars">
            <div className="comp-rate-item">
              <span className="comp-rate-label">Outrem</span>
              <div className="comp-rate-bar-track">
                <div
                  className="comp-rate-bar-fill employed"
                  style={{ width: `${Math.min(emp.effectiveTotalRate * 200, 100)}%` }}
                />
              </div>
              <span className="comp-rate-value">{formatPercent(emp.effectiveTotalRate)}</span>
            </div>
            <div className="comp-rate-item">
              <span className="comp-rate-label">Indep.</span>
              <div className="comp-rate-bar-track">
                <div
                  className="comp-rate-bar-fill self-employed"
                  style={{ width: `${Math.min(se.effectiveTotalRate * 200, 100)}%` }}
                />
              </div>
              <span className="comp-rate-value">{formatPercent(se.effectiveTotalRate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employer cost note */}
      <div className="employer-section">
        <h3>Custo Empregador (Conta de Outrem)</h3>
        <div className="employer-row">
          <span>SS Patronal ({formatPercent(0.2375)})</span>
          <span>{formatCurrency(m ? emp.ssEmployer : emp.ssEmployerAnnual)}</span>
        </div>
        <div className="employer-row total">
          <span>Custo Total Anual</span>
          <span>{formatCurrency(emp.totalEmployerCostAnnual)}</span>
        </div>
      </div>
    </>
  );
}
