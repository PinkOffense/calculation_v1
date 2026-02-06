import { useState, useMemo } from 'react';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import { calculateSalary } from './utils/taxCalculator';
import type { SalaryInput } from './utils/taxCalculator';
import { useTaxTables } from './hooks/useTaxTables';
import './App.css';

const defaultInput: SalaryInput = {
  employmentType: 'employed',
  grossMonthly: 1500,
  dependents: 0,
  maritalStatus: 'single',
  region: 'continente',
  mealAllowancePerDay: 7.63,
  mealAllowanceType: 'card',
  numberOfMonths: 14,
  irsJovem: false,
  irsJovemYear: 1,
  otherTaxableIncome: 0,
  activityType: 'services',
  vatRegime: 'exempt_art53',
  fiscalRegime: 'simplified',
  monthlyExpenses: 0,
  selfEmployedFirstYear: false,
  selfEmployedExemptRetention: false,
};

function App() {
  const [input, setInput] = useState<SalaryInput>(defaultInput);
  const taxTables = useTaxTables();

  const result = useMemo(
    () => calculateSalary(input, taxTables.tables ?? undefined),
    [input, taxTables.tables],
  );

  const versionLabel = taxTables.version
    ? `Tabelas IRS ${taxTables.tables?.year ?? 2026} · v${taxTables.version}`
    : null;
  const sourceLabel = taxTables.tables?.source ?? 'Despacho n.º 233-A/2026';

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <div className="bg-blob blob-1" aria-hidden="true" />
      <div className="bg-blob blob-2" aria-hidden="true" />
      <div className="bg-blob blob-3" aria-hidden="true" />

      <header className="app-header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
            <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">
              S
            </text>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#e8436f" />
                <stop offset="1" stopColor="#ff8fa3" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Salário PT</h1>
        </div>
        <p className="subtitle">Calculadora de Salário Líquido &middot; Portugal 2026</p>
      </header>

      <main id="main-content" className="app-main">
        <InputForm input={input} onChange={setInput} />
        <ResultsPanel result={result} input={input} />
      </main>

      <footer className="app-footer">
        <p>
          Valores indicativos baseados nas tabelas de retenção IRS {taxTables.tables?.year ?? 2026} ({sourceLabel}).
          {versionLabel && <> · {versionLabel}</>}
          <br />
          Inclui regras para Continente, Açores e Madeira.
          Consulte sempre um contabilista para situações específicas.
        </p>
      </footer>
    </div>
  );
}

export default App;
