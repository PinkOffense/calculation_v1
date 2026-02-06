// Portuguese Salary Calculator - Tax Rules 2026
// Despacho n.º 233-A/2026, 6 de janeiro
// Supports: Conta de Outrem + Trabalhador Independente + Comparison mode
// IRS withholding, Social Security, IVA, IRS Jovem, Regional tables
//
// CORRECTIONS APPLIED (verified against official sources):
// - IRS applied to GROSS salary (not gross-SS) per Despacho examples
// - Tabela III: correct brackets from Despacho 233-A/2026
// - Variable formulas for transition brackets (rows 2-3)
// - Dependent deduction varies by table (21.43 / 34.29 / 42.86)
// - IRS retention services: 25% → 23% (since OE 2025)
// - Sales: no IRS withholding (Art. 101 CIRS)
// - IVA Art. 53: €14,500 → €15,000 (since 2025)
// - IRS Jovem: 10 years (Art. 12-B CIRS, OE 2025)
// - Madeira: 30% reduction (DLR 8/2025/M)
// - SS self-employed: 70% services, 20% sales

// ============================================================
// TYPES
// ============================================================

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
  totalGrossMonthly: number; // gross + other taxable
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

// ============================================================
// CONSTANTS
// ============================================================

// Social Security - Employed
const SS_EMPLOYEE_RATE = 0.11;
const SS_EMPLOYER_RATE = 0.2375;

// Social Security - Self-employed
const SS_SELF_EMPLOYED_RATE = 0.214; // 21.4%
const SS_SELF_EMPLOYED_BASE_SERVICES = 0.70; // 70% for services
const SS_SELF_EMPLOYED_BASE_SALES = 0.20;    // 20% for sales

// Meal allowance (2026 — Acordo Plurianual Função Pública)
const MEAL_ALLOWANCE_EXEMPT_CASH = 6.15;  // €6.15/day cash exempt
const MEAL_ALLOWANCE_EXEMPT_CARD = 10.46; // €10.46/day card exempt (6.15 × 1.70)
const WORKING_DAYS_PER_MONTH = 22;
const WORKING_MONTHS_FOR_MEAL = 11;

// IVA (2026)
const VAT_STANDARD_RATE = 0.23;
const VAT_EXEMPT_THRESHOLD = 15000; // €15,000/year (updated from €14,500 since 2025)

// IRS Withholding at source - Self-employed (Art. 101 CIRS)
// Since OE 2025: services reduced from 25% to 23%
const IRS_RETENTION_SERVICES = 0.23; // 23% — services listed in Art. 151 CIRS
// Sales of goods: NO withholding at source (Art. 101 only covers services)
const IRS_RETENTION_SALES = 0;

// Simplified regime coefficients (Art. 31 CIRS)
const COEFFICIENT_SERVICES = 0.75;
const COEFFICIENT_SALES = 0.15;

// Specific deduction (employed)
const SPECIFIC_DEDUCTION_ANNUAL = 4104;

// Per-dependent monthly deduction — varies by table (Despacho 233-A/2026)
const DEPENDENT_DEDUCTION_SINGLE = 34.29;         // Tabela II (não casado c/ dependentes)
const DEPENDENT_DEDUCTION_MARRIED_TWO = 21.43;    // Tabela I (casado dois titulares)
const DEPENDENT_DEDUCTION_MARRIED_SINGLE = 42.86;  // Tabela III (casado único titular)

function getDependentDeduction(maritalStatus: MaritalStatus): number {
  switch (maritalStatus) {
    case 'single': return DEPENDENT_DEDUCTION_SINGLE;
    case 'married_two_holders': return DEPENDENT_DEDUCTION_MARRIED_TWO;
    case 'married_single_holder': return DEPENDENT_DEDUCTION_MARRIED_SINGLE;
  }
}

// IRS Jovem - exemption percentages per year (2026 rules — Art. 12-B CIRS)
// OE 2025 extended to 10 years, age limit 35
const IRS_JOVEM_EXEMPTION: Record<number, number> = {
  1: 1.0,    // 100% exempt 1st year
  2: 0.75,   // 75% exempt 2nd-4th year
  3: 0.75,
  4: 0.75,
  5: 0.50,   // 50% exempt 5th-7th year
  6: 0.50,
  7: 0.50,
  8: 0.25,   // 25% exempt 8th-10th year
  9: 0.25,
  10: 0.25,
};

// Regional multipliers for IRS (Azores/Madeira have reduced rates)
const REGIONAL_IRS_MULTIPLIER: Record<Region, number> = {
  continente: 1.0,
  acores: 0.70,   // 30% reduction (DLR 15-A/2021/A)
  madeira: 0.70,   // 30% reduction for 2026 (DLR 8/2025/M — all brackets)
};

// ============================================================
// IRS BRACKETS 2026 (Despacho n.º 233-A/2026)
// IMPORTANT: Tables are applied to GROSS monthly salary (not gross-SS)
// Rows 2-3 use variable formulas (pre-computed as effective rate/deduction)
// ============================================================

interface TaxBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

// Tabela I/II — Não casado / Casado dois titulares (2026)
// Rows 2-3: variable formula pre-computed
// Row 2 original: 12.50% with deduction = 12.50% × 2.60 × (1273.85 - R)
//   effective: R × 0.45 - 414.00
// Row 3 original: 15.70% with deduction = 15.70% × 1.35 × (1554.83 - R)
//   effective: R × 0.36895 - 329.47
const IRS_BRACKETS_SINGLE: TaxBracket[] = [
  { upTo: 920,    rate: 0,       deduction: 0 },
  { upTo: 1042,   rate: 0.45,    deduction: 414.00 },    // Variable formula
  { upTo: 1108,   rate: 0.36895, deduction: 329.47 },    // Variable formula
  { upTo: 1154,   rate: 0.157,   deduction: 94.71 },
  { upTo: 1212,   rate: 0.212,   deduction: 158.18 },
  { upTo: 1819,   rate: 0.241,   deduction: 193.33 },
  { upTo: 2119,   rate: 0.311,   deduction: 320.66 },
  { upTo: 2499,   rate: 0.349,   deduction: 401.19 },
  { upTo: 3305,   rate: 0.3836,  deduction: 487.66 },
  { upTo: 5547,   rate: 0.3969,  deduction: 531.62 },
  { upTo: 20221,  rate: 0.4495,  deduction: 823.40 },
  { upTo: Infinity, rate: 0.4717, deduction: 1272.31 },
];

// Tabela III — Casado, único titular (2026)
// Row 2 original: 12.50% with deduction = 12.50% × 2.60 × (1372.15 - R)
//   effective: R × 0.45 - 445.95
// Row 3 original: 12.50% with deduction = 12.50% × 1.35 × (1677.85 - R)
//   effective: R × 0.29375 - 283.13
const IRS_BRACKETS_MARRIED_SINGLE_HOLDER: TaxBracket[] = [
  { upTo: 991,     rate: 0,        deduction: 0 },
  { upTo: 1042,    rate: 0.45,     deduction: 445.95 },    // Variable formula
  { upTo: 1108,    rate: 0.29375,  deduction: 283.13 },    // Variable formula
  { upTo: 1119,    rate: 0.125,    deduction: 96.17 },
  { upTo: 1432,    rate: 0.1272,   deduction: 98.64 },
  { upTo: 1962,    rate: 0.157,    deduction: 141.32 },
  { upTo: 2240,    rate: 0.1938,   deduction: 213.53 },
  { upTo: 2773,    rate: 0.2277,   deduction: 289.47 },
  { upTo: 3389,    rate: 0.257,    deduction: 370.72 },
  { upTo: 5965,    rate: 0.2881,   deduction: 476.12 },
  { upTo: 20265,   rate: 0.3843,   deduction: 1049.96 },
  { upTo: Infinity, rate: 0.4717,  deduction: 2821.13 },
];

// Tabela I is also used for Casado dois titulares (same brackets)
const IRS_BRACKETS_MARRIED_TWO_HOLDERS: TaxBracket[] = IRS_BRACKETS_SINGLE;

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

// IRS withholding: applied to GROSS monthly salary (not gross-SS)
// Formula: R × rate - deduction - (dependentDeduction × dependents)
// Then multiplied by regional factor
function calculateIrsWithholding(
  grossMonthly: number,
  maritalStatus: MaritalStatus,
  dependents: number,
  region: Region,
): number {
  const brackets = getBrackets(maritalStatus);
  const depDeduction = getDependentDeduction(maritalStatus);

  let bracket: TaxBracket | undefined;
  for (const b of brackets) {
    if (grossMonthly <= b.upTo) {
      bracket = b;
      break;
    }
  }

  if (!bracket || bracket.rate === 0) return 0;

  let withholding = grossMonthly * bracket.rate - bracket.deduction;
  withholding -= dependents * depDeduction;

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
    mealAllowanceType, numberOfMonths, region, irsJovem, irsJovemYear,
    otherTaxableIncome,
  } = input;

  // Total gross = base salary + other taxable supplements (overtime, shift, bonuses)
  const otherTaxable = Math.max(0, otherTaxableIncome || 0);
  const totalGrossMonthly = round2(grossMonthly + otherTaxable);

  // Social Security (employee) — applied to total gross
  const ssEmployee = round2(totalGrossMonthly * SS_EMPLOYEE_RATE);

  // IRS withholding — applied to total GROSS salary (tables already account for SS)
  let irsWithholding = calculateIrsWithholding(totalGrossMonthly, maritalStatus, dependents, region);

  // IRS Jovem discount
  let irsJovemDiscount = 0;
  if (irsJovem && irsJovemYear >= 1 && irsJovemYear <= 10) {
    const exemption = IRS_JOVEM_EXEMPTION[irsJovemYear] ?? 0;
    irsJovemDiscount = round2(irsWithholding * exemption);
    irsWithholding = round2(irsWithholding - irsJovemDiscount);
  }

  // Net monthly salary
  const netMonthly = round2(totalGrossMonthly - ssEmployee - irsWithholding);

  // Meal allowance (exempt portion depends on cash vs card)
  const mealExemptLimit = mealAllowanceType === 'card'
    ? MEAL_ALLOWANCE_EXEMPT_CARD
    : MEAL_ALLOWANCE_EXEMPT_CASH;
  const mealAllowanceMonthly = round2(
    Math.min(mealAllowancePerDay, mealExemptLimit) * WORKING_DAYS_PER_MONTH
  );
  const totalNetMonthly = round2(netMonthly + mealAllowanceMonthly);

  // Annual calculations — base salary paid in 14/12 months, supplements paid in 12
  const grossAnnual = round2(grossMonthly * numberOfMonths + otherTaxable * 12);
  const ssAnnualEmployee = round2(ssEmployee * numberOfMonths);
  const irsAnnual = round2(irsWithholding * numberOfMonths);
  const netAnnual = round2(grossAnnual - ssAnnualEmployee - irsAnnual);
  const mealAllowanceAnnual = round2(mealAllowanceMonthly * WORKING_MONTHS_FOR_MEAL);
  const totalNetAnnual = round2(netAnnual + mealAllowanceAnnual);

  // Employer costs
  const ssEmployer = round2(totalGrossMonthly * SS_EMPLOYER_RATE);
  const ssEmployerAnnual = round2(ssEmployer * numberOfMonths);
  const totalEmployerCostAnnual = round2(grossAnnual + ssEmployerAnnual);

  // Effective rates
  const irsRate = totalGrossMonthly > 0 ? irsWithholding / totalGrossMonthly : 0;
  const effectiveIrsRate = grossAnnual > 0 ? irsAnnual / grossAnnual : 0;
  const effectiveTotalRate = grossAnnual > 0 ? (irsAnnual + ssAnnualEmployee) / grossAnnual : 0;

  return {
    type: 'employed',
    grossMonthly, otherTaxableIncome: otherTaxable, totalGrossMonthly,
    ssEmployee, irsWithholding, irsJovemDiscount, netMonthly,
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
    selfEmployedFirstYear, selfEmployedExemptRetention,
  } = input;

  const grossAnnual = round2(grossMonthly * 12);

  // IRS Withholding at source (Art. 101 CIRS)
  // Services: 23%, Sales: 0% (no withholding)
  // Can be exempt if turnover < threshold in previous year
  let irsWithholdingRate = activityType === 'services'
    ? IRS_RETENTION_SERVICES
    : IRS_RETENTION_SALES;
  if (selfEmployedExemptRetention) {
    irsWithholdingRate = 0;
  }
  const irsWithholding = round2(grossMonthly * irsWithholdingRate);

  // Social Security (self-employed)
  // Base: 70% for services, 20% for sales/production
  // First year of activity: 12-month exemption (Art. 157 Código Contributivo)
  const ssIncomeBase = activityType === 'services'
    ? SS_SELF_EMPLOYED_BASE_SERVICES
    : SS_SELF_EMPLOYED_BASE_SALES;
  const ssBase = round2(grossMonthly * ssIncomeBase);
  const ssRate = SS_SELF_EMPLOYED_RATE;
  const ssContribution = selfEmployedFirstYear ? 0 : round2(ssBase * ssRate);
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
    // IRS is applied to gross (not gross-SS)
    const irs = calculateIrsWithholding(mid, maritalStatus, dependents, region);
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
// COMPARISON CALCULATION
// ============================================================

function calculateComparison(input: SalaryInput): ComparisonResult {
  const employed = calculateEmployed({ ...input, employmentType: 'employed' });
  const selfEmployed = calculateSelfEmployed({ ...input, employmentType: 'self_employed' });

  const monthlyDiff = employed.totalNetMonthly - selfEmployed.totalNetMonthly;
  const annualDiff = employed.totalNetAnnual - selfEmployed.totalNetAnnual;

  return {
    type: 'comparison',
    employed,
    selfEmployed,
    difference: {
      monthlyNet: monthlyDiff,
      annualNet: annualDiff,
      betterOption: annualDiff > 10 ? 'employed' : annualDiff < -10 ? 'self_employed' : 'equal',
    },
  };
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function calculateSalary(input: SalaryInput): SalaryResult {
  if (input.employmentType === 'compare') {
    return calculateComparison(input);
  }
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
  SS_SELF_EMPLOYED_BASE_SERVICES,
  SS_SELF_EMPLOYED_BASE_SALES,
  VAT_STANDARD_RATE,
  VAT_EXEMPT_THRESHOLD,
  IRS_RETENTION_SERVICES,
  IRS_RETENTION_SALES,
  COEFFICIENT_SERVICES,
  COEFFICIENT_SALES,
  SPECIFIC_DEDUCTION_ANNUAL,
  MEAL_ALLOWANCE_EXEMPT_CASH,
  MEAL_ALLOWANCE_EXEMPT_CARD,
};
