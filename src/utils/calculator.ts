// Salary calculation engine
// Employed, Self-Employed, and Comparison modes
// Accepts optional TaxTables for dynamic configuration, falls back to hardcoded constants

import type {
  SalaryInput, MaritalStatus, Region, TaxBracket,
  EmployedResult, SelfEmployedResult, ComparisonResult, SalaryResult,
} from './types';
import type { TaxTables } from './taxTables';
import {
  SS_EMPLOYEE_RATE, SS_EMPLOYER_RATE,
  SS_SELF_EMPLOYED_RATE, SS_SELF_EMPLOYED_BASE_SERVICES, SS_SELF_EMPLOYED_BASE_SALES,
  MEAL_ALLOWANCE_EXEMPT_CASH, MEAL_ALLOWANCE_EXEMPT_CARD,
  WORKING_DAYS_PER_MONTH, WORKING_MONTHS_FOR_MEAL,
  VAT_STANDARD_RATE, IRS_RETENTION_SERVICES, IRS_RETENTION_SALES,
  COEFFICIENT_SERVICES, COEFFICIENT_SALES,
  IRS_JOVEM_EXEMPTION, REGIONAL_IRS_MULTIPLIER,
  getBrackets, getDependentDeduction,
} from './constants';

// ---- Internal config resolved from TaxTables or hardcoded defaults ----

interface CalcConfig {
  ssEmployeeRate: number;
  ssEmployerRate: number;
  ssSelfEmployedRate: number;
  ssSelfEmployedBaseServices: number;
  ssSelfEmployedBaseSales: number;
  mealExemptCash: number;
  mealExemptCard: number;
  workingDaysPerMonth: number;
  workingMonthsForMeal: number;
  vatStandardRate: number;
  irsRetentionServices: number;
  irsRetentionSales: number;
  coefficientServices: number;
  coefficientSales: number;
  irsJovemExemption: Record<number, number>;
  regionalMultiplier: Record<Region, number>;
  getBrackets: (ms: MaritalStatus) => TaxBracket[];
  getDependentDeduction: (ms: MaritalStatus) => number;
}

function resolveConfig(tables?: TaxTables): CalcConfig {
  if (tables) {
    return {
      ssEmployeeRate: tables.ss.employeeRate,
      ssEmployerRate: tables.ss.employerRate,
      ssSelfEmployedRate: tables.ss.selfEmployedRate,
      ssSelfEmployedBaseServices: tables.ss.selfEmployedBaseServices,
      ssSelfEmployedBaseSales: tables.ss.selfEmployedBaseSales,
      mealExemptCash: tables.meal.exemptCash,
      mealExemptCard: tables.meal.exemptCard,
      workingDaysPerMonth: tables.meal.workingDaysPerMonth,
      workingMonthsForMeal: tables.meal.workingMonthsForMeal,
      vatStandardRate: tables.vat.standardRate,
      irsRetentionServices: tables.irsRetention.services,
      irsRetentionSales: tables.irsRetention.sales,
      coefficientServices: tables.coefficients.services,
      coefficientSales: tables.coefficients.sales,
      irsJovemExemption: tables.irsJovemExemption,
      regionalMultiplier: tables.regionalMultipliers,
      getBrackets: (ms) => tables.brackets[ms],
      getDependentDeduction: (ms) => tables.dependentDeductions[ms],
    };
  }

  return {
    ssEmployeeRate: SS_EMPLOYEE_RATE,
    ssEmployerRate: SS_EMPLOYER_RATE,
    ssSelfEmployedRate: SS_SELF_EMPLOYED_RATE,
    ssSelfEmployedBaseServices: SS_SELF_EMPLOYED_BASE_SERVICES,
    ssSelfEmployedBaseSales: SS_SELF_EMPLOYED_BASE_SALES,
    mealExemptCash: MEAL_ALLOWANCE_EXEMPT_CASH,
    mealExemptCard: MEAL_ALLOWANCE_EXEMPT_CARD,
    workingDaysPerMonth: WORKING_DAYS_PER_MONTH,
    workingMonthsForMeal: WORKING_MONTHS_FOR_MEAL,
    vatStandardRate: VAT_STANDARD_RATE,
    irsRetentionServices: IRS_RETENTION_SERVICES,
    irsRetentionSales: IRS_RETENTION_SALES,
    coefficientServices: COEFFICIENT_SERVICES,
    coefficientSales: COEFFICIENT_SALES,
    irsJovemExemption: IRS_JOVEM_EXEMPTION,
    regionalMultiplier: REGIONAL_IRS_MULTIPLIER,
    getBrackets,
    getDependentDeduction,
  };
}

// ---- Helpers ----

const round2 = (v: number) => Math.round(v * 100) / 100;

function calculateIrsWithholding(
  grossMonthly: number,
  maritalStatus: MaritalStatus,
  dependents: number,
  region: Region,
  cfg: CalcConfig,
): number {
  const brackets = cfg.getBrackets(maritalStatus);
  const depDeduction = cfg.getDependentDeduction(maritalStatus);

  const bracket = brackets.find(b => grossMonthly <= b.upTo);
  if (!bracket || bracket.rate === 0) return 0;

  let withholding = grossMonthly * bracket.rate - bracket.deduction;
  withholding -= dependents * depDeduction;
  withholding *= cfg.regionalMultiplier[region];

  return Math.max(0, round2(withholding));
}

// ---- Employed ----

function calculateEmployed(input: SalaryInput, cfg: CalcConfig): EmployedResult {
  const {
    grossMonthly, dependents, maritalStatus, mealAllowancePerDay,
    mealAllowanceType, numberOfMonths, region, irsJovem, irsJovemYear,
    otherTaxableIncome,
  } = input;

  const otherTaxable = Math.max(0, otherTaxableIncome || 0);
  const totalGrossMonthly = round2(grossMonthly + otherTaxable);

  // Meal allowance: full amount received, excess above exempt limit is taxable
  const mealExemptLimit = mealAllowanceType === 'card'
    ? cfg.mealExemptCard : cfg.mealExemptCash;
  const mealAllowanceMonthly = round2(mealAllowancePerDay * cfg.workingDaysPerMonth);
  const mealExemptMonthly = round2(Math.min(mealAllowancePerDay, mealExemptLimit) * cfg.workingDaysPerMonth);
  const mealTaxableMonthly = round2(Math.max(0, mealAllowancePerDay - mealExemptLimit) * cfg.workingDaysPerMonth);

  // Taxable gross = salary + supplements + meal taxable excess
  const taxableGrossMonthly = round2(totalGrossMonthly + mealTaxableMonthly);

  const ssEmployee = round2(taxableGrossMonthly * cfg.ssEmployeeRate);
  let irsWithholding = calculateIrsWithholding(taxableGrossMonthly, maritalStatus, dependents, region, cfg);

  // IRS Jovem discount
  let irsJovemDiscount = 0;
  if (irsJovem && irsJovemYear >= 1 && irsJovemYear <= 10) {
    const exemption = cfg.irsJovemExemption[irsJovemYear] ?? 0;
    irsJovemDiscount = round2(irsWithholding * exemption);
    irsWithholding = round2(irsWithholding - irsJovemDiscount);
  }

  const netMonthly = round2(taxableGrossMonthly - ssEmployee - irsWithholding);
  const totalNetMonthly = round2(netMonthly + mealExemptMonthly);

  // Annual
  const grossAnnual = round2(grossMonthly * numberOfMonths + otherTaxable * 12);
  const mealAllowanceAnnual = round2(mealAllowanceMonthly * cfg.workingMonthsForMeal);
  const mealTaxableAnnual = round2(mealTaxableMonthly * cfg.workingMonthsForMeal);
  const mealExemptAnnual = round2(mealExemptMonthly * cfg.workingMonthsForMeal);
  const taxableGrossAnnual = round2(grossAnnual + mealTaxableAnnual);
  const ssAnnualEmployee = round2(ssEmployee * numberOfMonths);
  const irsAnnual = round2(irsWithholding * numberOfMonths);
  const netAnnual = round2(taxableGrossAnnual - ssAnnualEmployee - irsAnnual);
  const totalNetAnnual = round2(netAnnual + mealExemptAnnual);

  // Employer costs
  const ssEmployer = round2(taxableGrossMonthly * cfg.ssEmployerRate);
  const ssEmployerAnnual = round2(ssEmployer * numberOfMonths);
  const totalEmployerCostAnnual = round2(grossAnnual + mealAllowanceAnnual + ssEmployerAnnual);

  const irsRate = taxableGrossMonthly > 0 ? irsWithholding / taxableGrossMonthly : 0;
  const effectiveIrsRate = taxableGrossAnnual > 0 ? irsAnnual / taxableGrossAnnual : 0;
  const effectiveTotalRate = taxableGrossAnnual > 0 ? (irsAnnual + ssAnnualEmployee) / taxableGrossAnnual : 0;

  return {
    type: 'employed',
    grossMonthly, otherTaxableIncome: otherTaxable, totalGrossMonthly,
    ssEmployee, irsWithholding, irsJovemDiscount, netMonthly,
    mealAllowanceMonthly, mealExemptMonthly, mealTaxableMonthly, totalNetMonthly,
    grossAnnual, ssAnnualEmployee, irsAnnual, netAnnual,
    mealAllowanceAnnual, mealTaxableAnnual, totalNetAnnual,
    ssEmployer, ssEmployerAnnual, totalEmployerCostAnnual,
    effectiveIrsRate, effectiveTotalRate,
    ssRate: cfg.ssEmployeeRate, irsRate,
  };
}

// ---- Self-Employed ----

function calculateSelfEmployed(input: SalaryInput, cfg: CalcConfig): SelfEmployedResult {
  const {
    grossMonthly, activityType, vatRegime, fiscalRegime,
    monthlyExpenses, region, dependents, maritalStatus,
    selfEmployedFirstYear, selfEmployedExemptRetention,
  } = input;

  const grossAnnual = round2(grossMonthly * 12);

  let irsWithholdingRate = activityType === 'services' ? cfg.irsRetentionServices : cfg.irsRetentionSales;
  if (selfEmployedExemptRetention) irsWithholdingRate = 0;
  const irsWithholding = round2(grossMonthly * irsWithholdingRate);

  const ssIncomeBase = activityType === 'services'
    ? cfg.ssSelfEmployedBaseServices : cfg.ssSelfEmployedBaseSales;
  const ssBase = round2(grossMonthly * ssIncomeBase);
  const ssRate = cfg.ssSelfEmployedRate;
  const ssContribution = selfEmployedFirstYear ? 0 : round2(ssBase * ssRate);
  const ssAnnual = round2(ssContribution * 12);

  let vatRate = 0, vatCollected = 0, vatAnnual = 0;
  if (vatRegime === 'normal') {
    vatRate = cfg.vatStandardRate;
    vatCollected = round2(grossMonthly * vatRate);
    vatAnnual = round2(vatCollected * 12);
  }

  let coefficient: number;
  let taxableIncome: number;
  const annualExpenses = round2(monthlyExpenses * 12);

  if (fiscalRegime === 'simplified') {
    coefficient = activityType === 'services' ? cfg.coefficientServices : cfg.coefficientSales;
    taxableIncome = round2(grossAnnual * coefficient);
  } else {
    coefficient = 1;
    taxableIncome = round2(Math.max(0, grossAnnual - annualExpenses));
  }

  const regionalIrs = round2(irsWithholding * cfg.regionalMultiplier[region]);
  const regionalIrsAnnual = round2(regionalIrs * 12);
  const regionalNetMonthly = round2(grossMonthly - regionalIrs - ssContribution);
  const regionalNetAnnual = round2(grossAnnual - regionalIrsAnnual - ssAnnual);

  const equivalentGrossEmployed = findEquivalentEmployedGross(regionalNetAnnual, dependents, maritalStatus, region, cfg);

  return {
    type: 'self_employed',
    grossMonthly,
    irsWithholding: regionalIrs, irsWithholdingRate,
    ssContribution, ssBase, ssRate,
    vatCollected, vatRate,
    netMonthly: regionalNetMonthly, totalNetMonthly: regionalNetMonthly,
    grossAnnual, irsAnnual: regionalIrsAnnual,
    ssAnnual, vatAnnual, taxableIncome, coefficient,
    netAnnual: regionalNetAnnual, totalNetAnnual: regionalNetAnnual,
    monthlyExpenses, annualExpenses, equivalentGrossEmployed,
    effectiveIrsRate: grossAnnual > 0 ? regionalIrsAnnual / grossAnnual : 0,
    effectiveTotalRate: grossAnnual > 0 ? (regionalIrsAnnual + ssAnnual) / grossAnnual : 0,
  };
}

function findEquivalentEmployedGross(
  targetNetAnnual: number, dependents: number,
  maritalStatus: MaritalStatus, region: Region,
  cfg: CalcConfig,
): number {
  let low = 0, high = targetNetAnnual * 2.5;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const ss = mid * cfg.ssEmployeeRate;
    const irs = calculateIrsWithholding(mid, maritalStatus, dependents, region, cfg);
    const annualNet = (mid - ss - irs) * 14;

    if (annualNet < targetNetAnnual) low = mid;
    else high = mid;
  }

  return round2((low + high) / 2);
}

// ---- Comparison ----

function calculateComparison(input: SalaryInput, cfg: CalcConfig): ComparisonResult {
  const employed = calculateEmployed({ ...input, employmentType: 'employed' }, cfg);
  const selfEmployed = calculateSelfEmployed({ ...input, employmentType: 'self_employed' }, cfg);

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

// ---- Main entry point ----

export function calculateSalary(input: SalaryInput, tables?: TaxTables): SalaryResult {
  const cfg = resolveConfig(tables);
  const safeInput = { ...input, grossMonthly: Math.max(0, input.grossMonthly) };
  if (safeInput.employmentType === 'compare') return calculateComparison(safeInput, cfg);
  if (safeInput.employmentType === 'self_employed') return calculateSelfEmployed(safeInput, cfg);
  return calculateEmployed(safeInput, cfg);
}
