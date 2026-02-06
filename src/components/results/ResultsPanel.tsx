import type { SalaryResult } from '../../utils';
import { EmployedResults } from './EmployedResults';
import { SelfEmployedResults } from './SelfEmployedResults';
import { ComparisonResults } from './ComparisonResults';

interface ResultsPanelProps {
  result: SalaryResult;
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
