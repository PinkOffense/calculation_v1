import { useCallback } from 'react';
import type { SalaryResult, SalaryInput } from '../../utils';
import { exportPdf } from '../../utils/pdfExport';
import { EmployedResults } from './EmployedResults';
import { SelfEmployedResults } from './SelfEmployedResults';
import { ComparisonResults } from './ComparisonResults';

interface ResultsPanelProps {
  result: SalaryResult;
  input?: SalaryInput;
}

export default function ResultsPanel({ result, input }: ResultsPanelProps) {
  const handleExportPdf = useCallback(() => {
    if (input) exportPdf(input, result);
  }, [input, result]);

  return (
    <div className={`results-panel ${result.type === 'comparison' ? 'comparison-mode' : ''}`}>
      {result.type === 'employed' && <EmployedResults result={result} />}
      {result.type === 'self_employed' && <SelfEmployedResults result={result} />}
      {result.type === 'comparison' && <ComparisonResults result={result} />}

      {input && (
        <button className="pdf-export-btn" onClick={handleExportPdf} type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar PDF
        </button>
      )}
    </div>
  );
}
