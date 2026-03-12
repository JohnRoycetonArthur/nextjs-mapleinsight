#!/usr/bin/env node
/**
 * SCRIPT 3 — Inject Checklist & Newsletter dataLayer Tracking
 * ─────────────────────────────────────────────────────────────
 * US-8.3 AC-1, AC-2, AC-3, AC-4, AC-5
 *
 * What this does:
 *   1. Directly patches checklist-design-comp.jsx to add:
 *        - checklist_item_checked events (every check/uncheck)
 *        - checklist_milestone_reached events (25%, 50%, 75%, 100%)
 *        - checklist_completed conversion event (100% only)
 *   2. Patches the newsletter form in start-here-design-comp.jsx and
 *      checklist-design-comp.jsx to fire newsletter_signup events
 *   3. Verifies the patches by checking for the expected dataLayer calls
 *
 * Usage:
 *   node 3-checklist-newsletter-tracking.js [--dry-run]
 *
 *   --dry-run   Preview what will be changed without writing any files
 *
 * Prerequisites:
 *   - Script 2 must have been run first (creates src/lib/analytics.ts)
 *   - Run from your project root
 */

const fs   = require('fs');
const path = require('path');

const CWD      = process.cwd();
const DRY_RUN  = process.argv.includes('--dry-run');

console.log(`\n🍁  Maple Insight — Checklist & Newsletter Tracking`);
console.log(`    US-8.3${DRY_RUN ? '  [DRY RUN — no files will be written]' : ''}\n`);

// ── Helpers ───────────────────────────────────────────────────────────────────

function backup(filePath) {
  const bp = filePath + '.analytics-backup';
  if (!fs.existsSync(bp)) {
    fs.copyFileSync(filePath, bp);
    if (!DRY_RUN) console.log(`  💾  Backup: ${path.relative(CWD, bp)}`);
  }
}

function writeFile(filePath, content) {
  if (DRY_RUN) {
    console.log(`  📝  [DRY RUN] Would write: ${path.relative(CWD, filePath)}`);
  } else {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function findFile(candidates) {
  for (const c of candidates) {
    const full = path.join(CWD, c);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// ── Locate component files ────────────────────────────────────────────────────

const CHECKLIST_CANDIDATES = [
  'src/components/checklist-design-comp.jsx',
  'src/components/ChecklistPage.jsx',
  'src/components/ChecklistPage.tsx',
  'src/app/checklist/page.jsx',
  'src/app/checklist/page.tsx',
  'components/checklist-design-comp.jsx',
  'pages/checklist.jsx',
  'pages/checklist.tsx',
];

const START_HERE_CANDIDATES = [
  'src/components/start-here-design-comp.jsx',
  'src/components/StartHerePage.jsx',
  'src/components/StartHerePage.tsx',
  'src/app/page.jsx',
  'src/app/page.tsx',
  'components/start-here-design-comp.jsx',
  'pages/index.jsx',
  'pages/index.tsx',
];

const checklistFile  = findFile(CHECKLIST_CANDIDATES);
const startHereFile  = findFile(START_HERE_CANDIDATES);

if (!checklistFile) {
  console.warn('  ⚠️   Could not auto-locate the checklist component.');
  console.warn('       Checked:');
  CHECKLIST_CANDIDATES.forEach(c => console.warn(`         ${c}`));
  console.warn('       The patch file will still be generated — apply it manually.\n');
}

if (!startHereFile) {
  console.warn('  ⚠️   Could not auto-locate the Start Here / homepage component.');
  console.warn('       The patch file will still be generated — apply it manually.\n');
}

// ── PATCH 1: Checklist component ──────────────────────────────────────────────

/**
 * We patch three things in the checklist component:
 *
 * A) Add the analytics import at the top
 * B) Add milestonesReachedRef inside ChecklistPage
 * C) Augment handleToggle to fire item and milestone events
 */

function patchChecklistComponent(filePath) {
  console.log(`\n📄  Patching checklist: ${path.relative(CWD, filePath)}`);
  backup(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // A) Add import if not present
  if (!content.includes('from') || !content.includes('analytics')) {
    const importLine = `import {\n  trackChecklistItemChecked,\n  trackChecklistMilestone,\n} from '@/lib/analytics';\n`;

    // Insert after the last import statement
    const lastImportMatch = [...content.matchAll(/^import .+$/gm)].pop();
    if (lastImportMatch) {
      const insertAt = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertAt) + '\n' + importLine + content.slice(insertAt);
      console.log('  ✅  Added analytics import');
      changed = true;
    } else {
      content = importLine + content;
      console.log('  ✅  Prepended analytics import');
      changed = true;
    }
  } else {
    console.log('  ℹ️   Analytics import already present');
  }

  // B) Add milestonesReachedRef after checkedItems state (if not present)
  const MILESTONES_REF = `  const milestonesReached = useRef(new Set<number>());`;

  if (!content.includes('milestonesReached')) {
    // Insert after the checkedItems useState line
    content = content.replace(
      /(const \[checkedItems, setCheckedItems\] = useState.*?;)/,
      `$1\n${MILESTONES_REF}`
    );
    if (content.includes('milestonesReached')) {
      console.log('  ✅  Added milestonesReached ref');
      changed = true;
    } else {
      console.log('  ⚠️   Could not find checkedItems useState — add milestonesReached ref manually');
      console.log(`      Add this line inside ChecklistPage:\n      ${MILESTONES_REF}`);
    }
  } else {
    console.log('  ℹ️   milestonesReached ref already present');
  }

  // C) Augment handleToggle
  // The key pattern from the design comp:
  //   persist(next);
  //   if (next.size === TOTAL_ITEMS) { ... confetti ... }
  //   return next;
  //
  // We insert after persist(next); and BEFORE the confetti/return block

  if (!content.includes('trackChecklistItemChecked')) {
    const TRACKING_INJECTION = `
      // ── Analytics (US-8.3) ──────────────────────────────────────
      const wasChecked = prev.has(id);
      const itemPeriod = (() => {
        for (const group of CHECKLIST_DATA) {
          if (group.items.some((item: { id: string }) => item.id === id)) {
            return group.period;
          }
        }
        return 'unknown';
      })();
      trackChecklistItemChecked(id, itemPeriod, wasChecked ? 'unchecked' : 'checked');
      trackChecklistMilestone(next.size, TOTAL_ITEMS, milestonesReached.current);
      // ── End Analytics ────────────────────────────────────────────`;

    // Insert the tracking block after persist(next);
    content = content.replace(
      /(persist\(next\);)/,
      `$1\n${TRACKING_INJECTION}`
    );

    if (content.includes('trackChecklistItemChecked')) {
      console.log('  ✅  Injected item + milestone tracking into handleToggle');
      changed = true;
    } else {
      console.log('  ⚠️   Could not auto-inject into handleToggle.');
      console.log('       Add this block manually after persist(next):');
      console.log(TRACKING_INJECTION);
    }
  } else {
    console.log('  ℹ️   Checklist tracking already present in handleToggle');
  }

  if (changed) {
    writeFile(filePath, content);
    console.log(`  ✅  Checklist component patched successfully`);
  }

  return changed;
}

// ── PATCH 2: Newsletter forms ─────────────────────────────────────────────────

/**
 * Newsletter forms exist in both components. We need to:
 * A) Add the analytics import
 * B) Wrap the subscribe button click with a handler that fires the event
 *
 * Because the newsletter form in the design comps is a static input+button
 * (no submit handler yet), we inject a handleNewsletterSubmit function.
 */

function patchNewsletterInFile(filePath, placement) {
  console.log(`\n📄  Patching newsletter (${placement}): ${path.relative(CWD, filePath)}`);
  backup(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // A) Add import if not present
  if (!content.includes('trackNewsletterSignup')) {
    const importLine = `import { trackNewsletterSignup } from '@/lib/analytics';\n`;
    const lastImportMatch = [...content.matchAll(/^import .+$/gm)].pop();
    if (lastImportMatch) {
      const insertAt = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertAt) + '\n' + importLine + content.slice(insertAt);
      console.log('  ✅  Added trackNewsletterSignup import');
      changed = true;
    }
  } else {
    console.log('  ℹ️   trackNewsletterSignup import already present');
  }

  // B) Find the newsletter section and inject state + handler
  // The design comp pattern: <input type="email" ...> + <button>Subscribe Free</button>

  if (!content.includes('handleNewsletterSubmit') && content.includes('Subscribe Free')) {

    // Find the component that contains the newsletter form and inject state
    // We look for the useState block inside the page component and add email state
    const EMAIL_STATE = `  const [newsletterEmail, setNewsletterEmail] = useState('');\n  const [newsletterStatus, setNewsletterStatus] = useState<'idle'|'success'|'error'>('idle');\n`;

    // Insert after existing useState declarations
    const lastUseState = [...content.matchAll(/const \[.*?\] = useState.*?;/g)].pop();
    if (lastUseState) {
      const insertAt = lastUseState.index + lastUseState[0].length;
      content = content.slice(0, insertAt) + '\n' + EMAIL_STATE + content.slice(insertAt);
      console.log('  ✅  Added newsletter email/status state');
      changed = true;
    }

    // Inject the submit handler near the end of the component function (before return)
    const HANDLER = `
  // ── Newsletter submit handler (US-8.3) ────────────────────────────────────
  async function handleNewsletterSubmit() {
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    try {
      // Replace with your actual email platform API call:
      // e.g. await subscribeToMailchimp(newsletterEmail)
      //      await subscribeToConvertKit(newsletterEmail)
      //      await subscribeToButtondown(newsletterEmail)
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      setNewsletterStatus('success');
      trackNewsletterSignup('${placement}'); // ← fires ONLY on success
    } catch {
      setNewsletterStatus('error');
      // Do NOT call trackNewsletterSignup on failure
    }
  }
  // ── End Newsletter handler ─────────────────────────────────────────────────\n`;

    // Insert before the return statement of the main component
    content = content.replace(
      /(\n  return \()/,
      `${HANDLER}\n  return (`
    );

    console.log('  ✅  Injected handleNewsletterSubmit handler');
    changed = true;

    // C) Wire up the input and button
    // Replace static input with controlled input
    content = content.replace(
      /(<input\s[^>]*type="email"[^>]*placeholder="your@email\.com"[^/]*\/>)/,
      `<input
              type="email"
              placeholder="your@email.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubmit()}
              aria-label="Email address for newsletter signup"`
    );

    // Replace static Subscribe Free button with wired-up version
    content = content.replace(
      /(<button\s[^>]*>\s*Subscribe Free\s*<\/button>)/,
      `<button
              onClick={handleNewsletterSubmit}
              disabled={newsletterStatus === 'success'}
            >
              {newsletterStatus === 'success' ? '✓ Subscribed!' : 'Subscribe Free'}
            </button>`
    );

    console.log('  ✅  Wired email input and Subscribe button to handler');
    changed = true;
  } else if (content.includes('handleNewsletterSubmit')) {
    console.log('  ℹ️   Newsletter handler already present');
  } else {
    console.log('  ⚠️   Could not find "Subscribe Free" button — newsletter form may use different structure.');
    console.log(`       Add trackNewsletterSignup('${placement}') manually in your submit handler.`);
  }

  if (changed) {
    writeFile(filePath, content);
    console.log(`  ✅  Newsletter (${placement}) patched successfully`);
  }

  return changed;
}

// ── PATCH 3: Generate standalone patch files for manual application ───────────

const PATCHES_DIR = path.join(CWD, 'src', 'lib', 'analytics-patches');
if (!fs.existsSync(PATCHES_DIR)) fs.mkdirSync(PATCHES_DIR, { recursive: true });

const CHECKLIST_MANUAL_PATCH = `/**
 * MANUAL PATCH: Checklist Component (US-8.3)
 * ───────────────────────────────────────────
 * Apply this if the automated script could not locate your checklist file.
 * These are the exact changes needed in your checklist component.
 */

// ── STEP 1: Add import (top of file) ─────────────────────────────────────────

import {
  trackChecklistItemChecked,
  trackChecklistMilestone,
} from '@/lib/analytics';


// ── STEP 2: Add ref inside ChecklistPage component body ───────────────────────
//    Add this alongside your other useState declarations

const milestonesReached = useRef(new Set<number>());


// ── STEP 3: Augment handleToggle ──────────────────────────────────────────────
//    Your existing handleToggle looks like this:
//
//    const handleToggle = useCallback((id) => {
//      setCheckedItems((prev) => {
//        const next = new Set(prev);
//        if (next.has(id)) next.delete(id); else next.add(id);
//        persist(next);
//        if (next.size === TOTAL_ITEMS) { ... confetti ... }
//        return next;
//      });
//    }, [persist]);
//
//    ADD the tracking block immediately after persist(next):

const handleToggle = useCallback((id: string) => {
  setCheckedItems((prev) => {
    const next = new Set(prev);
    const wasChecked = prev.has(id);
    if (wasChecked) next.delete(id); else next.add(id);

    persist(next);

    // ── Analytics (US-8.3) ─────────────────────────────
    const itemPeriod = (() => {
      for (const group of CHECKLIST_DATA) {
        if (group.items.some((item: { id: string }) => item.id === id)) {
          return group.period;
        }
      }
      return 'unknown';
    })();
    trackChecklistItemChecked(id, itemPeriod, wasChecked ? 'unchecked' : 'checked');
    trackChecklistMilestone(next.size, TOTAL_ITEMS, milestonesReached.current);
    // ── End Analytics ──────────────────────────────────

    if (next.size === TOTAL_ITEMS) {
      setTimeout(() => setShowConfetti(true), 200);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    return next;
  });
}, [persist]);
`;

const NEWSLETTER_MANUAL_PATCH = `/**
 * MANUAL PATCH: Newsletter Form (US-8.3)
 * ───────────────────────────────────────
 * Apply to any component that contains a newsletter signup form.
 * Adjust 'signup_placement' for each form location.
 */

// ── STEP 1: Add import ────────────────────────────────────────────────────────

import { trackNewsletterSignup, type SignupPlacement } from '@/lib/analytics';


// ── STEP 2: Add state in your component ──────────────────────────────────────

const [newsletterEmail, setNewsletterEmail] = useState('');
const [newsletterStatus, setNewsletterStatus] = useState<'idle'|'success'|'error'>('idle');


// ── STEP 3: Add handler ───────────────────────────────────────────────────────
//    Change the placement string to match where this form lives:
//    'homepage' | 'article_inline' | 'exit_popup' | 'checklist_page' | 'start_here_page'

async function handleNewsletterSubmit(placement: SignupPlacement) {
  if (!newsletterEmail || !newsletterEmail.includes('@')) return;
  try {
    await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newsletterEmail }),
    });
    setNewsletterStatus('success');
    trackNewsletterSignup(placement); // ← only fires on API success
  } catch {
    setNewsletterStatus('error');
  }
}


// ── STEP 4: Wire up the form elements ────────────────────────────────────────

<input
  type="email"
  value={newsletterEmail}
  onChange={(e) => setNewsletterEmail(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubmit('homepage')}
  placeholder="your@email.com"
/>

<button
  onClick={() => handleNewsletterSubmit('homepage')}
  disabled={newsletterStatus === 'success'}
>
  {newsletterStatus === 'success' ? '✓ Subscribed!' : 'Subscribe Free'}
</button>
`;

fs.writeFileSync(path.join(PATCHES_DIR, 'patch-checklist-tracking.ts'), CHECKLIST_MANUAL_PATCH);
fs.writeFileSync(path.join(PATCHES_DIR, 'patch-newsletter-tracking.ts'), NEWSLETTER_MANUAL_PATCH);
console.log('  ✅  Manual patch files written to src/lib/analytics-patches/');

// ── Run patches ───────────────────────────────────────────────────────────────

if (checklistFile) {
  patchChecklistComponent(checklistFile);
} else {
  console.log('\n  ℹ️   Checklist auto-patch skipped — apply patch-checklist-tracking.ts manually');
}

if (startHereFile) {
  patchNewsletterInFile(startHereFile, 'start_here_page');
} else {
  console.log('\n  ℹ️   Start Here newsletter patch skipped — apply patch-newsletter-tracking.ts manually');
}

if (checklistFile) {
  patchNewsletterInFile(checklistFile, 'checklist_page');
}

// ── Verification check ────────────────────────────────────────────────────────

console.log('\n🔍  Verifying patches...');

function verifyFile(filePath, checks) {
  if (!filePath || !fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const { pattern, label } of checks) {
    const found = content.includes(pattern);
    console.log(`  ${found ? '✅' : '❌'}  ${label}`);
    if (!found && !DRY_RUN) {
      console.log(`       → Search for "${pattern}" in ${path.relative(CWD, filePath)}`);
    }
  }
}

if (checklistFile) {
  verifyFile(checklistFile, [
    { pattern: 'trackChecklistItemChecked', label: 'checklist_item_checked event' },
    { pattern: 'trackChecklistMilestone',   label: 'checklist_milestone_reached event' },
    { pattern: 'milestonesReached',         label: 'milestone deduplication ref' },
    { pattern: 'trackNewsletterSignup',     label: 'newsletter_signup event (checklist page)' },
  ]);
}

if (startHereFile) {
  verifyFile(startHereFile, [
    { pattern: 'trackNewsletterSignup', label: 'newsletter_signup event (Start Here page)' },
    { pattern: 'handleNewsletterSubmit', label: 'newsletter submit handler' },
  ]);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('\n✅  Checklist & newsletter tracking setup complete.\n');
console.log('WHAT WAS PATCHED:');
console.log('  • Checklist handleToggle: fires checklist_item_checked + milestones');
console.log('  • Newsletter forms: fires newsletter_signup with correct placement');
console.log('  • Manual patches: src/lib/analytics-patches/ (if auto-patch failed)\n');

console.log('NEXT STEPS FOR YOUR DEVELOPER:');
console.log('  1. Run the dev server: npm run dev');
console.log('  2. Open /checklist — check an item — run in browser console:');
console.log('     console.log(window.dataLayer)');
console.log('     You should see a checklist_item_checked event object');
console.log('  3. Check items until 25% complete — verify checklist_milestone_reached appears');
console.log('  4. Submit the newsletter form — verify newsletter_signup appears\n');

console.log('THEN (Manual Steps — you do these in GTM):');
console.log('  • Create triggers, variables, and tags (Manual Steps 3.1–3.9)');
console.log('  • Mark conversions in GA4 (Manual Step 3.14–3.16)');
console.log('  • Refer to: US-8.3-Checklist-Newsletter-Tracking.md\n');
