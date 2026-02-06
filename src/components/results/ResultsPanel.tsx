import { useCallback, useState } from 'react';
import type { SalaryResult, SalaryInput } from '../../utils';
import { EmployedResults } from './EmployedResults';
import { SelfEmployedResults } from './SelfEmployedResults';
import { ComparisonResults } from './ComparisonResults';

interface ResultsPanelProps {
  result: SalaryResult;
  input?: SalaryInput;
}

export default function ResultsPanel({ result, input }: ResultsPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!input || exporting) return;
    setExporting(true);
    try {
      const { exportPdf } = await import('../../utils/pdfExport');
      await exportPdf(input, result);
    } finally {
      setExporting(false);
    }
  }, [input, result, exporting]);

  return (
    <div
      className={`results-panel ${result.type === 'comparison' ? 'comparison-mode' : ''}`}
      aria-live="polite"
      role="region"
      aria-label="Resultados do cálculo salarial"
    >
      {result.type === 'employed' && <EmployedResults result={result} />}
      {result.type === 'self_employed' && <SelfEmployedResults result={result} />}
      {result.type === 'comparison' && <ComparisonResults result={result} />}

      {input && (
        <button
          className="pdf-export-btn"
          onClick={handleExportPdf}
          type="button"
          disabled={exporting}
          aria-busy={exporting}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {exporting ? 'A gerar...' : 'Exportar PDF'}
        </button>
      )}
    </div>
  );
}
