// Portuguese Salary Calculator - Type Definitions
// All interfaces and type aliases used across the calculator

export type EmploymentType = 'employed' | 'self_employed' | 'compare';
export type MaritalStatus = 'single' | 'married_single_holder' | 'married_two_holders';
export type Region = 'continente' | 'acores' | 'madeira';
export type ActivityType = 'services' | 'sales';
export type VatRegime = 'normal' | 'exempt_art53';
export type FiscalRegime = 'simplified' | 'organized';

export interface SalaryInput {
  employmentType: EmploymentType;
  grossMonthly: number;
  dependents: number;
  maritalStatus: MaritalStatus;
  hasDisability: boolean;
  region: Region;

  // Conta de Outrem specific
  mealAllowancePerDay: number;
  mealAllowanceType: 'cash' | 'card';
  numberOfMonths: 14 | 12;
  irsJovem: boolean;
  irsJovemYear: number; // 1-10
  otherTaxableIncome: number; // Overtime, shift pay, bonuses — subject to IRS+SS

  // Trabalhador Independente specific
  activityType: ActivityType;
  vatRegime: VatRegime;
  fiscalRegime: FiscalRegime;
  monthlyExpenses: number; // For organized accounting
  selfEmployedFirstYear: boolean;    // 1st year activity — 12-month SS exemption
  selfEmployedExemptRetention: boolean; // Exempt from IRS withholding at source
}

export interface EmployedResult {
  type: 'employed';
  // Monthly
  grossMonthly: number;
  otherTaxableIncome: number;
  totalGrossMonthly: number;
  ssEmployee: number;
  irsWithholding: number;
  irsJovemDiscount: number;
  netMonthly: number;
  mealAllowanceMonthly: number;
  mealExemptMonthly: number;
  mealTaxableMonthly: number;
  totalNetMonthly: number;

  // Annual
  grossAnnual: number;
  ssAnnualEmployee: number;
  irsAnnual: number;
  netAnnual: number;
  mealAllowanceAnnual: number;
  mealTaxableAnnual: number;
  totalNetAnnual: number;

  // Employer costs
  ssEmployer: number;
  ssEmployerAnnual: number;
  totalEmployerCostAnnual: number;

  // Rates
  effectiveIrsRate: number;
  effectiveTotalRate: number;
  ssRate: number;
  irsRate: number;
}

export interface SelfEmployedResult {
  type: 'self_employed';
  // Monthly
  grossMonthly: number;
  irsWithholding: number;
  irsWithholdingRate: number;
  ssContribution: number;
  ssBase: number;
  ssRate: number;
  vatCollected: number;
  vatRate: number;
  netMonthly: number;
  totalNetMonthly: number;

  // Annual
  grossAnnual: number;
  irsAnnual: number;
  ssAnnual: number;
  vatAnnual: number;
  taxableIncome: number;
  coefficient: number;
  netAnnual: number;
  totalNetAnnual: number;

  // Organized accounting specifics
  monthlyExpenses: number;
  annualExpenses: number;

  // Equivalence
  equivalentGrossEmployed: number;

  // Rates
  effectiveIrsRate: number;
  effectiveTotalRate: number;
}

export interface ComparisonResult {
  type: 'comparison';
  employed: EmployedResult;
  selfEmployed: SelfEmployedResult;
  difference: {
    monthlyNet: number;
    annualNet: number;
    betterOption: 'employed' | 'self_employed' | 'equal';
  };
}

export type SalaryResult = EmployedResult | SelfEmployedResult | ComparisonResult;

export interface TaxBracket {
  upTo: number;
  rate: number;
  deduction: number;
}
