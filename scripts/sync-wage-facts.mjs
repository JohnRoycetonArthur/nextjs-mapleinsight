import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OCCUPATIONS_PATH = path.resolve(__dirname, "../src/data/simulator/occupations.json");
const WAGE_FACTS_PATH = path.resolve(__dirname, "../src/data/simulator/wage_facts.json");

const JOB_BANK_BASE_URL = "https://www.jobbank.gc.ca";
const TITLE_SUGGEST_PATH = "/core/ta-jobtitle_en/select";
const WAGE_REPORT_PATH = "/wagereport/occupation";

const GEO_LABEL_TO_KEY = new Map([
  ["Canada", "national"],
  ["Alberta", "AB"],
  ["British Columbia", "BC"],
  ["Manitoba", "MB"],
  ["New Brunswick", "NB"],
  ["Newfoundland and Labrador", "NL"],
  ["Northwest Territories", "NT"],
  ["Nova Scotia", "NS"],
  ["Nunavut", "NU"],
  ["Ontario", "ON"],
  ["Prince Edward Island", "PE"],
  ["Quebec", "QC"],
  ["Saskatchewan", "SK"],
  ["Yukon", "YT"],
]);

const GEO_SORT_ORDER = [
  "national",
  "ON",
  "BC",
  "AB",
  "QC",
  "MB",
  "SK",
  "NS",
  "NB",
  "NL",
  "PE",
  "YT",
  "NT",
  "NU",
];

const MANUAL_ID_OVERRIDES = {
  "13102": { id: "22339", title: "financial services sales representative", source_noc_code: "64101" },
  "21110": { id: "2524", title: "physicist", source_noc_code: "21100" },
  "21230": { id: "2867", title: "computer hardware engineer", source_noc_code: "21311" },
  "21233": { id: "17832", title: "professional engineer, broadcasting", source_noc_code: "21310" },
  "31101": { id: "24431", title: "family physician", source_noc_code: "31102" },
  "31200": { id: "18196", title: "pharmacist", source_noc_code: "31120" },
  "32121": { id: "18254", title: "medical radiation technologist (MRT)", source_noc_code: "32121" },
  "42200": { id: "5112", title: "community and social services worker", source_noc_code: "42201" },
  "60010": { id: "17581", title: "store manager - retail", source_noc_code: "60020" },
  "72010": { id: "14508", title: "contractor, pipefitting", source_noc_code: "72012" },
  "72020": { id: "24215", title: "electrical installation supervisor", source_noc_code: "72011" },
  "72100": { id: "20684", title: "electrician", source_noc_code: "72200" },
  "72300": { id: "6388", title: "carpenter", source_noc_code: "72310" },
  "75110": { id: "23319", title: "bus driver", source_noc_code: "73301" },
};

const MANUAL_QUERY_OVERRIDES = {
  "10010": ["financial manager"],
  "11102": ["financial advisor"],
  "11103": ["investment dealer", "securities agent"],
  "13100": ["insurance broker"],
  "13101": ["real estate salesperson"],
  "13102": ["financial services sales representative", "financial services representative"],
  "13110": ["purchasing officer"],
  "21110": ["physicist", "health physicist"],
  "21120": ["chemist"],
  "21130": ["geoscientist"],
  "21220": ["cybersecurity specialist"],
  "21221": ["business systems specialist"],
  "21222": ["information systems quality assurance analyst"],
  "21223": ["database analyst", "data administrator"],
  "21224": ["computer programmer", "systems programmer"],
  "21225": ["web developer", "web designer"],
  "21226": ["desktop publisher"],
  "21230": ["computer hardware engineer", "computer engineer"],
  "21232": ["telecommunications engineer"],
  "21233": ["professional engineer", "broadcasting professional engineer"],
  "21240": ["meteorologist", "climatologist"],
  "21301": ["mechanical engineer"],
  "21320": ["chemical engineer"],
  "21321": ["industrial engineer", "manufacturing engineer"],
  "21330": ["mining engineer", "materials engineer"],
  "21410": ["architect"],
  "21420": ["landscape architect"],
  "42200": ["community and social services worker", "social services worker"],
  "22100": ["chemical technologist"],
  "22110": ["biological technologist"],
  "22220": ["computer network technician", "web technician"],
  "22222": ["information systems testing technician"],
  "22300": ["civil engineering technologist"],
  "22310": ["electrical engineering technologist"],
  "22320": ["industrial engineering technologist"],
  "22400": ["construction estimator"],
  "30010": ["health care manager"],
  "31100": ["specialist physician", "laboratory medicine specialist"],
  "31110": ["dentist"],
  "31120": ["optometrist"],
  "31101": ["family physician", "general practitioner"],
  "31200": ["pharmacist"],
  "31201": ["dietitian", "nutritionist"],
  "31202": ["audiologist", "speech-language pathologist"],
  "31209": ["physiotherapist", "occupational therapist"],
  "31302": ["nurse practitioner"],
  "32100": ["dental hygienist"],
  "32121": ["medical radiation technologist", "radiation oncology technologist"],
  "32122": ["medical sonographer"],
  "32200": ["physiotherapy assistant", "occupational therapy assistant"],
  "33103": ["pharmacy assistant"],
  "40020": ["school principal"],
  "41200": ["university professor", "lecturer"],
  "41210": ["post secondary research assistant", "post secondary teaching assistant"],
  "41220": ["college instructor", "vocational instructor"],
  "41301": ["psychologist"],
  "41302": ["counsellor", "counselor"],
  "43100": ["teacher assistant"],
  "51110": ["librarian"],
  "51112": ["technical writer", "editor"],
  "52110": ["graphic designer", "illustrator"],
  "55100": ["translator", "interpreter"],
  "60010": ["store manager retail", "retail manager"],
  "62020": ["restaurant manager", "food service manager"],
  "62021": ["accommodation service manager", "hotel manager"],
  "63010": ["retail salesperson"],
  "64100": ["food service supervisor"],
  "64300": ["hotel front desk clerk"],
  "65101": ["store shelf stocker", "order filler"],
  "72010": ["pipefitting contractor", "pipefitting supervisor"],
  "72011": ["carpentry supervisor"],
  "72020": ["electrical installation supervisor", "electrical trades supervisor"],
  "72100": ["electrician"],
  "72101": ["industrial electrician"],
  "72111": ["pipefitter", "steamfitter"],
  "72200": ["sheet metal worker"],
  "72300": ["carpenter"],
  "72310": ["bricklayer"],
  "72320": ["roofer", "shingler"],
  "72400": ["crane operator"],
  "72401": ["construction blaster", "blaster quarrying"],
  "73100": ["automotive service technician", "truck mechanic"],
  "73300": ["machinist"],
  "75100": ["transport truck driver", "truck driver"],
  "75110": ["bus driver", "school bus driver"],
  "75300": ["air pilot", "aircraft pilot", "flying instructor"],
  "94100": ["machine operator metal products"],
};

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return normalizeWhitespace(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&"),
  );
}

function normalizeText(value) {
  return normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/[()]/g, " ")
      .replace(/[/-]/g, " ")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " "),
  );
}

function singularizeWord(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 4) return word.slice(0, -1);
  return word;
}

function singularizePhrase(value) {
  return normalizeWhitespace(
    value
      .split(/\s+/)
      .map((word) => singularizeWord(word))
      .join(" "),
  );
}

function buildQueries(occupation) {
  const queries = [];
  const push = (value) => {
    const cleaned = normalizeText(value);
    if (cleaned.length < 2 || queries.includes(cleaned)) return;
    queries.push(cleaned);
  };

  push(occupation.title);
  push(singularizePhrase(occupation.title));

  for (const synonym of occupation.synonyms ?? []) {
    push(synonym);
    push(singularizePhrase(synonym));
  }

  for (const override of MANUAL_QUERY_OVERRIDES[occupation.noc_code] ?? []) {
    push(override);
  }

  return queries;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "MapleInsight wage sync script",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "MapleInsight wage sync script",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

function rankDoc(doc, occupation, query) {
  const docTitle = normalizeText(doc.title ?? "");
  const occTitle = normalizeText(occupation.title);
  const queryText = normalizeText(query);
  let score = 0;

  if (doc.noc21_code === occupation.noc_code) score += 1000;
  if (doc.example_ind === "1") score += 100;
  if (docTitle === occTitle) score += 120;
  if (docTitle === queryText) score += 80;
  if (docTitle.includes(occTitle) || occTitle.includes(docTitle)) score += 40;
  if (docTitle.includes(queryText) || queryText.includes(docTitle)) score += 20;
  score -= docTitle.length / 100;

  return score;
}

async function resolveOccupationId(occupation) {
  const manualOverride = MANUAL_ID_OVERRIDES[occupation.noc_code];
  if (manualOverride) {
    return { ...manualOverride, score: 99999 };
  }

  const exactCandidates = [];
  const fallbackCandidates = [];

  for (const query of buildQueries(occupation)) {
    for (const quoted of [true, false]) {
      const q = quoted ? `"${query}"` : query;
      const url = new URL(TITLE_SUGGEST_PATH, JOB_BANK_BASE_URL);
      url.searchParams.set("q", q);
      url.searchParams.set("wt", "json");
      url.searchParams.set("rows", "25");
      url.searchParams.set("fq", "noc_job_title_type_id:1");

      const payload = await fetchJson(url);
      for (const doc of payload.response?.docs ?? []) {
        const candidate = {
          id: doc.noc_job_title_concordance_id,
          title: doc.title,
          source_noc_code: doc.noc21_code,
          score: rankDoc(doc, occupation, query),
        };

        if (doc.noc21_code === occupation.noc_code) {
          exactCandidates.push(candidate);
        } else if (candidate.score >= 80) {
          fallbackCandidates.push(candidate);
        }
      }

      if (exactCandidates.length > 0) break;
    }

    if (exactCandidates.length > 0) break;
  }

  const candidates = exactCandidates.length > 0 ? exactCandidates : fallbackCandidates;
  if (candidates.length === 0) {
    throw new Error(`Could not resolve Job Bank concordance id for NOC ${occupation.noc_code} (${occupation.title})`);
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function parseFirstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? stripHtml(match[1]) : null;
}

function parseWageRows(html, occupation, concordanceId) {
  const refPeriod = parseFirstMatch(html, /Reference period:\s*([\s\S]*?)<\/p>/i) ?? "2023-2024";
  const updatedOn = parseFirstMatch(html, /These wages were updated on\s*([\s\S]*?)\./i) ?? null;
  const rows = [];
  const rowRegex = /<tr class="areaGroup[\s\S]*?">([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowRegex)) {
    const rowHtml = rowMatch[1];
    const headerMatch = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    if (!headerMatch) continue;

    const label = stripHtml(headerMatch[1]);
    const geoKey = GEO_LABEL_TO_KEY.get(label);
    if (!geoKey) continue;

    const cellMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].slice(0, 3);
    if (cellMatches.length < 3) continue;

    const values = cellMatches.map((match) => {
      const numeric = stripHtml(match[1]).match(/-?\d+(?:\.\d+)?/);
      return numeric ? Number.parseFloat(numeric[0]) : Number.NaN;
    });

    if (values.some((value) => Number.isNaN(value))) continue;

    rows.push({
      noc_code: occupation.noc_code,
      geo_key: geoKey,
      low_hourly: values[0],
      median_hourly: values[1],
      high_hourly: values[2],
      source: "Job Bank Canada",
      ref_period: refPeriod,
      concordance_id: String(concordanceId),
      job_title: occupation.title,
      updated_on: updatedOn,
    });
  }

  if (!rows.some((row) => row.geo_key === "national")) {
    throw new Error(`Missing national wage row for NOC ${occupation.noc_code} (${occupation.title})`);
  }

  return rows;
}

function sortRows(rows) {
  return rows.sort((a, b) => {
    const nocDiff = Number.parseInt(a.noc_code, 10) - Number.parseInt(b.noc_code, 10);
    if (nocDiff !== 0) return nocDiff;

    const aIndex = GEO_SORT_ORDER.indexOf(a.geo_key);
    const bIndex = GEO_SORT_ORDER.indexOf(b.geo_key);
    if (aIndex !== bIndex) return aIndex - bIndex;

    return a.geo_key.localeCompare(b.geo_key);
  });
}

async function main() {
  const occupationsFile = JSON.parse(await fs.readFile(OCCUPATIONS_PATH, "utf8"));
  const existingWageFile = JSON.parse(await fs.readFile(WAGE_FACTS_PATH, "utf8"));
  const occupations = occupationsFile.data;
  const generatedRows = [];
  const audit = [];

  for (const occupation of occupations) {
    console.log(`Resolving ${occupation.noc_code} ${occupation.title}`);
    const resolved = await resolveOccupationId(occupation);
    const mismatchNote = resolved.source_noc_code && resolved.source_noc_code !== occupation.noc_code
      ? ` [matched source NOC ${resolved.source_noc_code}]`
      : "";
    console.log(`  -> ${resolved.id} (${resolved.title})${mismatchNote}`);

    const html = await fetchText(`${JOB_BANK_BASE_URL}${WAGE_REPORT_PATH}/${resolved.id}`);
    const rows = parseWageRows(html, occupation, resolved.id);
    generatedRows.push(...rows);
    audit.push({
      noc_code: occupation.noc_code,
      title: occupation.title,
      concordance_id: String(resolved.id),
      matched_title: resolved.title,
      source_noc_code: resolved.source_noc_code ?? occupation.noc_code,
      ref_period: rows[0]?.ref_period ?? null,
      updated_on: rows[0]?.updated_on ?? null,
      geo_keys: rows.map((row) => row.geo_key),
    });
  }

  const outputRows = sortRows(
    generatedRows.map(({ concordance_id, job_title, updated_on, ...row }) => row),
  );

  const output = {
    metadata: {
      ...existingWageFile.metadata,
      source_url: `${JOB_BANK_BASE_URL}/wagereport/occupation/`,
      last_updated: new Date().toISOString().slice(0, 10),
      tax_year: existingWageFile.metadata.tax_year ?? 2026,
      license: "Open Government Licence - Canada",
      source_note: "Generated from live Job Bank wage reports via title-suggest and occupation wage pages.",
    },
    data: outputRows,
  };

  await fs.writeFile(WAGE_FACTS_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  const auditPath = path.resolve(__dirname, "../dist/wage-sync-audit.json");
  await fs.mkdir(path.dirname(auditPath), { recursive: true });
  await fs.writeFile(
    auditPath,
    `${JSON.stringify({ generated_at: new Date().toISOString(), occupations: audit }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Wrote ${outputRows.length} wage rows for ${occupations.length} occupations.`);
  console.log(`Audit written to ${auditPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
