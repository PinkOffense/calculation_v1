import { useState } from 'react';
import type { SalaryResult, EmployedResult, SelfEmployedResult, ComparisonResult } from '../utils/taxCalculator';
import { formatCurrency, formatPercent } from '../utils/taxCalculator';
import DonutChart from './DonutChart';

interface ResultsPanelProps {
  result: SalaryResult;
}

function EmployedResults({ result }: { result: EmployedResult }) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const m = view === 'monthly';

  const gross = m ? result.grossMonthly : result.grossAnnual;
  const ss = m ? result.ssEmployee : result.ssAnnualEmployee;
  const irs = m ? result.irsWithholding : result.irsAnnual;
  const net = m ? result.netMonthly : result.netAnnual;
  const meal = m ? result.mealAllowanceMonthly : result.mealAllowanceAnnual;
  const totalNet = m ? result.totalNetMonthly : result.totalNetAnnual;

  const donutSegments = [
    { label: 'Salário Líquido', value: net, color: '#e8436f' },
    { label: 'Seg. Social (11%)', value: ss, color: '#ff8fa3' },
    { label: 'IRS', value: irs, color: '#2d2d3f' },
  ];
  if (meal > 0) {
    donutSegments.splice(1, 0, { label: 'Sub. Alimentação', value: meal, color: '#ffb3c1' });
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
        <span className="hero-label">Salário Líquido {m ? 'Mensal' : 'Anual'}</span>
        <span className="hero-value animate-value" key={`e-${view}-${totalNet}`}>
          {formatCurrency(totalNet)}
        </span>
        {meal > 0 && (
          <span className="hero-subtitle">
            {formatCurrency(net)} + {formatCurrency(meal)} sub. alimentação
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

function SelfEmployedResults({ result }: { result: SelfEmployedResult }) {
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
        <span className="hero-value animate-value" key={`s-${view}-${net}`}>
          {formatCurrency(net)}
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
            Seg. Social ({formatPercent(result.ssRate)} s/ {formatPercent(0.70)})
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
          <span className="breakdown-value">{formatCurrency(net)}</span>
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
          <span>Base SS mensal (70%)</span>
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

function ComparisonResults({ result }: { result: ComparisonResult }) {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const m = view === 'monthly';

  const emp = result.employed;
  const se = result.selfEmployed;
  const diff = result.difference;

  const empNet = m ? emp.totalNetMonthly : emp.totalNetAnnual;
  const seNet = m ? se.totalNetMonthly : se.totalNetAnnual;
  const netDiff = m ? diff.monthlyNet : diff.annualNet;

  const empGross = m ? emp.grossMonthly : emp.grossAnnual;
  const seGross = m ? se.grossMonthly : se.grossAnnual;

  const empSS = m ? emp.ssEmployee : emp.ssAnnualEmployee;
  const seSS = m ? se.ssContribution : se.ssAnnual;

  const empIRS = m ? emp.irsWithholding : emp.irsAnnual;
  const seIRS = m ? se.irsWithholding : se.irsAnnual;

  const empMeal = m ? emp.mealAllowanceMonthly : emp.mealAllowanceAnnual;

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
          <span className="comp-hero-value animate-value" key={`ce-${view}-${empNet}`}>
            {formatCurrency(empNet)}
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
          <span className="comp-hero-value animate-value" key={`cs-${view}-${seNet}`}>
            {formatCurrency(seNet)}
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

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className={`results-panel ${result.type === 'comparison' ? 'comparison-mode' : ''}`}>
      {result.type === 'employed' && <EmployedResults result={result} />}
      {result.type === 'self_employed' && <SelfEmployedResults result={result} />}
      {result.type === 'comparison' && <ComparisonResults result={result} />}
    </div>
  );
}
