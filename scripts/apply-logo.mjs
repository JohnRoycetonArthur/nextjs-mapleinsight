import fs from "fs";
import path from "path";

const root = process.cwd();

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}
function backup(p) {
  const bak = `${p}.bak`;
  if (exists(p) && !exists(bak)) fs.copyFileSync(p, bak);
}

const publicDir = path.join(root, "public");
const markPath = path.join(publicDir, "logo-mark.svg");
const fullPath = path.join(publicDir, "logo.svg");

/**
 * Maple Insight Logo Mark (SVG)
 * - Maple red leaf + forest green dot
 * - Rounded-square container
 */
const logoMarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maple Insight">
  <rect x="2" y="2" width="44" height="44" rx="12" fill="#FFFFFF" stroke="#E5E7EB"/>
  <!-- Maple leaf (simple, modern) -->
  <path d="M24 12
           L27 18
           L34 16
           L30.5 22
           L36 25
           L29.5 26.5
           L31 33
           L24 29.5
           L17 33
           L18.5 26.5
           L12 25
           L17.5 22
           L14 16
           L21 18
           L24 12Z"
        fill="#D62828"/>
  <!-- Insight dot -->
  <circle cx="35.5" cy="14.5" r="3" fill="#1B4332"/>
</svg>
`;

/**
 * Full logo (mark + wordmark). Great for footer/hero.
 */
const logoFullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="260" height="48" viewBox="0 0 260 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maple Insight">
  <rect x="2" y="2" width="44" height="44" rx="12" fill="#FFFFFF" stroke="#E5E7EB"/>
  <path d="M24 12
           L27 18
           L34 16
           L30.5 22
           L36 25
           L29.5 26.5
           L31 33
           L24 29.5
           L17 33
           L18.5 26.5
           L12 25
           L17.5 22
           L14 16
           L21 18
           L24 12Z"
        fill="#D62828"/>
  <circle cx="35.5" cy="14.5" r="3" fill="#1B4332"/>

  <text x="58" y="29" font-family="Inter, ui-sans-serif, system-ui" font-size="18" font-weight="700" fill="#111827">
    Maple Insight
  </text>
  <text x="58" y="41" font-family="Inter, ui-sans-serif, system-ui" font-size="12" font-weight="500" fill="#495057">
    Financial clarity for newcomers
  </text>
</svg>
`;

// 1) Write logo files
fs.mkdirSync(publicDir, { recursive: true });
write(markPath, logoMarkSvg);
write(fullPath, logoFullSvg);

console.log(`✅ Wrote: ${path.relative(root, markPath)}`);
console.log(`✅ Wrote: ${path.relative(root, fullPath)}`);

// 2) Try updating Header/Nav (safe, targeted)
const candidates = [
  path.join(root, "src", "components", "Header.tsx"),
  path.join(root, "src", "components", "Navbar.tsx"),
  path.join(root, "src", "components", "Nav.tsx"),
  path.join(root, "components", "Header.tsx"),
  path.join(root, "components", "Navbar.tsx"),
  path.join(root, "components", "Nav.tsx"),
];

const headerFile = candidates.find(exists);

if (!headerFile) {
  console.log("⚠️ Could not find Header/Nav component automatically.");
  console.log("   Manual update: use <img src='/logo-mark.svg' ...> in your header.");
  process.exit(0);
}

backup(headerFile);
let header = read(headerFile);

// Heuristic: replace a common “logo square” div (bg color block) with the SVG mark.
// If it doesn’t match, it won’t change anything.
const before = header;

// Replace something like: <div className="h-10 w-10 ... bg-..."></div>
header = header.replace(
  /<div[^>]*className="[^"]*(h-10 w-10|w-10 h-10)[^"]*bg-[^"]*"[^>]*><\/div>/g,
  `<img src="/logo-mark.svg" alt="Maple Insight" className="h-10 w-10" />`
);

// If there’s an <img> already, just point it to our logo-mark.svg
header = header.replace(
  /<img([^>]*?)src="[^"]*"(.*?)>/g,
  `<img$1src="/logo-mark.svg"$2>`
);

// If nothing changed, tell user to manually patch
if (header === before) {
  console.log(`ℹ️ Header found but pattern didn’t match: ${path.relative(root, headerFile)}`);
  console.log("   Please update the logo manually (see snippet below).");
} else {
  write(headerFile, header);
  console.log(`✅ Updated: ${path.relative(root, headerFile)}`);
}

console.log("\nNext:");
console.log("  npm run dev");
console.log("  Visit / to confirm logo");