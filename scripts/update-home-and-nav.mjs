import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function backupFile(p) {
  const bak = `${p}.bak`;
  if (!exists(bak)) fs.copyFileSync(p, bak);
}

function updateFileInPlace(filePath, transformFn) {
  if (!exists(filePath)) return { changed: false, reason: "missing" };

  const before = read(filePath);
  const after = transformFn(before);

  if (after === before) return { changed: false, reason: "no-change" };

  backupFile(filePath);
  write(filePath, after);
  return { changed: true, reason: "updated" };
}

function findFilesRecursively(dir, maxDepth = 6, depth = 0) {
  if (!exists(dir) || depth > maxDepth) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip node_modules and .next
      if (e.name === "node_modules" || e.name === ".next") continue;
      out.push(...findFilesRecursively(full, maxDepth, depth + 1));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isLikelyNavFile(filePath) {
  const name = filePath.toLowerCase();
  return (
    name.includes("layout.tsx") ||
    name.includes("header") ||
    name.includes("nav") ||
    name.includes("navbar") ||
    name.includes("menu")
  );
}

const homepagePath = path.join(projectRoot, "src", "app", "page.tsx");

// ---- 1) HOMEPAGE REPLACEMENT ----
const newHomepage = `import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

type ArticleCard = {
  title: string;
  description: string;
  slug: string;
  updated?: string;
  category?: string;
};

function getFeaturedArticles(limit = 4): ArticleCard[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const articles = files.map((filename) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
    const { data } = matter(raw);

    return {
      title: (data.title as string) ?? filename.replace(/\\.md$/, ""),
      description: (data.description as string) ?? "",
      slug: (data.slug as string) ?? filename.replace(/\\.md$/, ""),
      updated: (data.updated as string) ?? (data.date as string) ?? "",
      category: (data.category as string) ?? "",
    };
  });

  articles.sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));
  return articles.slice(0, limit);
}

const featuredCalculators = [
  {
    title: "RRSP Refund Calculator",
    description: "Estimate how an RRSP contribution could affect your refund.",
    href: "/tools/rrsp-refund",
  },
  {
    title: "Mortgage Comparison",
    description: "Compare two mortgage scenarios: payments, interest, and total cost.",
    href: "/tools/mortgage-comparison",
  },
  {
    title: "CCB Impact Calculator",
    description: "Estimate Canada Child Benefit based on AFNI and number of children.",
    href: "/tools/ccb-impact",
  },
];

export default function HomePage() {
  const featured = getFeaturedArticles(4);

  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight">
            Clear guidance for Canadian decisions.
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Use fast calculators and calm explanations to understand RRSP refunds, mortgages,
            CCB impact, and more — without the hype.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="inline-flex items-center rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Browse articles →
            </Link>

            <Link
              href="/tools/rrsp-refund"
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Try RRSP calculator →
            </Link>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Featured articles</h2>
            <Link className="text-sm font-medium hover:underline" href="/articles">
              View all →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((a) => (
              <Link
                key={a.slug}
                href={\`/articles/\${a.slug}\`}
                className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-gray-50"
              >
                <div className="text-xs font-medium text-gray-500">
                  {a.category || "Article"} {a.updated ? \`• \${a.updated}\` : ""}
                </div>
                <div className="mt-2 text-lg font-semibold leading-snug">
                  {a.title}
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {a.description}
                </p>
              </Link>
            ))}

            {featured.length === 0 ? (
              <div className="rounded-2xl border bg-white p-5 text-gray-600">
                No articles found yet. Add markdown files to <code>/content/articles</code>.
              </div>
            ) : null}
          </div>
        </section>

        {/* Featured Calculators */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Featured calculators</h2>
            <Link className="text-sm font-medium hover:underline" href="/tools">
              View all →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredCalculators.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-gray-50"
              >
                <div className="text-lg font-semibold">{c.title}</div>
                <p className="mt-2 text-sm text-gray-600">{c.description}</p>
                <div className="mt-4 text-sm font-medium">Open →</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
`;

console.log("== Updating homepage ==");
if (exists(homepagePath)) {
  backupFile(homepagePath);
}
write(homepagePath, newHomepage);
console.log(`✅ Updated: ${path.relative(projectRoot, homepagePath)}`);
console.log(`   Backup: ${path.relative(projectRoot, homepagePath)}.bak (if it existed)`);

// ---- 2) NAV UPDATES ----
console.log("\n== Updating navigation text/links (Guides -> Articles) ==");

// Search common folders for nav-like files
const searchDirs = [
  path.join(projectRoot, "src", "app"),
  path.join(projectRoot, "src", "components"),
  path.join(projectRoot, "components"),
];

const candidates = new Set();
for (const d of searchDirs) {
  for (const f of findFilesRecursively(d)) {
    if (!f.endsWith(".tsx") && !f.endsWith(".ts") && !f.endsWith(".jsx") && !f.endsWith(".js")) continue;
    if (isLikelyNavFile(f)) candidates.add(f);
  }
}

// Transform: label and href updates
const navTransform = (s) => {
  let out = s;

  // Replace visible label "Guides" -> "Articles"
  out = out.replace(/\bGuides\b/g, "Articles");

  // Replace common hrefs: /guides -> /articles (also handles "guides" in Link href strings)
  out = out.replace(/["'`]\/guides["'`]/g, (m) => m.replace("/guides", "/articles"));
  out = out.replace(/href=\{["'`]\/guides["'`]\}/g, (m) => m.replace("/guides", "/articles"));
  out = out.replace(/href=["']\/guides["']/g, (m) => m.replace("/guides", "/articles"));

  return out;
};

let changedCount = 0;
let scannedCount = 0;

for (const filePath of candidates) {
  scannedCount++;
  const result = updateFileInPlace(filePath, navTransform);
  if (result.changed) {
    changedCount++;
    console.log(`✅ Updated nav: ${path.relative(projectRoot, filePath)}`);
  }
}

console.log(`\nScanned nav-like files: ${scannedCount}`);
console.log(`Changed files: ${changedCount}`);

console.log("\nDone. Now run:");
console.log("  npm run dev");
console.log("\nThen verify:");
console.log("  /  (homepage)");
console.log("  /articles");
console.log("  Nav shows Articles (not Guides)");
console.log("\nNote: Update featured calculator hrefs in src/app/page.tsx if your routes differ.");