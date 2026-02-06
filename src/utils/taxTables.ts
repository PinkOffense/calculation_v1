// Tax Tables Loader — fetches and caches versioned tax configuration
// Falls back to hardcoded defaults if fetch fails

import type { TaxBracket, MaritalStatus, Region } from './types';

// ---- Schema for the JSON file ----
export interface TaxTablesJson {
  version: string;
  year: number;
  publishedAt: string;
  source: string;
  updatedAt: string;
  socialSecurity: {
    employeeRate: number;
    employerRate: number;
    selfEmployedRate: number;
    selfEmployedBaseServices: number;
    selfEmployedBaseSales: number;
  };
  mealAllowance: {
    exemptCash: number;
    exemptCard: number;
    workingDaysPerMonth: number;
    workingMonthsForMeal: number;
  };
  vat: {
    standardRate: number;
    exemptThreshold: number;
  };
  irsRetention: {
    services: number;
    sales: number;
  };
  simplifiedCoefficients: {
    services: number;
    sales: number;
  };
  specificDeductionAnnual: number;
  dependentDeductions: {
    single: number;
    marriedTwoHolders: number;
    marriedSingleHolder: number;
  };
  irsJovemExemption: Record<string, number>;
  regionalMultipliers: Record<string, number>;
  irsBrackets: {
    single: Array<{ upTo: number | null; rate: number; deduction: number }>;
    marriedSingleHolder: Array<{ upTo: number | null; rate: number; deduction: number }>;
    marriedTwoHolders: 'single' | Array<{ upTo: number | null; rate: number; deduction: number }>;
  };
}

// ---- Resolved tables used by the calculator ----
export interface TaxTables {
  version: string;
  year: number;
  source: string;
  updatedAt: string;
  ss: {
    employeeRate: number;
    employerRate: number;
    selfEmployedRate: number;
    selfEmployedBaseServices: number;
    selfEmployedBaseSales: number;
  };
  meal: {
    exemptCash: number;
    exemptCard: number;
    workingDaysPerMonth: number;
    workingMonthsForMeal: number;
  };
  vat: { standardRate: number; exemptThreshold: number };
  irsRetention: { services: number; sales: number };
  coefficients: { services: number; sales: number };
  specificDeductionAnnual: number;
  dependentDeductions: Record<MaritalStatus, number>;
  irsJovemExemption: Record<number, number>;
  regionalMultipliers: Record<Region, number>;
  brackets: Record<MaritalStatus, TaxBracket[]>;
}

const CACHE_KEY = 'tax-tables-cache';
const CACHE_VERSION_KEY = 'tax-tables-version';

function parseBrackets(raw: Array<{ upTo: number | null; rate: number; deduction: number }>): TaxBracket[] {
  return raw.map(b => ({
    upTo: b.upTo ?? Infinity,
    rate: b.rate,
    deduction: b.deduction,
  }));
}

function jsonToTables(json: TaxTablesJson): TaxTables {
  const singleBrackets = parseBrackets(json.irsBrackets.single);
  const marriedSingleBrackets = parseBrackets(json.irsBrackets.marriedSingleHolder);
  const marriedTwoBrackets = json.irsBrackets.marriedTwoHolders === 'single'
    ? singleBrackets
    : parseBrackets(json.irsBrackets.marriedTwoHolders);

  const jovem: Record<number, number> = {};
  for (const [k, v] of Object.entries(json.irsJovemExemption)) {
    jovem[Number(k)] = v;
  }

  return {
    version: json.version,
    year: json.year,
    source: json.source,
    updatedAt: json.updatedAt,
    ss: json.socialSecurity,
    meal: json.mealAllowance,
    vat: json.vat,
    irsRetention: json.irsRetention,
    coefficients: json.simplifiedCoefficients,
    specificDeductionAnnual: json.specificDeductionAnnual,
    dependentDeductions: {
      single: json.dependentDeductions.single,
      married_two_holders: json.dependentDeductions.marriedTwoHolders,
      married_single_holder: json.dependentDeductions.marriedSingleHolder,
    },
    irsJovemExemption: jovem,
    regionalMultipliers: {
      continente: json.regionalMultipliers.continente ?? 1.0,
      acores: json.regionalMultipliers.acores ?? 0.70,
      madeira: json.regionalMultipliers.madeira ?? 0.70,
    },
    brackets: {
      single: singleBrackets,
      married_single_holder: marriedSingleBrackets,
      married_two_holders: marriedTwoBrackets,
    },
  };
}

// ---- Cache ----

function loadFromCache(): TaxTables | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as TaxTables;
  } catch {
    return null;
  }
}

function saveToCache(tables: TaxTables): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tables));
    localStorage.setItem(CACHE_VERSION_KEY, tables.version);
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ---- Fetch ----

export async function fetchTaxTables(baseUrl: string): Promise<TaxTables | null> {
  try {
    const url = `${baseUrl}tax-tables/2026.json`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;

    const json: TaxTablesJson = await res.json();
    const tables = jsonToTables(json);

    // Check if newer than cache
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (tables.version !== cachedVersion) {
      saveToCache(tables);
    }

    return tables;
  } catch {
    return null;
  }
}

export function getCachedTables(): TaxTables | null {
  return loadFromCache();
}

export function getCachedVersion(): string | null {
  try {
    return localStorage.getItem(CACHE_VERSION_KEY);
  } catch {
    return null;
  }
}
