// Portuguese Salary Calculator - Tax Rules 2025
// Supports: Conta de Outrem + Trabalhador Independente
// IRS withholding, Social Security, IVA, IRS Jovem, Regional tables

// ============================================================
// TYPES
// ============================================================

export type EmploymentType = 'employed' | 'self_employed';
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
  numberOfMonths: 14 | 12;
  irsJovem: boolean;
  irsJovemYear: 1 | 2 | 3 | 4 | 5; // Year of benefit (1st-5th)

  // Trabalhador Independente specific
  activityType: ActivityType;
  vatRegime: VatRegime;
  fiscalRegime: FiscalRegime;
  monthlyExpenses: number; // For organized accounting
}

export interface EmployedResult {
  type: 'employed';
  // Monthly
  grossMonthly: number;
  ssEmployee: number;
  irsWithholding: number;
  irsJovemDiscount: number;
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

export type SalaryResult = EmployedResult | SelfEmployedResult;

// ============================================================
// CONSTANTS
// ============================================================

// Social Security - Employed
const SS_EMPLOYEE_RATE = 0.11;
const SS_EMPLOYER_RATE = 0.2375;

// Social Security - Self-employed
const SS_SELF_EMPLOYED_RATE = 0.214; // 21.4%
const SS_SELF_EMPLOYED_INCOME_BASE = 0.70; // Applied on 70% of income

// Meal allowance
const MEAL_ALLOWANCE_EXEMPT_CASH = 6.0;
const WORKING_DAYS_PER_MONTH = 22;
const WORKING_MONTHS_FOR_MEAL = 11;

// IVA
const VAT_STANDARD_RATE = 0.23;
const VAT_EXEMPT_THRESHOLD = 14500; // Annual threshold for Art. 53

// IRS Withholding at source (self-employed)
const IRS_RETENTION_SERVICES = 0.25; // 25%
const IRS_RETENTION_SALES = 0.115; // 11.5% (not standard but for commercial/industrial)

// Simplified regime coefficients
const COEFFICIENT_SERVICES = 0.75;
const COEFFICIENT_SALES = 0.15;

// Specific deduction (employed)
const SPECIFIC_DEDUCTION_ANNUAL = 4104;

// Per-dependent monthly deduction
const DEPENDENT_DEDUCTION = 21.43;

// IRS Jovem - exemption percentages per year (2025 rules)
const IRS_JOVEM_EXEMPTION: Record<number, number> = {
  1: 1.0,   // 100% exempt 1st year
  2: 0.75,  // 75% exempt 2nd year
  3: 0.50,  // 50% exempt 3rd year
  4: 0.50,  // 50% exempt 4th year
  5: 0.25,  // 25% exempt 5th year
};

// Regional multipliers for IRS (Azores/Madeira have reduced rates)
const REGIONAL_IRS_MULTIPLIER: Record<Region, number> = {
  continente: 1.0,
  acores: 0.70,   // 30% reduction
  madeira: 0.80,   // 20% reduction
};

// ============================================================
// IRS BRACKETS (Monthly, after SS deduction)
// ============================================================

interface TaxBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

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

// ============================================================
// HELPERS
// ============================================================

const round2 = (v: number) => Math.round(v * 100) / 100;

function getBrackets(maritalStatus: MaritalStatus): TaxBracket[] {
  switch (maritalStatus) {
    case 'single': return IRS_BRACKETS_SINGLE;
    case 'married_single_holder': return IRS_BRACKETS_MARRIED_SINGLE_HOLDER;
    case 'married_two_holders': return IRS_BRACKETS_MARRIED_TWO_HOLDERS;
  }
}

function calculateIrsWithholding(
  taxableMonthly: number,
  maritalStatus: MaritalStatus,
  dependents: number,
  region: Region,
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
  withholding -= dependents * DEPENDENT_DEDUCTION;

  // Apply regional multiplier
  withholding *= REGIONAL_IRS_MULTIPLIER[region];

  return Math.max(0, round2(withholding));
}

// ============================================================
// EMPLOYED CALCULATION
// ============================================================

function calculateEmployed(input: SalaryInput): EmployedResult {
  const {
    grossMonthly, dependents, maritalStatus, mealAllowancePerDay,
    numberOfMonths, region, irsJovem, irsJovemYear,
  } = input;

  // Social Security (employee)
  const ssEmployee = round2(grossMonthly * SS_EMPLOYEE_RATE);

  // Taxable income for IRS (after SS)
  const taxableMonthly = grossMonthly - ssEmployee;

  // IRS withholding
  let irsWithholding = calculateIrsWithholding(taxableMonthly, maritalStatus, dependents, region);

  // IRS Jovem discount
  let irsJovemDiscount = 0;
  if (irsJovem && irsJovemYear >= 1 && irsJovemYear <= 5) {
    const exemption = IRS_JOVEM_EXEMPTION[irsJovemYear];
    irsJovemDiscount = round2(irsWithholding * exemption);
    irsWithholding = round2(irsWithholding - irsJovemDiscount);
  }

  // Net monthly salary
  const netMonthly = round2(grossMonthly - ssEmployee - irsWithholding);

  // Meal allowance
  const mealAllowanceMonthly = round2(
    Math.min(mealAllowancePerDay, MEAL_ALLOWANCE_EXEMPT_CASH) * WORKING_DAYS_PER_MONTH
  );
  const totalNetMonthly = round2(netMonthly + mealAllowanceMonthly);

  // Annual calculations
  const grossAnnual = round2(grossMonthly * numberOfMonths);
  const ssAnnualEmployee = round2(ssEmployee * numberOfMonths);
  const irsAnnual = round2(irsWithholding * numberOfMonths);
  const netAnnual = round2(grossAnnual - ssAnnualEmployee - irsAnnual);
  const mealAllowanceAnnual = round2(mealAllowanceMonthly * WORKING_MONTHS_FOR_MEAL);
  const totalNetAnnual = round2(netAnnual + mealAllowanceAnnual);

  // Employer costs
  const ssEmployer = round2(grossMonthly * SS_EMPLOYER_RATE);
  const ssEmployerAnnual = round2(ssEmployer * numberOfMonths);
  const totalEmployerCostAnnual = round2(grossAnnual + ssEmployerAnnual);

  // Effective rates
  const irsRate = grossMonthly > 0 ? irsWithholding / grossMonthly : 0;
  const effectiveIrsRate = grossAnnual > 0 ? irsAnnual / grossAnnual : 0;
  const effectiveTotalRate = grossAnnual > 0 ? (irsAnnual + ssAnnualEmployee) / grossAnnual : 0;

  return {
    type: 'employed',
    grossMonthly, ssEmployee, irsWithholding, irsJovemDiscount, netMonthly,
    mealAllowanceMonthly, totalNetMonthly,
    grossAnnual, ssAnnualEmployee, irsAnnual, netAnnual,
    mealAllowanceAnnual, totalNetAnnual,
    ssEmployer, ssEmployerAnnual, totalEmployerCostAnnual,
    effectiveIrsRate, effectiveTotalRate,
    ssRate: SS_EMPLOYEE_RATE, irsRate,
  };
}

// ============================================================
// SELF-EMPLOYED CALCULATION
// ============================================================

function calculateSelfEmployed(input: SalaryInput): SelfEmployedResult {
  const {
    grossMonthly, activityType, vatRegime, fiscalRegime,
    monthlyExpenses, region, dependents, maritalStatus,
  } = input;

  const grossAnnual = round2(grossMonthly * 12);

  // IRS Withholding at source
  const irsWithholdingRate = activityType === 'services'
    ? IRS_RETENTION_SERVICES
    : IRS_RETENTION_SALES;
  const irsWithholding = round2(grossMonthly * irsWithholdingRate);

  // Social Security (self-employed)
  // Based on 70% of income, with 21.4% rate, assessed quarterly
  const ssBase = round2(grossMonthly * SS_SELF_EMPLOYED_INCOME_BASE);
  const ssRate = SS_SELF_EMPLOYED_RATE;
  const ssContribution = round2(ssBase * ssRate);
  const ssAnnual = round2(ssContribution * 12);

  // IVA (VAT)
  let vatRate = 0;
  let vatCollected = 0;
  let vatAnnual = 0;

  if (vatRegime === 'normal') {
    vatRate = VAT_STANDARD_RATE;
    vatCollected = round2(grossMonthly * vatRate);
    vatAnnual = round2(vatCollected * 12);
  }
  // Art. 53 exempt if annual < €14,500

  // Taxable income calculation
  let coefficient: number;
  let taxableIncome: number;
  const annualExpenses = round2(monthlyExpenses * 12);

  if (fiscalRegime === 'simplified') {
    coefficient = activityType === 'services' ? COEFFICIENT_SERVICES : COEFFICIENT_SALES;
    taxableIncome = round2(grossAnnual * coefficient);
  } else {
    // Organized accounting: revenue - expenses
    coefficient = 1;
    taxableIncome = round2(Math.max(0, grossAnnual - annualExpenses));
  }

  // Apply regional multiplier to IRS retention
  const regionalIrs = round2(irsWithholding * REGIONAL_IRS_MULTIPLIER[region]);
  const regionalIrsAnnual = round2(regionalIrs * 12);
  const regionalNetMonthly = round2(grossMonthly - regionalIrs - ssContribution);
  const regionalNetAnnual = round2(grossAnnual - regionalIrsAnnual - ssAnnual);

  // Equivalent gross employed salary (binary search)
  const equivalentGrossEmployed = findEquivalentEmployedGross(regionalNetAnnual, dependents, maritalStatus, region);

  return {
    type: 'self_employed',
    grossMonthly,
    irsWithholding: regionalIrs,
    irsWithholdingRate,
    ssContribution, ssBase, ssRate,
    vatCollected, vatRate,
    netMonthly: regionalNetMonthly,
    totalNetMonthly: regionalNetMonthly,
    grossAnnual,
    irsAnnual: regionalIrsAnnual,
    ssAnnual, vatAnnual,
    taxableIncome, coefficient,
    netAnnual: regionalNetAnnual,
    totalNetAnnual: regionalNetAnnual,
    monthlyExpenses, annualExpenses,
    equivalentGrossEmployed,
    effectiveIrsRate: grossAnnual > 0 ? regionalIrsAnnual / grossAnnual : 0,
    effectiveTotalRate: grossAnnual > 0 ? (regionalIrsAnnual + ssAnnual) / grossAnnual : 0,
  };
}

function findEquivalentEmployedGross(
  targetNetAnnual: number,
  dependents: number,
  maritalStatus: MaritalStatus,
  region: Region,
): number {
  // Binary search for equivalent employed gross that yields same annual net
  let low = 0;
  let high = targetNetAnnual * 2.5;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const ss = mid * SS_EMPLOYEE_RATE;
    const taxable = mid - ss;
    const irs = calculateIrsWithholding(taxable, maritalStatus, dependents, region);
    const net = mid - ss - irs;
    const annualNet = net * 14; // Standard 14 months

    if (annualNet < targetNetAnnual) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return round2((low + high) / 2);
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function calculateSalary(input: SalaryInput): SalaryResult {
  if (input.employmentType === 'self_employed') {
    return calculateSelfEmployed(input);
  }
  return calculateEmployed(input);
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

// Re-export constants for use in components
export const CONSTANTS = {
  SS_EMPLOYEE_RATE,
  SS_EMPLOYER_RATE,
  SS_SELF_EMPLOYED_RATE,
  SS_SELF_EMPLOYED_INCOME_BASE,
  VAT_STANDARD_RATE,
  VAT_EXEMPT_THRESHOLD,
  IRS_RETENTION_SERVICES,
  IRS_RETENTION_SALES,
  COEFFICIENT_SERVICES,
  COEFFICIENT_SALES,
  SPECIFIC_DEDUCTION_ANNUAL,
  MEAL_ALLOWANCE_EXEMPT_CASH,
};
