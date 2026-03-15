/**
 * Unit tests for the Tax & Net Income Calculator Engine (US-9.4)
 *
 * Run with: npm run test:simulator
 *
 * Reference values cross-checked against CRA PDOC outputs where noted.
 * Tolerance of $1 is used for bracket calculations (rounding differences).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateNetIncome }   from '../../src/lib/simulator/engines/taxEngine';
import { calculateCPP, calculateQPP } from '../../src/lib/simulator/engines/cppCalculator';
import { calculateEI }          from '../../src/lib/simulator/engines/eiCalculator';
import { applyBrackets }        from '../../src/lib/simulator/engines/bracketCalculator';
import type { TaxBracketsData, PayrollParamsData } from '../../src/lib/simulator/engines/taxTypes';

// ── Load real data ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const taxBracketsRaw  = require('../../src/data/simulator/tax_brackets.json') as { federal: unknown; provinces: unknown };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const payrollRaw      = require('../../src/data/simulator/payroll_params.json') as { data: PayrollParamsData };

const taxData: TaxBracketsData   = taxBracketsRaw as TaxBracketsData;
const params:  PayrollParamsData = payrollRaw.data;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calc(income: number, province: string) {
  return calculateNetIncome(income, province, taxData, params);
}

/** Assert two numbers are within `tol` of each other. */
function assertClose(actual: number, expected: number, tol: number, label: string) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${label}: expected ${expected} ± ${tol}, got ${actual} (diff ${diff.toFixed(2)})`);
}

// ── TC-1: Federal tax, $80K Ontario ──────────────────────────────────────────
// Manual:
//   Brackets: 58523×0.15 + 21477×0.205 = 8778.45 + 4402.785 = 13181.235
//   BPA credit: 16129 × 0.15 = 2419.35
//   Federal tax = 13181.235 − 2419.35 = 10761.885 ≈ 10761.89

describe('TC-1: federal tax — $80k Ontario', () => {
  it('federal tax matches manual bracket calculation within $1', () => {
    const result = calc(80_000, 'ON');
    assertClose(result.federal_tax, 10_761.89, 1, 'federal_tax');
  });

  it('federal_tax is positive', () => {
    const result = calc(80_000, 'ON');
    assert.ok(result.federal_tax > 0);
  });
});

// ── TC-2: Ontario provincial tax, $80K ───────────────────────────────────────
// Manual:
//   Brackets: 52886×0.0505 + 27114×0.0915 = 2670.743 + 2480.931 = 5151.674
//   BPA credit: 11865 × 0.0505 = 599.1825
//   Provincial tax = 5151.674 − 599.1825 = 4552.4915 ≈ 4552.49

describe('TC-2: Ontario provincial tax — $80k', () => {
  it('provincial tax matches manual bracket calculation within $1', () => {
    const result = calc(80_000, 'ON');
    assertClose(result.provincial_tax, 4_552.49, 1, 'provincial_tax');
  });
});

// ── TC-3: CPP contributions ───────────────────────────────────────────────────
// CPP1: (min(80000,73200)−3500) × 0.0595 = 69700×0.0595 = 4147.15 (at cap)
// CPP2: (min(80000,81900)−73200) × 0.04 = 6800×0.04 = 272.00
// Total: 4419.15

describe('TC-3: CPP contributions — $80k income', () => {
  it('CPP1 is capped at max_employee_contribution', () => {
    const { cpp1 } = calculateCPP(80_000, params);
    assert.equal(cpp1, params.cpp.max_employee_contribution); // 4147.15
  });

  it('CPP2 = 6800 × 0.04 = 272.00 for $80k income', () => {
    const { cpp2 } = calculateCPP(80_000, params);
    assert.equal(cpp2, 272.00);
  });

  it('total CPP = cpp1 + cpp2', () => {
    const { cpp1, cpp2, total } = calculateCPP(80_000, params);
    assertClose(total, cpp1 + cpp2, 0.01, 'cpp total');
  });

  it('cpp_contribution in net-income result matches manual calculation', () => {
    const result = calc(80_000, 'ON');
    assertClose(result.cpp_contribution, 4_419.15, 0.01, 'cpp_contribution');
  });

  it('CPP is zero for zero income', () => {
    const { total } = calculateCPP(0, params);
    assert.equal(total, 0);
  });

  it('CPP1 is zero when income ≤ basic_exemption', () => {
    const { cpp1 } = calculateCPP(3_500, params);
    assert.equal(cpp1, 0);
  });

  it('CPP2 is zero when income ≤ YMPE', () => {
    const { cpp2 } = calculateCPP(73_200, params);
    assert.equal(cpp2, 0);
  });
});

// ── TC-4: EI premiums ─────────────────────────────────────────────────────────
// min(80000, 65700) × 0.0164 = 65700×0.0164 = 1077.48 (exactly at cap)

describe('TC-4: EI premiums — $80k income', () => {
  it('EI premium is capped at max_employee_premium for $80k', () => {
    const { premium } = calculateEI(80_000, 'ON', params);
    assert.equal(premium, params.ei.max_employee_premium); // 1077.48
  });

  it('ei_premium in net-income result equals max premium', () => {
    const result = calc(80_000, 'ON');
    assert.equal(result.ei_premium, params.ei.max_employee_premium);
  });

  it('EI premium is zero for zero income', () => {
    const { premium } = calculateEI(0, 'ON', params);
    assert.equal(premium, 0);
  });

  it('EI premium scales linearly below MIE', () => {
    const { premium } = calculateEI(30_000, 'ON', params);
    assertClose(premium, 30_000 * params.ei.employee_rate, 0.01, 'EI below MIE');
  });
});

// ── TC-5: Zero income — all values zero, no negatives ────────────────────────

describe('TC-5: zero income', () => {
  it('all deduction components are zero', () => {
    const result = calc(0, 'ON');
    assert.equal(result.federal_tax,      0);
    assert.equal(result.provincial_tax,   0);
    assert.equal(result.cpp_contribution, 0);
    assert.equal(result.ei_premium,       0);
    assert.equal(result.total_deductions, 0);
  });

  it('annual_net_income is zero (not negative)', () => {
    const result = calc(0, 'ON');
    assert.equal(result.annual_net_income, 0);
  });

  it('monthly_take_home is zero', () => {
    const result = calc(0, 'ON');
    assert.equal(result.monthly_take_home, 0);
  });
});

// ── TC-6: Top federal bracket — $400K income ─────────────────────────────────
// $400K is above the $258,482 threshold → top 33% bracket applies

describe('TC-6: top federal bracket — $400k income', () => {
  it('applies the 33% top bracket to income above $258,482', () => {
    const result = calc(400_000, 'ON');
    // Sanity check: income at this level pushes into the top federal bracket
    // The effective federal tax rate should exceed 25%
    const effectiveRate = result.federal_tax / 400_000;
    assert.ok(effectiveRate > 0.25, `effective federal rate ${effectiveRate.toFixed(4)} < 25%`);
  });

  it('directly: applyBrackets at $400k hits the top bracket (rate 0.33)', () => {
    const topBracketMin = 258_482;
    const topBracketAmount = (400_000 - topBracketMin) * 0.33;
    const tax = applyBrackets(400_000, taxData.federal);
    // Tax should include some amount taxed at 33%
    assert.ok(tax > topBracketMin * 0.15, 'top bracket contribution must be substantial');
    assertClose(
      tax,
      // recompute manually
      58523 * 0.15 +
      (117045 - 58523) * 0.205 +
      (181440 - 117045) * 0.26 +
      (258482 - 181440) * 0.29 +
      topBracketAmount,
      1,
      'applyBrackets at 400k',
    );
  });
});

// ── TC-7: Quebec special case ─────────────────────────────────────────────────

describe('TC-7: Quebec — $80k income', () => {
  it('quebec_special_case is true', () => {
    const result = calc(80_000, 'QC');
    assert.equal(result.quebec_special_case, true);
  });

  it('assumptions include quebec_qpp_qpip_applied', () => {
    const result = calc(80_000, 'QC');
    assert.ok(result.assumptions.includes('quebec_qpp_qpip_applied'));
  });

  it('EI premium for Quebec includes QPIP', () => {
    const { premium, qpip } = calculateEI(80_000, 'QC', params);
    assert.ok(qpip > 0, 'qpip should be positive for Quebec');
    assert.ok(premium > qpip, 'total premium should exceed QPIP alone');
  });

  it('Quebec federal tax is reduced by the 16.5% abatement', () => {
    const qcResult = calc(80_000, 'QC');
    const onResult = calc(80_000, 'ON');
    // QC federal tax should be lower due to 16.5% abatement
    assert.ok(qcResult.federal_tax < onResult.federal_tax, 'QC federal tax should be lower');
  });

  it('QPP is used instead of CPP for Quebec', () => {
    const qppResult = calculateQPP(80_000, params);
    const cppResult = calculateCPP(80_000, params);
    // QPP rate (6.4%) > CPP rate (5.95%), so QPP1 should be higher
    assert.ok(qppResult.cpp1 > cppResult.cpp1, 'QPP1 should exceed CPP1');
  });
});

// ── TC-8: monthly_take_home = annual_net_income / 12 (rounded) ───────────────

describe('TC-8: monthly_take_home calculation', () => {
  it('monthly_take_home equals round(annual_net_income / 12)', () => {
    const result = calc(80_000, 'ON');
    assert.equal(result.monthly_take_home, Math.round(result.annual_net_income / 12));
  });

  it('monthly_take_home is an integer', () => {
    const result = calc(75_000, 'BC');
    assert.equal(result.monthly_take_home, Math.floor(result.monthly_take_home));
  });
});

// ── TC-9: 10 fixed income vectors across 5 provinces ─────────────────────────
// Invariant checks that apply to any valid (income, province) pair.

describe('TC-9: invariants across 10 income/province vectors', () => {
  const vectors: Array<[number, string]> = [
    [ 20_000, 'ON'],
    [ 40_000, 'ON'],
    [ 60_000, 'BC'],
    [ 80_000, 'ON'],
    [100_000, 'AB'],
    [120_000, 'QC'],
    [150_000, 'ON'],
    [200_000, 'BC'],
    [250_000, 'AB'],
    [300_000, 'ON'],
  ];

  for (const [income, province] of vectors) {
    it(`$${income.toLocaleString()} in ${province} — invariants hold`, () => {
      const r = calc(income, province);

      // No negative values
      assert.ok(r.federal_tax      >= 0, 'federal_tax negative');
      assert.ok(r.provincial_tax   >= 0, 'provincial_tax negative');
      assert.ok(r.cpp_contribution >= 0, 'cpp_contribution negative');
      assert.ok(r.ei_premium       >= 0, 'ei_premium negative');
      assert.ok(r.total_deductions >= 0, 'total_deductions negative');
      assert.ok(r.annual_net_income >= 0, 'annual_net_income negative');
      assert.ok(r.monthly_take_home >= 0, 'monthly_take_home negative');

      // Net income is less than gross
      assert.ok(r.annual_net_income < income || income === 0, 'net >= gross');

      // total_deductions = sum of components
      const expected = r.federal_tax + r.provincial_tax + r.cpp_contribution + r.ei_premium;
      assertClose(r.total_deductions, expected, 0.02, 'total_deductions sum');

      // annual_net_income = gross − total_deductions
      assertClose(r.annual_net_income, income - r.total_deductions, 0.02, 'annual_net_income');

      // monthly_take_home = round(annual_net / 12)
      assert.equal(r.monthly_take_home, Math.round(r.annual_net_income / 12));

      // Inputs echoed
      assert.equal(r.gross_income,  income);
      assert.equal(r.province_code, province);
    });
  }
});

// ── Output shape ──────────────────────────────────────────────────────────────

describe('output shape and assumptions (AC-6)', () => {
  it('assumptions array contains all four required strings', () => {
    const result = calc(80_000, 'ON');
    const required = ['employee', 'standard_credits_only', 'no_rrsp_deductions', '2026_tax_year'];
    for (const s of required) {
      assert.ok(result.assumptions.includes(s), `missing assumption: ${s}`);
    }
  });

  it('quebec_special_case is false for non-Quebec provinces', () => {
    const result = calc(80_000, 'ON');
    assert.equal(result.quebec_special_case, false);
  });

  it('effective tax rate increases with income (progression check)', () => {
    const low  = calc( 50_000, 'ON');
    const high = calc(150_000, 'ON');
    const lowRate  = low.total_deductions  /  50_000;
    const highRate = high.total_deductions / 150_000;
    assert.ok(highRate > lowRate, `higher income should have higher effective rate`);
  });
});
