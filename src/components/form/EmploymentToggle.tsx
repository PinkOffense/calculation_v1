import type { EmploymentType } from '../../utils';

interface EmploymentToggleProps {
  value: EmploymentType;
  onChange: (value: EmploymentType) => void;
}

export function EmploymentToggle({ value, onChange }: EmploymentToggleProps) {
  const isEmployed = value === 'employed';
  const isSelfEmployed = value === 'self_employed';
  const isCompare = value === 'compare';

  return (
    <div className="employment-toggle triple" role="group" aria-label="Tipo de emprego">
      <button
        className={isEmployed ? 'active' : ''}
        onClick={() => onChange('employed')}
        aria-pressed={isEmployed}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span className="toggle-label-full">Conta de Outrem</span>
        <span className="toggle-label-short">Outrem</span>
      </button>
      <button
        className={isSelfEmployed ? 'active' : ''}
        onClick={() => onChange('self_employed')}
        aria-pressed={isSelfEmployed}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span className="toggle-label-full">Independente</span>
        <span className="toggle-label-short">Indep.</span>
      </button>
      <button
        className={isCompare ? 'active compare' : ''}
        onClick={() => onChange('compare')}
        aria-pressed={isCompare}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span className="toggle-label-full">Comparar</span>
        <span className="toggle-label-short">Comp.</span>
      </button>
    </div>
  );
}
