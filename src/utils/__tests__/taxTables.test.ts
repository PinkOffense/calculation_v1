import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the pure conversion logic by importing internals
// fetchTaxTables depends on fetch + localStorage, tested via mocks

describe('taxTables — JSON loading and conversion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('getCachedVersion returns null when no cache', async () => {
    const { getCachedVersion } = await import('../taxTables');
    expect(getCachedVersion()).toBeNull();
  });

  it('getCachedTables returns null when no cache', async () => {
    const { getCachedTables } = await import('../taxTables');
    expect(getCachedTables()).toBeNull();
  });

  it('fetchTaxTables returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { fetchTaxTables } = await import('../taxTables');
    const result = await fetchTaxTables('/');
    expect(result).toBeNull();
  });

  it('fetchTaxTables returns null on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { fetchTaxTables } = await import('../taxTables');
    const result = await fetchTaxTables('/');
    expect(result).toBeNull();
  });

  it('fetchTaxTables parses valid JSON and caches it', async () => {
    const mockJson = {
      version: '2026.1',
      year: 2026,
      publishedAt: '2026-01-06',
      source: 'Test source',
      updatedAt: '2026-01-15',
      socialSecurity: {
        employeeRate: 0.11,
        employerRate: 0.2375,
        selfEmployedRate: 0.214,
        selfEmployedBaseServices: 0.70,
        selfEmployedBaseSales: 0.20,
      },
      mealAllowance: {
        exemptCash: 6.15,
        exemptCard: 10.46,
        workingDaysPerMonth: 22,
        workingMonthsForMeal: 11,
      },
      vat: { standardRate: 0.23, exemptThreshold: 15000 },
      irsRetention: { services: 0.23, sales: 0 },
      simplifiedCoefficients: { services: 0.75, sales: 0.15 },
      specificDeductionAnnual: 4104,
      dependentDeductions: { single: 34.29, marriedTwoHolders: 21.43, marriedSingleHolder: 42.86 },
      irsJovemExemption: { '1': 1.0, '2': 0.75 },
      regionalMultipliers: { continente: 1.0, acores: 0.70, madeira: 0.70 },
      irsBrackets: {
        single: [
          { upTo: 920, rate: 0, deduction: 0 },
          { upTo: null, rate: 0.4717, deduction: 1272.31 },
        ],
        marriedSingleHolder: [
          { upTo: 991, rate: 0, deduction: 0 },
          { upTo: null, rate: 0.4717, deduction: 2821.13 },
        ],
        marriedTwoHolders: 'single',
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJson),
    }));

    const { fetchTaxTables, getCachedVersion } = await import('../taxTables');
    const tables = await fetchTaxTables('/');

    expect(tables).not.toBeNull();
    expect(tables!.version).toBe('2026.1');
    expect(tables!.year).toBe(2026);
    expect(tables!.ss.employeeRate).toBe(0.11);
    expect(tables!.meal.exemptCard).toBe(10.46);
    expect(tables!.vat.standardRate).toBe(0.23);
    expect(tables!.coefficients.services).toBe(0.75);
    expect(tables!.irsJovemExemption[1]).toBe(1.0);
    expect(tables!.irsJovemExemption[2]).toBe(0.75);
    expect(tables!.regionalMultipliers.acores).toBe(0.70);

    // Brackets
    expect(tables!.brackets.single).toHaveLength(2);
    expect(tables!.brackets.single[1].upTo).toBe(Infinity);
    expect(tables!.brackets.married_single_holder).toHaveLength(2);
    // married_two_holders should reference single brackets
    expect(tables!.brackets.married_two_holders).toEqual(tables!.brackets.single);

    // Should be cached
    expect(getCachedVersion()).toBe('2026.1');
  });

  it('dependentDeductions map correctly', async () => {
    const mockJson = {
      version: '2026.1', year: 2026, publishedAt: '', source: '', updatedAt: '',
      socialSecurity: { employeeRate: 0.11, employerRate: 0.2375, selfEmployedRate: 0.214, selfEmployedBaseServices: 0.70, selfEmployedBaseSales: 0.20 },
      mealAllowance: { exemptCash: 6.15, exemptCard: 10.46, workingDaysPerMonth: 22, workingMonthsForMeal: 11 },
      vat: { standardRate: 0.23, exemptThreshold: 15000 },
      irsRetention: { services: 0.23, sales: 0 },
      simplifiedCoefficients: { services: 0.75, sales: 0.15 },
      specificDeductionAnnual: 4104,
      dependentDeductions: { single: 34.29, marriedTwoHolders: 21.43, marriedSingleHolder: 42.86 },
      irsJovemExemption: {},
      regionalMultipliers: {},
      irsBrackets: {
        single: [{ upTo: null, rate: 0, deduction: 0 }],
        marriedSingleHolder: [{ upTo: null, rate: 0, deduction: 0 }],
        marriedTwoHolders: 'single',
      },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJson),
    }));

    const { fetchTaxTables } = await import('../taxTables');
    const tables = await fetchTaxTables('/');

    expect(tables!.dependentDeductions.single).toBe(34.29);
    expect(tables!.dependentDeductions.married_two_holders).toBe(21.43);
    expect(tables!.dependentDeductions.married_single_holder).toBe(42.86);
  });
});
