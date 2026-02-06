// Portuguese Tax Constants & IRS Brackets 2026
// Despacho n.º 233-A/2026, 6 de janeiro
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

import type { MaritalStatus, Region, TaxBracket } from './types';

// ---- Social Security ----
export const SS_EMPLOYEE_RATE = 0.11;
export const SS_EMPLOYER_RATE = 0.2375;
export const SS_SELF_EMPLOYED_RATE = 0.214;
export const SS_SELF_EMPLOYED_BASE_SERVICES = 0.70;
export const SS_SELF_EMPLOYED_BASE_SALES = 0.20;

// ---- Meal allowance (2026) ----
export const MEAL_ALLOWANCE_EXEMPT_CASH = 6.15;
export const MEAL_ALLOWANCE_EXEMPT_CARD = 10.46;
export const WORKING_DAYS_PER_MONTH = 22;
export const WORKING_MONTHS_FOR_MEAL = 11;

// ---- IVA (2026) ----
export const VAT_STANDARD_RATE = 0.23;
export const VAT_EXEMPT_THRESHOLD = 15000;

// ---- IRS Withholding - Self-employed (Art. 101 CIRS) ----
export const IRS_RETENTION_SERVICES = 0.23;
export const IRS_RETENTION_SALES = 0;

// ---- Simplified regime coefficients (Art. 31 CIRS) ----
export const COEFFICIENT_SERVICES = 0.75;
export const COEFFICIENT_SALES = 0.15;

// ---- Specific deduction (employed) ----
export const SPECIFIC_DEDUCTION_ANNUAL = 4104;

// ---- Per-dependent monthly deduction (Despacho 233-A/2026) ----
const DEPENDENT_DEDUCTION_SINGLE = 34.29;
const DEPENDENT_DEDUCTION_MARRIED_TWO = 21.43;
const DEPENDENT_DEDUCTION_MARRIED_SINGLE = 42.86;

export function getDependentDeduction(maritalStatus: MaritalStatus): number {
  switch (maritalStatus) {
    case 'single': return DEPENDENT_DEDUCTION_SINGLE;
    case 'married_two_holders': return DEPENDENT_DEDUCTION_MARRIED_TWO;
    case 'married_single_holder': return DEPENDENT_DEDUCTION_MARRIED_SINGLE;
  }
}

// ---- IRS Jovem (Art. 12-B CIRS, OE 2025 — 10 years, age limit 35) ----
export const IRS_JOVEM_EXEMPTION: Record<number, number> = {
  1: 1.0,
  2: 0.75, 3: 0.75, 4: 0.75,
  5: 0.50, 6: 0.50, 7: 0.50,
  8: 0.25, 9: 0.25, 10: 0.25,
};

// ---- Regional IRS multipliers ----
export const REGIONAL_IRS_MULTIPLIER: Record<Region, number> = {
  continente: 1.0,
  acores: 0.70,
  madeira: 0.70,
};

// ---- IRS Brackets 2026 (Despacho n.º 233-A/2026) ----
// Applied to GROSS monthly salary (not gross-SS)
// Rows 2-3 use variable formulas (pre-computed as effective rate/deduction)

// Tabela I/II — Não casado / Casado dois titulares
export const IRS_BRACKETS_SINGLE: TaxBracket[] = [
  { upTo: 920,      rate: 0,       deduction: 0 },
  { upTo: 1042,     rate: 0.45,    deduction: 414.00 },
  { upTo: 1108,     rate: 0.36895, deduction: 329.47 },
  { upTo: 1154,     rate: 0.157,   deduction: 94.71 },
  { upTo: 1212,     rate: 0.212,   deduction: 158.18 },
  { upTo: 1819,     rate: 0.241,   deduction: 193.33 },
  { upTo: 2119,     rate: 0.311,   deduction: 320.66 },
  { upTo: 2499,     rate: 0.349,   deduction: 401.19 },
  { upTo: 3305,     rate: 0.3836,  deduction: 487.66 },
  { upTo: 5547,     rate: 0.3969,  deduction: 531.62 },
  { upTo: 20221,    rate: 0.4495,  deduction: 823.40 },
  { upTo: Infinity, rate: 0.4717,  deduction: 1272.31 },
];

// Tabela III — Casado, único titular
export const IRS_BRACKETS_MARRIED_SINGLE_HOLDER: TaxBracket[] = [
  { upTo: 991,      rate: 0,       deduction: 0 },
  { upTo: 1042,     rate: 0.45,    deduction: 445.95 },
  { upTo: 1108,     rate: 0.29375, deduction: 283.13 },
  { upTo: 1119,     rate: 0.125,   deduction: 96.17 },
  { upTo: 1432,     rate: 0.1272,  deduction: 98.64 },
  { upTo: 1962,     rate: 0.157,   deduction: 141.32 },
  { upTo: 2240,     rate: 0.1938,  deduction: 213.53 },
  { upTo: 2773,     rate: 0.2277,  deduction: 289.47 },
  { upTo: 3389,     rate: 0.257,   deduction: 370.72 },
  { upTo: 5965,     rate: 0.2881,  deduction: 476.12 },
  { upTo: 20265,    rate: 0.3843,  deduction: 1049.96 },
  { upTo: Infinity, rate: 0.4717,  deduction: 2821.13 },
];

export const IRS_BRACKETS_MARRIED_TWO_HOLDERS: TaxBracket[] = IRS_BRACKETS_SINGLE;

export function getBrackets(maritalStatus: MaritalStatus): TaxBracket[] {
  switch (maritalStatus) {
    case 'single': return IRS_BRACKETS_SINGLE;
    case 'married_single_holder': return IRS_BRACKETS_MARRIED_SINGLE_HOLDER;
    case 'married_two_holders': return IRS_BRACKETS_MARRIED_TWO_HOLDERS;
  }
}

// ---- Aggregate for component consumption ----
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
