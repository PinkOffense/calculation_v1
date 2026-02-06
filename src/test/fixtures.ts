// Shared test fixtures — default SalaryInput factory
import type { SalaryInput } from '../utils';

/**
 * Creates a default SalaryInput with sensible values.
 * Override any field via the `overrides` parameter.
 */
export function createInput(overrides: Partial<SalaryInput> = {}): SalaryInput {
  return {
    employmentType: 'employed',
    grossMonthly: 1500,
    dependents: 0,
    maritalStatus: 'single',
    hasDisability: false,
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
    ...overrides,
  };
}
