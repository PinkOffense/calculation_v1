// Portuguese Salary Calculator - Tax Rules 2025
// Based on IRS withholding tables, Social Security contributions,
// and standard deduction rules for mainland Portugal.

export interface SalaryInput {
  grossMonthly: number;
  dependents: number;
  maritalStatus: 'single' | 'married_single_holder' | 'married_two_holders';
  hasDisability: boolean;
  mealAllowancePerDay: number;
  numberOfMonths: 14 | 12; // 14 = com sub. férias/Natal separados; 12 = duodécimos
}

export interface SalaryResult {
  // Monthly
  grossMonthly: number;
  ssEmployee: number;
  irsWithholding: number;
  netMonthly: number;
  mealAllowanceMonthly: number;
  totalNetMonthly: number;

  // Annual
  grossAnnual: number;
  ssAnnualEmployee: number;
  irsAnnual: number;
  netAnnual: number;
  mealAllowanceAnnual: number;
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

// Social Security rates
const SS_EMPLOYEE_RATE = 0.11; // 11%
const SS_EMPLOYER_RATE = 0.2375; // 23.75%

// Meal allowance exempt limit (2025)
const MEAL_ALLOWANCE_EXEMPT_CASH = 6.0; // €6.00/day cash
const WORKING_DAYS_PER_MONTH = 22;
const WORKING_MONTHS_FOR_MEAL = 11; // Meal allowance is typically for 11 months

// IRS withholding tables 2025 - Simplified progressive rates
// These are the marginal rates for monthly income after SS deduction
// Table: Não casado / Casado único titular / Casado dois titulares

interface TaxBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

// 2025 IRS Withholding tables (monthly, after SS)
// Simplified version based on official tables
const IRS_BRACKETS_SINGLE: TaxBracket[] = [
  { upTo: 820, rate: 0, deduction: 0 },
  { upTo: 935, rate: 0.1325, deduction: 108.59 },
  { upTo: 1001, rate: 0.18, deduction: 153.08 },
  { upTo: 1123, rate: 0.18, deduction: 153.08 },
  { upTo: 1765, rate: 0.26, deduction: 242.88 },
  { upTo: 2057, rate: 0.3275, deduction: 362.03 },
  { upTo: 2382, rate: 0.37, deduction: 449.46 },
  { upTo: 2786, rate: 0.3835, deduction: 481.62 },
  { upTo: 3523, rate: 0.4005, deduction: 528.96 },
  { upTo: 4400, rate: 0.41, deduction: 562.43 },
  { upTo: 5654, rate: 0.4350, deduction: 672.43 },
  { upTo: 6567, rate: 0.45, deduction: 757.24 },
  { upTo: 20000, rate: 0.4700, deduction: 888.58 },
  { upTo: Infinity, rate: 0.4800, deduction: 1088.58 },
];

const IRS_BRACKETS_MARRIED_SINGLE_HOLDER: TaxBracket[] = [
  { upTo: 820, rate: 0, deduction: 0 },
  { upTo: 935, rate: 0.1325, deduction: 108.59 },
  { upTo: 1001, rate: 0.18, deduction: 153.08 },
  { upTo: 1123, rate: 0.18, deduction: 175.08 },
  { upTo: 1765, rate: 0.26, deduction: 264.88 },
  { upTo: 2057, rate: 0.3275, deduction: 384.03 },
  { upTo: 2382, rate: 0.37, deduction: 471.46 },
  { upTo: 2786, rate: 0.3835, deduction: 503.62 },
  { upTo: 3523, rate: 0.4005, deduction: 550.96 },
  { upTo: 4400, rate: 0.41, deduction: 584.43 },
  { upTo: 5654, rate: 0.4350, deduction: 694.43 },
  { upTo: 6567, rate: 0.45, deduction: 779.24 },
  { upTo: 20000, rate: 0.4700, deduction: 910.58 },
  { upTo: Infinity, rate: 0.4800, deduction: 1110.58 },
];

const IRS_BRACKETS_MARRIED_TWO_HOLDERS: TaxBracket[] = [
  { upTo: 820, rate: 0, deduction: 0 },
  { upTo: 935, rate: 0.1325, deduction: 108.59 },
  { upTo: 1001, rate: 0.18, deduction: 153.08 },
  { upTo: 1123, rate: 0.18, deduction: 153.08 },
  { upTo: 1765, rate: 0.26, deduction: 242.88 },
  { upTo: 2057, rate: 0.3275, deduction: 362.03 },
  { upTo: 2382, rate: 0.37, deduction: 449.46 },
  { upTo: 2786, rate: 0.3835, deduction: 481.62 },
  { upTo: 3523, rate: 0.4005, deduction: 528.96 },
  { upTo: 4400, rate: 0.41, deduction: 562.43 },
  { upTo: 5654, rate: 0.4350, deduction: 672.43 },
  { upTo: 6567, rate: 0.45, deduction: 757.24 },
  { upTo: 20000, rate: 0.4700, deduction: 888.58 },
  { upTo: Infinity, rate: 0.4800, deduction: 1088.58 },
];

// Per-dependent monthly deduction from IRS withholding
const DEPENDENT_DEDUCTION = 21.43; // €/month per dependent (2025)

function getBrackets(maritalStatus: SalaryInput['maritalStatus']): TaxBracket[] {
  switch (maritalStatus) {
    case 'single':
      return IRS_BRACKETS_SINGLE;
    case 'married_single_holder':
      return IRS_BRACKETS_MARRIED_SINGLE_HOLDER;
    case 'married_two_holders':
      return IRS_BRACKETS_MARRIED_TWO_HOLDERS;
  }
}

function calculateIrsWithholding(
  taxableMonthly: number,
  maritalStatus: SalaryInput['maritalStatus'],
  dependents: number,
  _hasDisability: boolean
): number {
  const brackets = getBrackets(maritalStatus);

  let bracket: TaxBracket | undefined;
  for (const b of brackets) {
    if (taxableMonthly <= b.upTo) {
      bracket = b;
      break;
    }
  }

  if (!bracket || bracket.rate === 0) return 0;

  let withholding = taxableMonthly * bracket.rate - bracket.deduction;

  // Subtract dependent deduction
  withholding -= dependents * DEPENDENT_DEDUCTION;

  return Math.max(0, Math.round(withholding * 100) / 100);
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const { grossMonthly, dependents, maritalStatus, hasDisability, mealAllowancePerDay, numberOfMonths } = input;

  // Social Security (employee)
  const ssEmployee = Math.round(grossMonthly * SS_EMPLOYEE_RATE * 100) / 100;

  // Taxable income for IRS (after SS)
  const taxableMonthly = grossMonthly - ssEmployee;

  // IRS withholding
  const irsWithholding = calculateIrsWithholding(taxableMonthly, maritalStatus, dependents, hasDisability);

  // Net monthly salary
  const netMonthly = Math.round((grossMonthly - ssEmployee - irsWithholding) * 100) / 100;

  // Meal allowance (monthly)
  const mealAllowanceMonthly = Math.round(
    Math.min(mealAllowancePerDay, MEAL_ALLOWANCE_EXEMPT_CASH) * WORKING_DAYS_PER_MONTH * 100
  ) / 100;

  const totalNetMonthly = Math.round((netMonthly + mealAllowanceMonthly) * 100) / 100;

  // Annual calculations
  const grossAnnual = Math.round(grossMonthly * numberOfMonths * 100) / 100;
  const ssAnnualEmployee = Math.round(ssEmployee * numberOfMonths * 100) / 100;

  // IRS on holiday/Christmas subsidies (same rate applies)
  const irsAnnual = Math.round(irsWithholding * numberOfMonths * 100) / 100;

  const netAnnual = Math.round((grossAnnual - ssAnnualEmployee - irsAnnual) * 100) / 100;
  const mealAllowanceAnnual = Math.round(mealAllowanceMonthly * WORKING_MONTHS_FOR_MEAL * 100) / 100;
  const totalNetAnnual = Math.round((netAnnual + mealAllowanceAnnual) * 100) / 100;

  // Employer costs
  const ssEmployer = Math.round(grossMonthly * SS_EMPLOYER_RATE * 100) / 100;
  const ssEmployerAnnual = Math.round(ssEmployer * numberOfMonths * 100) / 100;
  const totalEmployerCostAnnual = Math.round((grossAnnual + ssEmployerAnnual) * 100) / 100;

  // Effective rates
  const irsRate = grossMonthly > 0 ? irsWithholding / grossMonthly : 0;
  const effectiveIrsRate = grossAnnual > 0 ? irsAnnual / grossAnnual : 0;
  const effectiveTotalRate = grossAnnual > 0 ? (irsAnnual + ssAnnualEmployee) / grossAnnual : 0;

  return {
    grossMonthly,
    ssEmployee,
    irsWithholding,
    netMonthly,
    mealAllowanceMonthly,
    totalNetMonthly,

    grossAnnual,
    ssAnnualEmployee,
    irsAnnual,
    netAnnual,
    mealAllowanceAnnual,
    totalNetAnnual,

    ssEmployer,
    ssEmployerAnnual,
    totalEmployerCostAnnual,

    effectiveIrsRate,
    effectiveTotalRate,
    ssRate: SS_EMPLOYEE_RATE,
    irsRate,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
