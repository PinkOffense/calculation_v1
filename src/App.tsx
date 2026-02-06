import { useState, useMemo } from 'react';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import { calculateSalary } from './utils/taxCalculator';
import type { SalaryInput } from './utils/taxCalculator';
import './App.css';

const defaultInput: SalaryInput = {
  grossMonthly: 1500,
  dependents: 0,
  maritalStatus: 'single',
  hasDisability: false,
  mealAllowancePerDay: 6.0,
  numberOfMonths: 14,
};

function App() {
  const [input, setInput] = useState<SalaryInput>(defaultInput);

  const result = useMemo(() => calculateSalary(input), [input]);

  return (
    <div className="app">
      {/* Animated background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <header className="app-header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
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
        <p className="subtitle">Calculadora de Salário Líquido &middot; Portugal 2025</p>
      </header>

      <main className="app-main">
        <InputForm input={input} onChange={setInput} />
        <ResultsPanel result={result} />
      </main>

      <footer className="app-footer">
        <p>
          Valores indicativos baseados nas tabelas de retenção IRS 2025 para Portugal Continental.
          <br />
          Consulte sempre um contabilista para situações específicas.
        </p>
      </footer>
    </div>
  );
}

export default App;
