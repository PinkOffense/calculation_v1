// Public API — re-exports from all modules
// This preserves backward compatibility with existing imports

export type {
  EmploymentType, MaritalStatus, Region, ActivityType,
  VatRegime, FiscalRegime,
  SalaryInput, EmployedResult, SelfEmployedResult,
  ComparisonResult, SalaryResult, TaxBracket,
} from './types';

export { calculateSalary } from './calculator';
export { formatCurrency, formatPercent } from './formatters';
export { CONSTANTS } from './constants';
export { fetchTaxTables, getCachedTables, getCachedVersion } from './taxTables';
export type { TaxTables, TaxTablesJson } from './taxTables';
