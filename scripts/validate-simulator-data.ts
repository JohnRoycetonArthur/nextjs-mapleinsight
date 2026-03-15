/**
 * validate-simulator-data.ts
 *
 * Validates all static JSON files under src/data/simulator/.
 * Exits 0 on success, exits 1 on any validation failure.
 *
 * Run: ts-node --project tsconfig.scripts.json scripts/validate-simulator-data.ts
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "../src/data/simulator");

let errorCount = 0;

function fail(msg: string): void {
  console.error(`  FAIL: ${msg}`);
  errorCount++;
}

function pass(msg: string): void {
  console.log(`  OK  : ${msg}`);
}

function loadJson(filename: string): unknown {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fail(`File not found: ${filename}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function assertMetadata(metadata: Record<string, unknown>, filename: string): void {
  const required = ["data_version", "source_url", "last_updated", "tax_year", "license"];
  for (const field of required) {
    if (!metadata[field]) {
      fail(`${filename}: metadata missing required field "${field}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// occupations.json (AC-2)
// ---------------------------------------------------------------------------

function validateOccupations(): void {
  console.log("\n--- occupations.json ---");
  const file = loadJson("occupations.json") as {
    metadata: Record<string, unknown>;
    data: Array<{
      noc_code: string;
      title: string;
      synonyms: string[];
      teer_level: number;
    }>;
  };

  assertMetadata(file.metadata, "occupations.json");

  const count = file.data.length;
  if (count < 100) {
    fail(`Expected at least 100 occupations, got ${count}`);
  } else {
    pass(`${count} occupations (≥ 100 required)`);
  }

  const nocPattern = /^\d{5}$/;
  let invalidCount = 0;
  const seenCodes = new Set<string>();

  for (const entry of file.data) {
    if (!nocPattern.test(entry.noc_code)) {
      fail(`noc_code "${entry.noc_code}" is not a 5-digit string`);
      invalidCount++;
    }
    if (!entry.title || entry.title.trim() === "") {
      fail(`Entry ${entry.noc_code}: title is empty`);
      invalidCount++;
    }
    if (!Array.isArray(entry.synonyms) || entry.synonyms.length === 0) {
      fail(`Entry ${entry.noc_code}: synonyms must be a non-empty array`);
      invalidCount++;
    }
    if (seenCodes.has(entry.noc_code)) {
      fail(`Duplicate noc_code: ${entry.noc_code}`);
    }
    seenCodes.add(entry.noc_code);
  }

  if (invalidCount === 0) {
    pass("All occupations have valid noc_code, title, and synonyms");
  }
}

// ---------------------------------------------------------------------------
// cities.json (AC-3)
// ---------------------------------------------------------------------------

function validateCities(): void {
  console.log("\n--- cities.json ---");
  const file = loadJson("cities.json") as {
    metadata: Record<string, unknown>;
    data: Array<{
      city_id: string;
      name: string;
      province_code: string;
      cma_code: string;
    }>;
  };

  assertMetadata(file.metadata, "cities.json");

  const count = file.data.length;
  if (count < 20) {
    fail(`Expected at least 20 cities, got ${count}`);
  } else {
    pass(`${count} cities (≥ 20 required)`);
  }

  const requiredCities = [
    "Toronto", "Vancouver", "Montréal", "Calgary", "Edmonton",
    "Ottawa", "Winnipeg", "Halifax", "Victoria", "Hamilton",
    "Kitchener",
  ];
  const cityNames = file.data.map((c) => c.name);
  for (const required of requiredCities) {
    const found = cityNames.some((name) => name.includes(required));
    if (!found) {
      fail(`Required city not found: ${required}`);
    }
  }
  pass("All required CMAs present");

  const provinceCodes2 = /^[A-Z]{2}$/;
  const seenIds = new Set<string>();
  for (const entry of file.data) {
    if (!entry.city_id || entry.city_id.trim() === "") {
      fail(`City "${entry.name}": city_id is empty`);
    }
    if (!provinceCodes2.test(entry.province_code)) {
      fail(`City "${entry.name}": province_code "${entry.province_code}" is not 2 uppercase letters`);
    }
    if (!entry.cma_code || entry.cma_code.trim() === "") {
      fail(`City "${entry.name}": cma_code is empty`);
    }
    if (seenIds.has(entry.city_id)) {
      fail(`Duplicate city_id: ${entry.city_id}`);
    }
    seenIds.add(entry.city_id);
  }
  pass("All cities have valid city_id, province_code, and cma_code");
}

// ---------------------------------------------------------------------------
// wage_facts.json
// ---------------------------------------------------------------------------

function validateWageFacts(): void {
  console.log("\n--- wage_facts.json ---");
  const file = loadJson("wage_facts.json") as {
    metadata: Record<string, unknown>;
    data: Array<{
      noc_code: string;
      geo_key: string;
      low_hourly: number;
      median_hourly: number;
      high_hourly: number;
    }>;
  };

  const occupations = loadJson("occupations.json") as {
    metadata: Record<string, unknown>;
    data: Array<{ noc_code: string; title: string }>;
  };

  assertMetadata(file.metadata, "wage_facts.json");

  let violations = 0;
  for (const entry of file.data) {
    if (entry.low_hourly > entry.median_hourly) {
      fail(`NOC ${entry.noc_code}/${entry.geo_key}: low_hourly (${entry.low_hourly}) > median_hourly (${entry.median_hourly})`);
      violations++;
    }
    if (entry.median_hourly > entry.high_hourly) {
      fail(`NOC ${entry.noc_code}/${entry.geo_key}: median_hourly (${entry.median_hourly}) > high_hourly (${entry.high_hourly})`);
      violations++;
    }
  }
  if (violations === 0) {
    pass(`${file.data.length} wage facts pass low <= median <= high check`);
  }

  const occupationCodes = occupations.data.map((entry) => entry.noc_code);
  const wageCodes = new Set(file.data.map((entry) => entry.noc_code));
  const missingCoverage = occupations.data.filter((entry) => !wageCodes.has(entry.noc_code));
  if (missingCoverage.length > 0) {
    fail(`Missing wage coverage for ${missingCoverage.length} occupation NOC codes: ${missingCoverage.slice(0, 10).map((entry) => entry.noc_code).join(", ")}`);
  } else {
    pass(`All ${occupationCodes.length} occupation NOC codes have at least one wage row`);
  }

  const rowsByCode = new Map<string, Set<string>>();
  for (const entry of file.data) {
    if (!rowsByCode.has(entry.noc_code)) rowsByCode.set(entry.noc_code, new Set<string>());
    rowsByCode.get(entry.noc_code)!.add(entry.geo_key);
  }

  const missingNational = occupationCodes.filter((code) => !rowsByCode.get(code)?.has("national"));
  if (missingNational.length > 0) {
    fail(`Missing national wage rows for ${missingNational.length} NOC codes: ${missingNational.slice(0, 10).join(", ")}`);
  } else {
    pass("Every occupation NOC has a national wage row");
  }

  const requiredProvinceGeoKeys = ["ON", "BC", "AB", "QC"];
  const missingProvinceCoverage: Array<{ noc_code: string; missing: string[] }> = [];
  for (const code of occupationCodes) {
    const geos = rowsByCode.get(code) ?? new Set<string>();
    const missing = requiredProvinceGeoKeys.filter((geo) => !geos.has(geo));
    if (missing.length > 0) {
      missingProvinceCoverage.push({ noc_code: code, missing });
    }
  }

  if (missingProvinceCoverage.length > 0) {
    const sample = missingProvinceCoverage
      .slice(0, 10)
      .map((entry) => `${entry.noc_code} [${entry.missing.join("/")}]`)
      .join(", ");
    fail(`Missing key province wage rows for ${missingProvinceCoverage.length} NOC codes: ${sample}`);
  } else {
    pass("Every occupation NOC has key province rows for ON, BC, AB, and QC");
  }
}

// tax_brackets.json (AC-4, TC-4)
// ---------------------------------------------------------------------------

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

function validateBracketContinuity(brackets: TaxBracket[], label: string): void {
  for (let i = 0; i < brackets.length - 1; i++) {
    const current = brackets[i];
    const next = brackets[i + 1];
    if (current.max !== next.min) {
      fail(`${label}: gap or overlap between bracket ${i} (max=${current.max}) and bracket ${i + 1} (min=${next.min})`);
      return;
    }
  }
  // Last bracket must be open-ended
  const last = brackets[brackets.length - 1];
  if (last.max !== null) {
    fail(`${label}: last bracket max must be null (open-ended), got ${last.max}`);
    return;
  }
  // First bracket must start at 0
  if (brackets[0].min !== 0) {
    fail(`${label}: first bracket must start at 0, got ${brackets[0].min}`);
    return;
  }
  pass(`${label}: brackets are continuous, start at 0, end open`);
}

function validateTaxBrackets(): void {
  console.log("\n--- tax_brackets.json ---");
  const file = loadJson("tax_brackets.json") as {
    metadata: Record<string, unknown>;
    federal: TaxBracket[];
    provinces: Record<string, { name: string; brackets: TaxBracket[] }>;
  };

  assertMetadata(file.metadata, "tax_brackets.json");
  validateBracketContinuity(file.federal, "federal");

  const expectedProvinces = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];
  for (const code of expectedProvinces) {
    if (!file.provinces[code]) {
      fail(`Missing province: ${code}`);
    } else {
      validateBracketContinuity(file.provinces[code].brackets, `province:${code}`);
    }
  }

  // TC-4: Spot-check Ontario top rate (expect 13.16% at $220k+)
  const on = file.provinces["ON"];
  if (on) {
    const topBracket = on.brackets[on.brackets.length - 1];
    if (Math.abs(topBracket.rate - 0.1316) > 0.001) {
      fail(`Ontario top bracket rate expected ~0.1316, got ${topBracket.rate}`);
    } else {
      pass("Ontario top bracket rate matches expected 13.16%");
    }
  }
}

// ---------------------------------------------------------------------------
// payroll_params.json (TC-5)
// ---------------------------------------------------------------------------

function validatePayrollParams(): void {
  console.log("\n--- payroll_params.json ---");
  const file = loadJson("payroll_params.json") as {
    metadata: Record<string, unknown>;
    data: {
      tax_year: number;
      cpp: { ympe: number; employee_rate: number };
      ei: { mie: number; employee_rate: number };
    };
  };

  assertMetadata(file.metadata, "payroll_params.json");
  const { cpp, ei } = file.data;

  if (!cpp.ympe || cpp.ympe <= 0) {
    fail("cpp.ympe missing or invalid");
  } else {
    pass(`cpp_ympe = ${cpp.ympe}`);
  }

  if (!cpp.employee_rate || cpp.employee_rate <= 0 || cpp.employee_rate > 0.2) {
    fail(`cpp.employee_rate looks invalid: ${cpp.employee_rate}`);
  } else {
    pass(`cpp_rate_employee = ${cpp.employee_rate}`);
  }

  if (!ei.mie || ei.mie <= 0) {
    fail("ei.mie missing or invalid");
  } else {
    pass(`ei_mie = ${ei.mie}`);
  }

  if (!ei.employee_rate || ei.employee_rate <= 0 || ei.employee_rate > 0.1) {
    fail(`ei.employee_rate looks invalid: ${ei.employee_rate}`);
  } else {
    pass(`ei_rate_employee = ${ei.employee_rate}`);
  }
}

// ---------------------------------------------------------------------------
// mbm_thresholds.json (TC-6)
// ---------------------------------------------------------------------------

function validateMBMThresholds(): void {
  console.log("\n--- mbm_thresholds.json ---");
  const file = loadJson("mbm_thresholds.json") as {
    metadata: Record<string, unknown>;
    data: Array<{
      mbm_region: string;
      thresholds: {
        persons_1: number;
        persons_2: number;
        persons_3: number;
        persons_4: number;
        persons_5: number;
        persons_6: number;
        persons_7: number;
      };
    }>;
  };

  assertMetadata(file.metadata, "mbm_thresholds.json");

  const requiredFields: Array<keyof typeof file.data[0]["thresholds"]> = [
    "persons_1","persons_2","persons_3","persons_4","persons_5","persons_6","persons_7",
  ];

  for (const region of file.data) {
    for (const field of requiredFields) {
      if (!region.thresholds[field] || region.thresholds[field] <= 0) {
        fail(`mbm_region "${region.mbm_region}": thresholds.${field} missing or invalid`);
      }
    }
  }
  pass(`${file.data.length} MBM regions all have valid thresholds for persons 1–7`);

  // TC-6: Toronto 4-person threshold within 5% of ~$62,700 (StatsCan reference)
  const toronto = file.data.find((r) => r.mbm_region === "toronto");
  if (!toronto) {
    fail("Toronto MBM region not found");
  } else {
    const ref = 62700;
    const pctDiff = Math.abs(toronto.thresholds.persons_4 - ref) / ref;
    if (pctDiff > 0.05) {
      fail(`Toronto 4-person MBM threshold ${toronto.thresholds.persons_4} is more than 5% from reference ${ref}`);
    } else {
      pass(`Toronto 4-person MBM threshold ${toronto.thresholds.persons_4} is within 5% of reference ${ref}`);
    }
  }
}

// ---------------------------------------------------------------------------
// rent_benchmarks.json (TC-7)
// ---------------------------------------------------------------------------

function validateRentBenchmarks(): void {
  console.log("\n--- rent_benchmarks.json ---");
  const file = loadJson("rent_benchmarks.json") as {
    metadata: Record<string, unknown>;
    data: Array<{
      cma_code: string;
      city_name: string;
      rents: Array<{
        bedrooms: number;
        average_monthly: number;
        median_monthly: number;
      }>;
    }>;
  };

  assertMetadata(file.metadata, "rent_benchmarks.json");

  for (const city of file.data) {
    if (!city.cma_code || city.cma_code.trim() === "") {
      fail(`City "${city.city_name}": cma_code is empty`);
    }
    if (!Array.isArray(city.rents) || city.rents.length === 0) {
      fail(`City "${city.city_name}": rents array is empty`);
    }
    for (const rent of city.rents) {
      if (rent.average_monthly <= 0 || rent.median_monthly <= 0) {
        fail(`City "${city.city_name}" bedroom ${rent.bedrooms}: rent values must be > 0`);
      }
    }
  }
  pass(`${file.data.length} cities have valid rent benchmark entries`);

  // TC-7: Toronto 2BR average within 10% of CMHC ~$2,000
  const toronto = file.data.find((c) => c.cma_code === "535");
  if (!toronto) {
    fail("Toronto (CMA 535) rent benchmark not found");
  } else {
    const twoBr = toronto.rents.find((r) => r.bedrooms === 2);
    if (!twoBr) {
      fail("Toronto: 2-bedroom rent entry not found");
    } else {
      const ref = 2000;
      const pctDiff = Math.abs(twoBr.average_monthly - ref) / ref;
      if (pctDiff > 0.1) {
        fail(`Toronto 2BR average $${twoBr.average_monthly} is more than 10% from reference $${ref}`);
      } else {
        pass(`Toronto 2BR average $${twoBr.average_monthly} is within 10% of reference $${ref}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("=== Maple Insight Simulator Data Validation ===");

validateOccupations();
validateCities();
validateWageFacts();
validateTaxBrackets();
validatePayrollParams();
validateMBMThresholds();
validateRentBenchmarks();

console.log("\n=== Results ===");
if (errorCount === 0) {
  console.log("All validations passed.");
  process.exit(0);
} else {
  console.error(`${errorCount} validation error(s) found.`);
  process.exit(1);
}
