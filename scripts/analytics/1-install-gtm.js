#!/usr/bin/env node
/**
 * SCRIPT 1 — Install GTM Snippets into Next.js
 * ─────────────────────────────────────────────
 * US-8.1 AC-1, AC-2, AC-3
 *
 * What this does:
 *   1. Finds your Next.js layout file (_document.js/tsx OR app/layout.tsx)
 *   2. Injects the GTM <head> script and <body> noscript snippets
 *   3. Initialises window.dataLayer before GTM loads
 *   4. Audits all source files for hardcoded analytics scripts (AC-3)
 *
 * Usage:
 *   node 1-install-gtm.js --gtm-id GTM-XXXXXXX
 *
 * Prerequisites:
 *   - Run from your project root: cd /path/to/mapleinsight && node scripts/analytics/1-install-gtm.js --gtm-id GTM-XXXXXXX
 *   - You must have already created your GTM container (Manual Step 1.1)
 *     and have your Container ID ready (looks like GTM-XXXXXXX)
 */

const fs   = require('fs');
const path = require('path');

// ── CLI argument parsing ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const gtmIdFlag = args.indexOf('--gtm-id');

if (gtmIdFlag === -1 || !args[gtmIdFlag + 1]) {
  console.error('\n❌  Missing required argument.\n');
  console.error('Usage: node 1-install-gtm.js --gtm-id GTM-XXXXXXX\n');
  console.error('You get your GTM Container ID from tagmanager.google.com');
  console.error('after completing Manual Step 1.1 in US-8.1-GA4-GTM-Implementation.md\n');
  process.exit(1);
}

const GTM_ID = args[gtmIdFlag + 1].trim();

if (!/^GTM-[A-Z0-9]+$/.test(GTM_ID)) {
  console.error(`\n❌  "${GTM_ID}" doesn't look like a valid GTM Container ID.`);
  console.error('It should look like: GTM-ABC1234\n');
  process.exit(1);
}

console.log(`\n🍁  Maple Insight — GTM Installation`);
console.log(`    Container ID: ${GTM_ID}\n`);

// ── GTM snippet templates ─────────────────────────────────────────────────────
const GTM_HEAD_SCRIPT = `
    {/* ── Google Tag Manager ── */}
    <Script
      id="gtm-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: \`
          window.dataLayer = window.dataLayer || [];
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),
                dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        \`,
      }}
    />
    {/* ── End Google Tag Manager ── */}`;

const GTM_NOSCRIPT_BODY = `
      {/* ── Google Tag Manager (noscript) ── */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
      {/* ── End Google Tag Manager (noscript) ── */}`;

// Plain HTML versions for _document.js
const GTM_HEAD_SCRIPT_HTML = `
        {/* ── Google Tag Manager ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`
              window.dataLayer = window.dataLayer || [];
              (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            \`,
          }}
        />
        {/* ── End Google Tag Manager ── */}`;

// ── File discovery ────────────────────────────────────────────────────────────
const CWD = process.cwd();

// Candidate layout files in priority order
const LAYOUT_CANDIDATES = [
  'src/app/layout.tsx',
  'src/app/layout.jsx',
  'app/layout.tsx',
  'app/layout.jsx',
  'src/pages/_document.tsx',
  'src/pages/_document.jsx',
  'src/pages/_document.js',
  'pages/_document.tsx',
  'pages/_document.jsx',
  'pages/_document.js',
];

function findLayoutFile() {
  for (const candidate of LAYOUT_CANDIDATES) {
    const full = path.join(CWD, candidate);
    if (fs.existsSync(full)) return { file: full, relative: candidate };
  }
  return null;
}

// ── Backup helper ─────────────────────────────────────────────────────────────
function backup(filePath) {
  const backupPath = filePath + '.gtm-backup';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`  💾  Backup created: ${path.relative(CWD, backupPath)}`);
  }
}

// ── Injection logic ───────────────────────────────────────────────────────────

/**
 * Handles Next.js App Router layout (app/layout.tsx)
 * Looks for the <head> closing tag or the opening <body> tag
 */
function patchAppLayout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already installed
  if (content.includes('googletagmanager.com/gtm.js')) {
    console.log('  ℹ️   GTM script already present in this file — skipping injection.');
    console.log(`      Verify your Container ID is ${GTM_ID} — search for "GTM-" in the file.\n`);
    return false;
  }

  // Ensure next/script is imported
  if (!content.includes("from 'next/script'") && !content.includes('from "next/script"')) {
    // Add import after the last existing import line
    content = content.replace(
      /(import .+\n)(?!import)/,
      `$1import Script from 'next/script';\n`
    );
    console.log("  ✅  Added: import Script from 'next/script'");
  }

  // Insert GTM head script before </head> or before <body>
  if (content.includes('</head>')) {
    content = content.replace('</head>', `${GTM_HEAD_SCRIPT}\n    </head>`);
    console.log('  ✅  Injected GTM <head> script before </head>');
  } else {
    console.log('  ⚠️   Could not find </head> — attempting to insert before <body>');
  }

  // Insert noscript immediately after <body> opening tag
  // Handles: <body>, <body className="...">, <body style={{...}}>
  const bodyPattern = /(<body[^>]*>)/;
  if (bodyPattern.test(content)) {
    content = content.replace(bodyPattern, `$1${GTM_NOSCRIPT_BODY}`);
    console.log('  ✅  Injected GTM <body> noscript immediately after <body> tag');
  } else {
    console.warn('  ⚠️   Could not find <body> tag — you may need to add the noscript snippet manually.');
    console.warn('      See US-8.1 Developer Task 1 for the snippet to add.\n');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Handles Next.js Pages Router _document (pages/_document.tsx/jsx/js)
 */
function patchDocument(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('googletagmanager.com/gtm.js')) {
    console.log('  ℹ️   GTM script already present — skipping injection.');
    return false;
  }

  // Insert before </Head> (Next.js <Head> component)
  if (content.includes('</Head>')) {
    content = content.replace('</Head>', `${GTM_HEAD_SCRIPT_HTML}\n        </Head>`);
    console.log('  ✅  Injected GTM script before </Head>');
  }

  // Insert noscript after <body> or after <Main />
  if (content.includes('<body>') || content.includes('<body ')) {
    const bodyPattern = /(<body[^>]*>)/;
    content = content.replace(bodyPattern, `$1\n${GTM_NOSCRIPT_BODY}`);
    console.log('  ✅  Injected GTM noscript after <body>');
  } else if (content.includes('<Main />')) {
    // Fallback: wrap Main in a fragment with the noscript
    content = content.replace(
      '<Main />',
      `{/* ── GTM noscript ── */}\n              <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>\n              <Main />`
    );
    console.log('  ✅  Injected GTM noscript before <Main />');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// ── Hardcoded analytics audit ─────────────────────────────────────────────────
const AUDIT_PATTERNS = [
  { pattern: /gtag\s*\(/g,             label: 'gtag() call' },
  { pattern: /google-analytics\.com/g, label: 'google-analytics.com URL' },
  { pattern: /googletagmanager\.com\/gtag/g, label: 'gtag URL' },
  { pattern: /_gaq\.push/g,            label: 'Legacy _gaq.push (UA)' },
  { pattern: /analytics\.js/g,         label: 'analytics.js script' },
  { pattern: /G-[A-Z0-9]{8,}/g,        label: 'Hardcoded GA4 Measurement ID' },
];

const AUDIT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html'];
const AUDIT_IGNORE = ['node_modules', '.next', '.git', 'out', 'dist', 'build', '.gtm-backup'];

function auditForHardcodedAnalytics() {
  console.log('\n🔍  Auditing codebase for hardcoded analytics scripts (AC-3)...');
  const hits = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      if (AUDIT_IGNORE.some(ig => entry.name === ig)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (AUDIT_EXTENSIONS.includes(path.extname(entry.name))) {
        const content = fs.readFileSync(full, 'utf8');
        for (const { pattern, label } of AUDIT_PATTERNS) {
          const matches = content.match(pattern);
          if (matches) {
            // Skip our own injected GTM snippet file
            if (content.includes(`GTM-`) && full.includes('layout')) continue;
            // Skip dataLayer.push — that's intentional
            if (label === 'gtag() call' && content.includes('dataLayer.push')) continue;
            hits.push({ file: path.relative(CWD, full), label, count: matches.length });
          }
        }
      }
    }
  }

  walk(CWD);

  if (hits.length === 0) {
    console.log('  ✅  No hardcoded analytics scripts found — clean codebase.\n');
  } else {
    console.log(`  ⚠️   Found ${hits.length} potential hardcoded analytics reference(s):\n`);
    hits.forEach(h => {
      console.log(`      📄  ${h.file}`);
      console.log(`          → ${h.label} (${h.count} occurrence(s))`);
    });
    console.log('\n  ⚡  Action required: Review these files and remove any analytics');
    console.log('      scripts that are not dataLayer.push() calls.');
    console.log('      GA4 should only load through GTM.\n');
  }

  return hits;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const found = findLayoutFile();

  if (!found) {
    console.error('❌  Could not find a Next.js layout file.');
    console.error('    Looked for:');
    LAYOUT_CANDIDATES.forEach(c => console.error(`      - ${c}`));
    console.error('\n    Make sure you are running this script from your project root.');
    console.error('    cd /path/to/your/mapleinsight-project && node scripts/analytics/1-install-gtm.js --gtm-id GTM-XXXXXXX\n');
    process.exit(1);
  }

  console.log(`📄  Found layout file: ${found.relative}\n`);
  backup(found.file);

  const isAppRouter = found.relative.includes('app/layout');
  let patched;

  if (isAppRouter) {
    console.log('  ℹ️   Detected Next.js App Router (app/layout.tsx)\n');
    patched = patchAppLayout(found.file);
  } else {
    console.log('  ℹ️   Detected Next.js Pages Router (pages/_document)\n');
    patched = patchDocument(found.file);
  }

  // Run the audit regardless
  auditForHardcodedAnalytics();

  if (patched) {
    console.log('─'.repeat(60));
    console.log('\n✅  GTM installation complete.\n');
    console.log('NEXT STEPS:');
    console.log('  1. Run your dev server and verify the page source contains');
    console.log(`     the GTM snippet with ID: ${GTM_ID}`);
    console.log('  2. Open GTM Preview mode (tagmanager.google.com) and verify');
    console.log('     the GA4 Configuration tag fires on page load.');
    console.log('  3. Check GA4 DebugView (analytics.google.com) to confirm');
    console.log('     page_view events are arriving in real time.');
    console.log('\n  Refer to Manual Step 1.9 in US-8.1-GA4-GTM-Implementation.md\n');
  }
}

main();
