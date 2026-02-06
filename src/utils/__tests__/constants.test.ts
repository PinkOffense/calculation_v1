import {
  SS_EMPLOYEE_RATE, SS_EMPLOYER_RATE, SS_SELF_EMPLOYED_RATE,
  SS_SELF_EMPLOYED_BASE_SERVICES, SS_SELF_EMPLOYED_BASE_SALES,
  MEAL_ALLOWANCE_EXEMPT_CASH, MEAL_ALLOWANCE_EXEMPT_CARD,
  VAT_STANDARD_RATE, VAT_EXEMPT_THRESHOLD,
  IRS_RETENTION_SERVICES, IRS_RETENTION_SALES,
  COEFFICIENT_SERVICES, COEFFICIENT_SALES,
  IRS_JOVEM_EXEMPTION, REGIONAL_IRS_MULTIPLIER,
  IRS_BRACKETS_SINGLE, IRS_BRACKETS_MARRIED_SINGLE_HOLDER, IRS_BRACKETS_MARRIED_TWO_HOLDERS,
  getBrackets, getDependentDeduction,
} from '../constants';

// ---- Constant values ----

describe('Social Security constants', () => {
  it('has correct employee rate (11%)', () => {
    expect(SS_EMPLOYEE_RATE).toBe(0.11);
  });

  it('has correct employer rate (23.75%)', () => {
    expect(SS_EMPLOYER_RATE).toBe(0.2375);
  });

  it('has correct self-employed rate (21.4%)', () => {
    expect(SS_SELF_EMPLOYED_RATE).toBe(0.214);
  });

  it('has correct self-employed base for services (70%)', () => {
    expect(SS_SELF_EMPLOYED_BASE_SERVICES).toBe(0.70);
  });

  it('has correct self-employed base for sales (20%)', () => {
    expect(SS_SELF_EMPLOYED_BASE_SALES).toBe(0.20);
  });
});

describe('Meal allowance exempt limits (2026)', () => {
  it('cash exempt limit is €6.15', () => {
    expect(MEAL_ALLOWANCE_EXEMPT_CASH).toBe(6.15);
  });

  it('card exempt limit is €10.46', () => {
    expect(MEAL_ALLOWANCE_EXEMPT_CARD).toBe(10.46);
  });
});

describe('VAT constants', () => {
  it('standard rate is 23%', () => {
    expect(VAT_STANDARD_RATE).toBe(0.23);
  });

  it('Art. 53 exempt threshold is €15,000', () => {
    expect(VAT_EXEMPT_THRESHOLD).toBe(15000);
  });
});

describe('IRS retention at source', () => {
  it('services retention is 23%', () => {
    expect(IRS_RETENTION_SERVICES).toBe(0.23);
  });

  it('sales retention is 0%', () => {
    expect(IRS_RETENTION_SALES).toBe(0);
  });
});

describe('Simplified regime coefficients', () => {
  it('services coefficient is 0.75', () => {
    expect(COEFFICIENT_SERVICES).toBe(0.75);
  });

  it('sales coefficient is 0.15', () => {
    expect(COEFFICIENT_SALES).toBe(0.15);
  });
});

// ---- IRS Jovem ----

describe('IRS Jovem exemption', () => {
  it('year 1 is 100% exempt', () => {
    expect(IRS_JOVEM_EXEMPTION[1]).toBe(1.0);
  });

  it('years 2-4 are 75% exempt', () => {
    expect(IRS_JOVEM_EXEMPTION[2]).toBe(0.75);
    expect(IRS_JOVEM_EXEMPTION[3]).toBe(0.75);
    expect(IRS_JOVEM_EXEMPTION[4]).toBe(0.75);
  });

  it('years 5-7 are 50% exempt', () => {
    expect(IRS_JOVEM_EXEMPTION[5]).toBe(0.50);
    expect(IRS_JOVEM_EXEMPTION[6]).toBe(0.50);
    expect(IRS_JOVEM_EXEMPTION[7]).toBe(0.50);
  });

  it('years 8-10 are 25% exempt', () => {
    expect(IRS_JOVEM_EXEMPTION[8]).toBe(0.25);
    expect(IRS_JOVEM_EXEMPTION[9]).toBe(0.25);
    expect(IRS_JOVEM_EXEMPTION[10]).toBe(0.25);
  });

  it('covers exactly 10 years', () => {
    expect(Object.keys(IRS_JOVEM_EXEMPTION)).toHaveLength(10);
  });
});

// ---- Regional multipliers ----

describe('Regional IRS multipliers', () => {
  it('Continente is 1.0 (no reduction)', () => {
    expect(REGIONAL_IRS_MULTIPLIER.continente).toBe(1.0);
  });

  it('Açores has 30% reduction', () => {
    expect(REGIONAL_IRS_MULTIPLIER.acores).toBe(0.70);
  });

  it('Madeira has 30% reduction', () => {
    expect(REGIONAL_IRS_MULTIPLIER.madeira).toBe(0.70);
  });
});

// ---- IRS Brackets ----

describe('IRS brackets structure', () => {
  it('Tabela I (single) has 12 brackets', () => {
    expect(IRS_BRACKETS_SINGLE).toHaveLength(12);
  });

  it('Tabela III (married single holder) has 12 brackets', () => {
    expect(IRS_BRACKETS_MARRIED_SINGLE_HOLDER).toHaveLength(12);
  });

  it('Tabela II (married two holders) is same as Tabela I', () => {
    expect(IRS_BRACKETS_MARRIED_TWO_HOLDERS).toBe(IRS_BRACKETS_SINGLE);
  });

  it('first bracket rate is 0 (exempt threshold)', () => {
    expect(IRS_BRACKETS_SINGLE[0].rate).toBe(0);
    expect(IRS_BRACKETS_MARRIED_SINGLE_HOLDER[0].rate).toBe(0);
  });

  it('last bracket goes to Infinity', () => {
    const lastSingle = IRS_BRACKETS_SINGLE[IRS_BRACKETS_SINGLE.length - 1];
    const lastMarried = IRS_BRACKETS_MARRIED_SINGLE_HOLDER[IRS_BRACKETS_MARRIED_SINGLE_HOLDER.length - 1];
    expect(lastSingle.upTo).toBe(Infinity);
    expect(lastMarried.upTo).toBe(Infinity);
  });

  it('brackets are in ascending upTo order', () => {
    for (const brackets of [IRS_BRACKETS_SINGLE, IRS_BRACKETS_MARRIED_SINGLE_HOLDER]) {
      for (let i = 1; i < brackets.length; i++) {
        expect(brackets[i].upTo).toBeGreaterThan(brackets[i - 1].upTo);
      }
    }
  });

  it('single table exempt threshold is €920', () => {
    expect(IRS_BRACKETS_SINGLE[0].upTo).toBe(920);
  });

  it('married single holder exempt threshold is €991', () => {
    expect(IRS_BRACKETS_MARRIED_SINGLE_HOLDER[0].upTo).toBe(991);
  });
});

// ---- Helper functions ----

describe('getBrackets', () => {
  it('returns single brackets for "single"', () => {
    expect(getBrackets('single')).toBe(IRS_BRACKETS_SINGLE);
  });

  it('returns married two holders brackets (same as single)', () => {
    expect(getBrackets('married_two_holders')).toBe(IRS_BRACKETS_SINGLE);
  });

  it('returns married single holder brackets for "married_single_holder"', () => {
    expect(getBrackets('married_single_holder')).toBe(IRS_BRACKETS_MARRIED_SINGLE_HOLDER);
  });
});

describe('getDependentDeduction', () => {
  it('single: €34.29 per dependent', () => {
    expect(getDependentDeduction('single')).toBe(34.29);
  });

  it('married two holders: €21.43 per dependent', () => {
    expect(getDependentDeduction('married_two_holders')).toBe(21.43);
  });

  it('married single holder: €42.86 per dependent', () => {
    expect(getDependentDeduction('married_single_holder')).toBe(42.86);
  });
});
