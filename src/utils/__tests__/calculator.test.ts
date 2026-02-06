import { calculateSalary } from '../calculator';
import { createInput } from '../../test/fixtures';
import type { EmployedResult, SelfEmployedResult, ComparisonResult } from '../types';

// Helper to round for comparison
const r2 = (v: number) => Math.round(v * 100) / 100;

// ============================================================
// EMPLOYED CALCULATIONS
// ============================================================

describe('calculateSalary — employed', () => {
  describe('basic employed calculation (€1500 single, no dependents)', () => {
    const input = createInput({ grossMonthly: 1500 });
    const result = calculateSalary(input) as EmployedResult;

    it('returns employed type', () => {
      expect(result.type).toBe('employed');
    });

    it('calculates SS at 11%', () => {
      expect(result.ssRate).toBe(0.11);
      expect(result.ssEmployee).toBe(r2(1500 * 0.11));
    });

    it('has positive IRS withholding', () => {
      expect(result.irsWithholding).toBeGreaterThan(0);
    });

    it('net monthly is gross - SS - IRS', () => {
      expect(result.netMonthly).toBe(
        r2(1500 - result.ssEmployee - result.irsWithholding)
      );
    });

    it('has no IRS Jovem discount by default', () => {
      expect(result.irsJovemDiscount).toBe(0);
    });

    it('calculates 14 months annual', () => {
      expect(result.grossAnnual).toBe(r2(1500 * 14));
    });

    it('employer cost includes SS patronal', () => {
      expect(result.ssEmployer).toBe(r2(1500 * 0.2375));
    });
  });

  describe('zero gross edge case', () => {
    const input = createInput({ grossMonthly: 0 });
    const result = calculateSalary(input) as EmployedResult;

    it('returns zero for all values', () => {
      expect(result.ssEmployee).toBe(0);
      expect(result.irsWithholding).toBe(0);
      expect(result.netMonthly).toBe(0);
      expect(result.grossAnnual).toBe(0);
    });
  });

  describe('exempt IRS threshold (€920 single)', () => {
    const input = createInput({ grossMonthly: 900 });
    const result = calculateSalary(input) as EmployedResult;

    it('has zero IRS below €920 threshold', () => {
      expect(result.irsWithholding).toBe(0);
    });

    it('still deducts SS', () => {
      expect(result.ssEmployee).toBe(r2(900 * 0.11));
    });
  });

  describe('meal allowance — card within exempt limit', () => {
    const input = createInput({ mealAllowancePerDay: 7.63, mealAllowanceType: 'card' });
    const result = calculateSalary(input) as EmployedResult;

    it('full meal is exempt (within €10.46 card limit)', () => {
      expect(result.mealTaxableMonthly).toBe(0);
      expect(result.mealExemptMonthly).toBe(r2(7.63 * 22));
      expect(result.mealAllowanceMonthly).toBe(r2(7.63 * 22));
    });

    it('total net includes exempt meal', () => {
      expect(result.totalNetMonthly).toBe(r2(result.netMonthly + result.mealExemptMonthly));
    });
  });

  describe('meal allowance — card above exempt limit', () => {
    const input = createInput({ mealAllowancePerDay: 15, mealAllowanceType: 'card' });
    const result = calculateSalary(input) as EmployedResult;

    it('splits meal into exempt and taxable portions', () => {
      expect(result.mealExemptMonthly).toBe(r2(10.46 * 22));
      expect(result.mealTaxableMonthly).toBe(r2((15 - 10.46) * 22));
      expect(result.mealAllowanceMonthly).toBe(r2(15 * 22));
    });

    it('taxable meal excess increases SS base', () => {
      // SS is on grossMonthly + mealTaxableMonthly
      const expectedTaxableGross = r2(1500 + result.mealTaxableMonthly);
      expect(result.ssEmployee).toBe(r2(expectedTaxableGross * 0.11));
    });
  });

  describe('meal allowance — cash exempt limit', () => {
    const input = createInput({ mealAllowancePerDay: 7, mealAllowanceType: 'cash' });
    const result = calculateSalary(input) as EmployedResult;

    it('cash excess above €6.15 is taxable', () => {
      expect(result.mealExemptMonthly).toBe(r2(6.15 * 22));
      expect(result.mealTaxableMonthly).toBe(r2((7 - 6.15) * 22));
    });
  });

  describe('meal allowance — zero', () => {
    const input = createInput({ mealAllowancePerDay: 0 });
    const result = calculateSalary(input) as EmployedResult;

    it('all meal values are zero', () => {
      expect(result.mealAllowanceMonthly).toBe(0);
      expect(result.mealExemptMonthly).toBe(0);
      expect(result.mealTaxableMonthly).toBe(0);
    });
  });

  describe('meal allowance — annual uses 11 working months', () => {
    const input = createInput({ mealAllowancePerDay: 7.63, mealAllowanceType: 'card' });
    const result = calculateSalary(input) as EmployedResult;

    it('annual meal is 11x monthly', () => {
      expect(result.mealAllowanceAnnual).toBe(r2(result.mealAllowanceMonthly * 11));
    });
  });

  describe('12-month salary (duodécimos)', () => {
    const input = createInput({ numberOfMonths: 12 });
    const result = calculateSalary(input) as EmployedResult;

    it('annual gross uses 12 months', () => {
      expect(result.grossAnnual).toBe(r2(1500 * 12));
    });

    it('annual SS uses 12 months', () => {
      expect(result.ssAnnualEmployee).toBe(r2(result.ssEmployee * 12));
    });
  });

  describe('dependents reduce IRS', () => {
    const noDeps = calculateSalary(createInput({ grossMonthly: 2000 })) as EmployedResult;
    const twoDeps = calculateSalary(createInput({ grossMonthly: 2000, dependents: 2 })) as EmployedResult;

    it('2 dependents result in less IRS than 0', () => {
      expect(twoDeps.irsWithholding).toBeLessThan(noDeps.irsWithholding);
    });

    it('deduction is 2 × €34.29 for single', () => {
      const diff = r2(noDeps.irsWithholding - twoDeps.irsWithholding);
      expect(diff).toBe(r2(2 * 34.29));
    });
  });

  describe('married single holder has lower IRS', () => {
    const single = calculateSalary(createInput({ grossMonthly: 2000 })) as EmployedResult;
    const married = calculateSalary(
      createInput({ grossMonthly: 2000, maritalStatus: 'married_single_holder' })
    ) as EmployedResult;

    it('married single holder pays less IRS than single', () => {
      expect(married.irsWithholding).toBeLessThan(single.irsWithholding);
    });
  });

  describe('IRS Jovem', () => {
    const base = createInput({ grossMonthly: 2000 });

    it('year 1 gives 100% IRS exemption', () => {
      const result = calculateSalary({
        ...base, irsJovem: true, irsJovemYear: 1,
      }) as EmployedResult;
      expect(result.irsWithholding).toBe(0);
      expect(result.irsJovemDiscount).toBeGreaterThan(0);
    });

    it('year 5 gives 50% IRS reduction', () => {
      const noJovem = calculateSalary(base) as EmployedResult;
      const jovem5 = calculateSalary({
        ...base, irsJovem: true, irsJovemYear: 5,
      }) as EmployedResult;
      expect(jovem5.irsWithholding).toBeCloseTo(noJovem.irsWithholding * 0.5, 1);
    });

    it('year 10 gives 25% IRS reduction', () => {
      const noJovem = calculateSalary(base) as EmployedResult;
      const jovem10 = calculateSalary({
        ...base, irsJovem: true, irsJovemYear: 10,
      }) as EmployedResult;
      expect(jovem10.irsWithholding).toBeCloseTo(noJovem.irsWithholding * 0.75, 1);
    });
  });

  describe('regional IRS — Açores/Madeira 30% reduction', () => {
    const continente = calculateSalary(createInput({ grossMonthly: 2000 })) as EmployedResult;
    const acores = calculateSalary(createInput({ grossMonthly: 2000, region: 'acores' })) as EmployedResult;
    const madeira = calculateSalary(createInput({ grossMonthly: 2000, region: 'madeira' })) as EmployedResult;

    it('Açores IRS is 70% of Continente', () => {
      expect(acores.irsWithholding).toBeCloseTo(continente.irsWithholding * 0.7, 1);
    });

    it('Madeira IRS is 70% of Continente', () => {
      expect(madeira.irsWithholding).toBeCloseTo(continente.irsWithholding * 0.7, 1);
    });

    it('SS is same regardless of region', () => {
      expect(acores.ssEmployee).toBe(continente.ssEmployee);
    });
  });

  describe('other taxable income (supplements)', () => {
    const base = calculateSalary(createInput({ grossMonthly: 1500 })) as EmployedResult;
    const withSupps = calculateSalary(
      createInput({ grossMonthly: 1500, otherTaxableIncome: 300 })
    ) as EmployedResult;

    it('total gross includes supplements', () => {
      expect(withSupps.totalGrossMonthly).toBe(r2(1500 + 300));
    });

    it('supplements increase SS', () => {
      expect(withSupps.ssEmployee).toBeGreaterThan(base.ssEmployee);
    });

    it('supplements increase IRS', () => {
      expect(withSupps.irsWithholding).toBeGreaterThan(base.irsWithholding);
    });

    it('annual gross includes 12 months of supplements + 14 months base', () => {
      expect(withSupps.grossAnnual).toBe(r2(1500 * 14 + 300 * 12));
    });
  });

  describe('effective rates are correct', () => {
    const result = calculateSalary(createInput({ grossMonthly: 3000 })) as EmployedResult;

    it('effective IRS rate is IRS/gross', () => {
      expect(result.effectiveIrsRate).toBeCloseTo(result.irsAnnual / result.grossAnnual, 4);
    });

    it('effective total rate is (IRS+SS)/gross', () => {
      expect(result.effectiveTotalRate).toBeCloseTo(
        (result.irsAnnual + result.ssAnnualEmployee) / result.grossAnnual, 4
      );
    });

    it('rates are between 0 and 1', () => {
      expect(result.effectiveIrsRate).toBeGreaterThanOrEqual(0);
      expect(result.effectiveIrsRate).toBeLessThan(1);
      expect(result.effectiveTotalRate).toBeGreaterThan(0);
      expect(result.effectiveTotalRate).toBeLessThan(1);
    });
  });

  describe('high salary bracket test (€5,000)', () => {
    const result = calculateSalary(createInput({ grossMonthly: 5000 })) as EmployedResult;

    it('IRS is significant at high salary', () => {
      expect(result.irsWithholding).toBeGreaterThan(500);
    });

    it('effective IRS rate is above 25%', () => {
      expect(result.effectiveIrsRate).toBeGreaterThan(0.25);
    });
  });

  describe('very high salary (€25,000 — top bracket)', () => {
    const result = calculateSalary(createInput({ grossMonthly: 25000, mealAllowancePerDay: 0 })) as EmployedResult;

    it('uses the top IRS bracket', () => {
      // Top bracket: rate 0.4717, deduction 1272.31
      const expectedIrs = r2(25000 * 0.4717 - 1272.31);
      expect(result.irsWithholding).toBe(expectedIrs);
    });

    it('SS is 11% of gross', () => {
      expect(result.ssEmployee).toBe(r2(25000 * 0.11));
    });

    it('net is positive and less than gross', () => {
      expect(result.netMonthly).toBeGreaterThan(0);
      expect(result.netMonthly).toBeLessThan(25000);
    });

    it('effective total rate is between 40% and 60%', () => {
      expect(result.effectiveTotalRate).toBeGreaterThan(0.4);
      expect(result.effectiveTotalRate).toBeLessThan(0.6);
    });

    it('employer cost includes full annual gross + SS', () => {
      expect(result.totalEmployerCostAnnual).toBe(
        r2(result.grossAnnual + result.ssEmployerAnnual)
      );
    });
  });

  describe('negative gross is clamped to zero', () => {
    const result = calculateSalary(createInput({ grossMonthly: -500, mealAllowancePerDay: 0 })) as EmployedResult;

    it('treats negative gross as zero', () => {
      expect(result.grossMonthly).toBe(0);
      expect(result.ssEmployee).toBe(0);
      expect(result.irsWithholding).toBe(0);
      expect(result.netMonthly).toBe(0);
    });
  });

  describe('employer cost includes full meal allowance', () => {
    const result = calculateSalary(createInput({
      grossMonthly: 2000,
      mealAllowancePerDay: 10,
      mealAllowanceType: 'card',
    })) as EmployedResult;

    it('total employer cost includes exempt + taxable meal + SS', () => {
      expect(result.totalEmployerCostAnnual).toBe(
        r2(result.grossAnnual + result.mealAllowanceAnnual + result.ssEmployerAnnual)
      );
    });

    it('meal allowance annual is 11 months', () => {
      expect(result.mealAllowanceAnnual).toBe(r2(10 * 22 * 11));
    });
  });
});

// ============================================================
// SELF-EMPLOYED CALCULATIONS
// ============================================================

describe('calculateSalary — self-employed', () => {
  describe('basic self-employed (€3000 services, simplified)', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      activityType: 'services',
      fiscalRegime: 'simplified',
      vatRegime: 'exempt_art53',
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('returns self_employed type', () => {
      expect(result.type).toBe('self_employed');
    });

    it('applies 23% IRS retention for services', () => {
      expect(result.irsWithholdingRate).toBe(0.23);
    });

    it('calculates SS on 70% of income', () => {
      expect(result.ssBase).toBe(r2(3000 * 0.70));
      expect(result.ssContribution).toBe(r2(result.ssBase * 0.214));
    });

    it('gross annual is 12x monthly', () => {
      expect(result.grossAnnual).toBe(r2(3000 * 12));
    });

    it('taxable income uses coefficient 0.75', () => {
      expect(result.coefficient).toBe(0.75);
      expect(result.taxableIncome).toBe(r2(3000 * 12 * 0.75));
    });

    it('no VAT when exempt', () => {
      expect(result.vatCollected).toBe(0);
      expect(result.vatRate).toBe(0);
    });

    it('net = gross - IRS - SS', () => {
      expect(result.netMonthly).toBe(
        r2(3000 - result.irsWithholding - result.ssContribution)
      );
    });

    it('has positive equivalent employed gross', () => {
      expect(result.equivalentGrossEmployed).toBeGreaterThan(0);
    });
  });

  describe('sales activity type', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      activityType: 'sales',
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('no IRS retention for sales', () => {
      expect(result.irsWithholdingRate).toBe(0);
      expect(result.irsWithholding).toBe(0);
    });

    it('SS base is 20% for sales', () => {
      expect(result.ssBase).toBe(r2(3000 * 0.20));
    });

    it('coefficient is 0.15 for sales', () => {
      expect(result.coefficient).toBe(0.15);
    });
  });

  describe('organized accounting regime', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 5000,
      fiscalRegime: 'organized',
      monthlyExpenses: 1500,
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('coefficient is 1 (no simplification)', () => {
      expect(result.coefficient).toBe(1);
    });

    it('taxable income = gross - expenses', () => {
      expect(result.taxableIncome).toBe(r2(5000 * 12 - 1500 * 12));
    });

    it('tracks annual expenses', () => {
      expect(result.annualExpenses).toBe(r2(1500 * 12));
    });
  });

  describe('VAT normal regime', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      vatRegime: 'normal',
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('applies 23% VAT', () => {
      expect(result.vatRate).toBe(0.23);
      expect(result.vatCollected).toBe(r2(3000 * 0.23));
    });

    it('VAT annual is 12x monthly', () => {
      expect(result.vatAnnual).toBe(r2(result.vatCollected * 12));
    });
  });

  describe('first year SS exemption', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      selfEmployedFirstYear: true,
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('SS contribution is 0 in first year', () => {
      expect(result.ssContribution).toBe(0);
      expect(result.ssAnnual).toBe(0);
    });

    it('net is higher without SS', () => {
      const normal = calculateSalary(
        createInput({ employmentType: 'self_employed', grossMonthly: 3000 })
      ) as SelfEmployedResult;
      expect(result.netMonthly).toBeGreaterThan(normal.netMonthly);
    });
  });

  describe('exempt from IRS retention at source', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 3000,
      selfEmployedExemptRetention: true,
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('IRS withholding is 0 when exempt', () => {
      expect(result.irsWithholding).toBe(0);
      expect(result.irsWithholdingRate).toBe(0);
    });
  });

  describe('regional IRS for self-employed', () => {
    const continente = calculateSalary(
      createInput({ employmentType: 'self_employed', grossMonthly: 3000 })
    ) as SelfEmployedResult;
    const acores = calculateSalary(
      createInput({ employmentType: 'self_employed', grossMonthly: 3000, region: 'acores' })
    ) as SelfEmployedResult;

    it('Açores IRS is 70% of Continente', () => {
      expect(acores.irsWithholding).toBeCloseTo(continente.irsWithholding * 0.7, 0);
    });

    it('SS is same regardless of region', () => {
      expect(acores.ssContribution).toBe(continente.ssContribution);
    });
  });

  describe('zero gross self-employed', () => {
    const input = createInput({ employmentType: 'self_employed', grossMonthly: 0 });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('all values are zero', () => {
      expect(result.irsWithholding).toBe(0);
      expect(result.ssContribution).toBe(0);
      expect(result.netMonthly).toBe(0);
    });

    it('equivalent employed gross is zero', () => {
      expect(result.equivalentGrossEmployed).toBe(0);
    });

    it('effective rates are zero', () => {
      expect(result.effectiveIrsRate).toBe(0);
      expect(result.effectiveTotalRate).toBe(0);
    });
  });

  describe('very high salary self-employed (€25,000 services)', () => {
    const input = createInput({
      employmentType: 'self_employed',
      grossMonthly: 25000,
      activityType: 'services',
    });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('net is positive and less than gross', () => {
      expect(result.netMonthly).toBeGreaterThan(0);
      expect(result.netMonthly).toBeLessThan(25000);
    });

    it('IRS withholding is 23% of gross', () => {
      expect(result.irsWithholding).toBeCloseTo(25000 * 0.23, 0);
    });

    it('SS is on 70% base', () => {
      expect(result.ssBase).toBe(r2(25000 * 0.70));
      expect(result.ssContribution).toBe(r2(result.ssBase * 0.214));
    });

    it('equivalent employed gross is positive and reasonable', () => {
      expect(result.equivalentGrossEmployed).toBeGreaterThan(0);
      // Equivalent should be higher than self-employed gross (higher tax burden as employed)
      expect(result.equivalentGrossEmployed).toBeGreaterThan(result.grossMonthly);
    });
  });

  describe('negative gross self-employed is clamped to zero', () => {
    const input = createInput({ employmentType: 'self_employed', grossMonthly: -1000 });
    const result = calculateSalary(input) as SelfEmployedResult;

    it('treats negative gross as zero', () => {
      expect(result.grossMonthly).toBe(0);
      expect(result.netMonthly).toBe(0);
    });
  });
});

// ============================================================
// COMPARISON MODE
// ============================================================

describe('calculateSalary — comparison', () => {
  const input = createInput({ employmentType: 'compare', grossMonthly: 2000 });
  const result = calculateSalary(input) as ComparisonResult;

  it('returns comparison type', () => {
    expect(result.type).toBe('comparison');
  });

  it('contains both employed and self-employed results', () => {
    expect(result.employed.type).toBe('employed');
    expect(result.selfEmployed.type).toBe('self_employed');
  });

  it('both use same gross monthly', () => {
    expect(result.employed.grossMonthly).toBe(2000);
    expect(result.selfEmployed.grossMonthly).toBe(2000);
  });

  it('monthly difference is employed - selfEmployed', () => {
    expect(result.difference.monthlyNet).toBeCloseTo(
      result.employed.totalNetMonthly - result.selfEmployed.totalNetMonthly, 1
    );
  });

  it('annual difference is employed - selfEmployed', () => {
    expect(result.difference.annualNet).toBeCloseTo(
      result.employed.totalNetAnnual - result.selfEmployed.totalNetAnnual, 1
    );
  });

  it('betterOption reflects annual net difference', () => {
    const diff = result.difference.annualNet;
    if (diff > 10) {
      expect(result.difference.betterOption).toBe('employed');
    } else if (diff < -10) {
      expect(result.difference.betterOption).toBe('self_employed');
    } else {
      expect(result.difference.betterOption).toBe('equal');
    }
  });

  it('equal when difference is within €10 threshold', () => {
    // Very low salary where both are essentially the same
    const lowInput = createInput({
      employmentType: 'compare',
      grossMonthly: 800,
      mealAllowancePerDay: 0,
    });
    const lowResult = calculateSalary(lowInput) as ComparisonResult;
    // We can't guarantee 'equal' but the logic should be consistent
    const diff = lowResult.difference.annualNet;
    if (Math.abs(diff) <= 10) {
      expect(lowResult.difference.betterOption).toBe('equal');
    }
  });
});

// ============================================================
// ROUTING LOGIC
// ============================================================

describe('calculateSalary — routing', () => {
  it('routes to employed calculator', () => {
    const result = calculateSalary(createInput({ employmentType: 'employed' }));
    expect(result.type).toBe('employed');
  });

  it('routes to self-employed calculator', () => {
    const result = calculateSalary(createInput({ employmentType: 'self_employed' }));
    expect(result.type).toBe('self_employed');
  });

  it('routes to comparison calculator', () => {
    const result = calculateSalary(createInput({ employmentType: 'compare' }));
    expect(result.type).toBe('comparison');
  });
});

// ============================================================
// CROSS-CUTTING CONCERNS & INVARIANTS
// ============================================================

describe('calculation invariants', () => {
  const salaries = [0, 500, 820, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000];

  it.each(salaries)('employed: net ≤ gross for €%d', (salary) => {
    const result = calculateSalary(createInput({ grossMonthly: salary })) as EmployedResult;
    expect(result.netMonthly).toBeLessThanOrEqual(result.totalGrossMonthly);
  });

  it.each(salaries)('employed: all monetary values ≥ 0 for €%d', (salary) => {
    const result = calculateSalary(createInput({ grossMonthly: salary })) as EmployedResult;
    expect(result.ssEmployee).toBeGreaterThanOrEqual(0);
    expect(result.irsWithholding).toBeGreaterThanOrEqual(0);
    expect(result.netMonthly).toBeGreaterThanOrEqual(0);
    expect(result.grossAnnual).toBeGreaterThanOrEqual(0);
  });

  it.each(salaries)('self-employed: net ≤ gross for €%d', (salary) => {
    const result = calculateSalary(
      createInput({ employmentType: 'self_employed', grossMonthly: salary })
    ) as SelfEmployedResult;
    expect(result.netMonthly).toBeLessThanOrEqual(result.grossMonthly);
  });

  it.each(salaries)('self-employed: all monetary values ≥ 0 for €%d', (salary) => {
    const result = calculateSalary(
      createInput({ employmentType: 'self_employed', grossMonthly: salary })
    ) as SelfEmployedResult;
    expect(result.ssContribution).toBeGreaterThanOrEqual(0);
    expect(result.irsWithholding).toBeGreaterThanOrEqual(0);
    expect(result.netMonthly).toBeGreaterThanOrEqual(0);
  });

  it('higher salary → higher IRS (monotonicity)', () => {
    const low = calculateSalary(createInput({ grossMonthly: 1500 })) as EmployedResult;
    const high = calculateSalary(createInput({ grossMonthly: 3000 })) as EmployedResult;
    expect(high.irsWithholding).toBeGreaterThan(low.irsWithholding);
    expect(high.effectiveIrsRate).toBeGreaterThan(low.effectiveIrsRate);
  });

  it('higher salary → higher net (net increases with gross)', () => {
    let prevNet = -1;
    for (const salary of [0, 1000, 1500, 2000, 3000, 5000, 10000, 15000, 20000, 25000]) {
      const result = calculateSalary(createInput({ grossMonthly: salary })) as EmployedResult;
      expect(result.netMonthly).toBeGreaterThan(prevNet);
      prevNet = result.netMonthly;
    }
  });
});
