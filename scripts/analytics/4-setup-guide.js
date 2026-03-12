#!/usr/bin/env node
/**
 * SCRIPT 4 — Interactive GTM & GA4 Setup Guide
 * ─────────────────────────────────────────────
 * US-8.1, US-8.2, US-8.3, US-8.4 — Manual Steps
 *
 * What this does:
 *   Walks you through every manual step in the GTM and GA4 dashboards
 *   in the correct order, with direct links, your Container ID pre-filled,
 *   and progress tracking saved to .analytics-setup-progress.json
 *
 * Usage:
 *   node 4-setup-guide.js                 ← start / resume
 *   node 4-setup-guide.js --reset         ← start over
 *   node 4-setup-guide.js --status        ← show progress summary
 *   node 4-setup-guide.js --export-ids    ← show all IDs you've saved
 *
 * This is a terminal guide — it opens URLs and tracks what you've completed.
 * All progress is saved locally so you can stop and resume at any time.
 */

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');
const { exec } = require('child_process');

const CWD           = process.cwd();
const PROGRESS_FILE = path.join(CWD, '.analytics-setup-progress.json');
const ACCOUNT_EMAIL = 'roycetonis@gmail.com';

// ── Progress persistence ──────────────────────────────────────────────────────

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch { /* silent */ }
  return { completed: [], ids: {}, startedAt: new Date().toISOString() };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// ── URL opener ────────────────────────────────────────────────────────────────

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? `open "${url}"` :
              process.platform === 'win32'  ? `start "${url}"` :
              `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// ── Terminal UI ───────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RED    = '\x1b[31m';
const DIM    = '\x1b[2m';

function c(color, text) { return `${color}${text}${RESET}`; }

function header(title) {
  console.log('\n' + c(BOLD, '═'.repeat(60)));
  console.log(c(BOLD + CYAN, `  🍁  ${title}`));
  console.log(c(BOLD, '═'.repeat(60)) + '\n');
}

function stepHeader(num, total, title, usStory) {
  console.log('\n' + c(BOLD, '─'.repeat(60)));
  console.log(c(BOLD + GREEN, `  STEP ${num} of ${total}: ${title}`));
  console.log(c(DIM, `  ${usStory}`));
  console.log(c(BOLD, '─'.repeat(60)) + '\n');
}

function instruction(text) {
  console.log(`  ${c(YELLOW, '▸')} ${text}`);
}

function info(text) {
  console.log(`  ${c(DIM, '•')} ${text}`);
}

function link(url) {
  console.log(`  ${c(CYAN, '🔗')} ${c(CYAN, url)}\n`);
}

function success(text) {
  console.log(`  ${c(GREEN, '✅')} ${text}`);
}

function warning(text) {
  console.log(`  ${c(YELLOW, '⚠️')} ${text}`);
}

// ── Readline prompt ───────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(`  ${c(BOLD, '?')} ${question} `, resolve));
}

async function pressEnterToContinue() {
  await ask(c(DIM, 'Press Enter when done...'));
}

async function confirm(question) {
  const ans = await ask(`${question} ${c(DIM, '[y/n]')} `);
  return ans.trim().toLowerCase().startsWith('y');
}

async function askForId(label, example, patternHint) {
  while (true) {
    const val = await ask(`Enter your ${label} (e.g. ${c(CYAN, example)}): `);
    const trimmed = val.trim();
    if (!trimmed) { console.log(c(RED, '  Value cannot be empty — try again.')); continue; }
    if (patternHint && !new RegExp(patternHint).test(trimmed)) {
      console.log(c(YELLOW, `  That doesn't look like a ${label} — are you sure?`));
      const sure = await confirm('  Continue anyway?');
      if (!sure) continue;
    }
    return trimmed;
  }
}

// ── The step definitions ──────────────────────────────────────────────────────

async function runStep(step, progress) {
  if (progress.completed.includes(step.id)) {
    console.log(`  ${c(GREEN, '✅')} ${c(DIM, `Already completed: ${step.title}`)}`);
    return;
  }

  await step.run(progress);

  progress.completed.push(step.id);
  progress.completedAt = new Date().toISOString();
  saveProgress(progress);
  success(`Step marked complete!\n`);
}

// ── All steps ────────────────────────────────────────────────────────────────

const STEPS = [

  // ─── US-8.1 PHASE 1 ────────────────────────────────────────────────────────

  {
    id: 'gtm-create-account',
    phase: 'US-8.1 — Foundation',
    title: 'Create GTM Account & Container',
    run: async (progress) => {
      stepHeader(1, 18, 'Create GTM Account & Container', 'US-8.1 Manual Step 1.1');
      instruction(`Sign in with ${c(CYAN, ACCOUNT_EMAIL)}`);
      instruction('Click Create Account');
      info('Account Name: Maple Insight');
      info('Country: Canada');
      info('Container Name: mapleinsight.ca');
      info('Target Platform: Web');
      instruction('Click Create → Accept Terms of Service');
      instruction('IMPORTANT: Copy BOTH code snippets shown after creation');
      link('https://tagmanager.google.com');
      openUrl('https://tagmanager.google.com');
      await pressEnterToContinue();

      const gtmId = await askForId('GTM Container ID', 'GTM-ABC1234', '^GTM-[A-Z0-9]+$');
      progress.ids.GTM_CONTAINER_ID = gtmId;
      saveProgress(progress);
      success(`Saved Container ID: ${c(CYAN, gtmId)}`);
      instruction(`Now give this ID to your developer and run:\n    ${c(CYAN, `node scripts/analytics/1-install-gtm.js --gtm-id ${gtmId}`)}`);
    }
  },

  {
    id: 'ga4-create-property',
    phase: 'US-8.1 — Foundation',
    title: 'Create GA4 Property',
    run: async (progress) => {
      stepHeader(2, 18, 'Create GA4 Property', 'US-8.1 Manual Step 1.3');
      instruction(`Sign in with ${c(CYAN, ACCOUNT_EMAIL)}`);
      instruction('Click gear icon (Admin) → Create Account → Create Property');
      info('Property Name: Maple Insight - Production');
      info('Reporting Time Zone: Eastern Time');
      info('Currency: Canadian Dollar (CAD)');
      instruction('Next → Other (industry) → Small Business → Next → Get baseline reports → Create');
      link('https://analytics.google.com');
      openUrl('https://analytics.google.com');
      await pressEnterToContinue();

      const ga4Id = await askForId('GA4 Measurement ID', 'G-XXXXXXXXXX', '^G-[A-Z0-9]+$');
      progress.ids.GA4_MEASUREMENT_ID = ga4Id;
      saveProgress(progress);
      success(`Saved Measurement ID: ${c(CYAN, ga4Id)}`);
    }
  },

  {
    id: 'ga4-web-stream',
    phase: 'US-8.1 — Foundation',
    title: 'Create GA4 Web Data Stream',
    run: async (progress) => {
      const ga4Id = progress.ids.GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';
      stepHeader(3, 18, 'Create GA4 Web Data Stream', 'US-8.1 Manual Step 1.4');
      instruction('In GA4 → when prompted after property creation, select Web');
      info('Website URL: https://mapleinsight.ca');
      info('Stream Name: Maple Insight Web');
      info('Leave Enhanced Measurement ON (blue toggle)');
      instruction('Click Create stream');
      instruction(`Your Measurement ID (${c(CYAN, ga4Id)}) will show on the stream detail page`);
      await pressEnterToContinue();
    }
  },

  {
    id: 'ga4-enhanced-measurement',
    phase: 'US-8.1 — Foundation',
    title: 'Configure Enhanced Measurement',
    run: async (progress) => {
      stepHeader(4, 18, 'Configure Enhanced Measurement', 'US-8.1 Manual Step 1.5');
      instruction('In GA4 → Admin → Data Streams → [your stream] → Enhanced Measurement (gear icon)');
      info('Turn ON:  ✅ Page views, ✅ Scrolls (90%), ✅ Outbound clicks');
      info('          ✅ Site search (Query param: q,s,search,query)');
      info('          ✅ File downloads');
      info('Turn OFF: ❌ Form interactions (GTM handles these with more precision)');
      info('          ❌ Video engagement (not applicable)');
      instruction('Click Save');
      link('https://analytics.google.com/analytics/web/#/a/p/admin/streams');
      await pressEnterToContinue();
    }
  },

  {
    id: 'ga4-internal-traffic',
    phase: 'US-8.1 — Foundation',
    title: 'Filter Internal Traffic',
    run: async (progress) => {
      stepHeader(5, 18, 'Filter Internal Traffic (Your IP)', 'US-8.1 Manual Step 1.6–1.7');
      instruction('First, find your IP address:');
      link('https://www.whatismyip.com');
      openUrl('https://www.whatismyip.com');
      await pressEnterToContinue();

      const ip = await ask('Enter your IP address (e.g. 24.52.180.100): ');
      progress.ids.OWNER_IP = ip.trim();
      saveProgress(progress);

      instruction('Now go to GA4 → Admin → Data Streams → [stream] → More tagging settings');
      instruction('→ Define internal traffic → Create');
      info(`Rule Name: Owner - Royce`);
      info(`traffic_type value: internal`);
      info(`Condition: IP address equals ${c(CYAN, ip.trim())}`);
      instruction('Click Save');
      instruction('\nThen: Admin → Data Filters → Create Filter');
      info('Filter Name: Internal Traffic Filter');
      info('Filter Type: Internal traffic');
      info('Filter State: Active ← important, not "Testing"');
      instruction('Click Save');
      link('https://analytics.google.com');
      await pressEnterToContinue();

      const hasDev = await confirm('Do you want to add a developer IP as well?');
      if (hasDev) {
        const devIp = await ask('Enter developer IP address: ');
        progress.ids.DEVELOPER_IP = devIp.trim();
        saveProgress(progress);
        info('Go back to Define internal traffic and add a second rule:');
        info(`Rule Name: Developer`);
        info(`IP address equals ${c(CYAN, devIp.trim())}`);
        await pressEnterToContinue();
      }
    }
  },

  {
    id: 'gtm-ga4-tag',
    phase: 'US-8.1 — Foundation',
    title: 'Create GA4 Configuration Tag in GTM',
    run: async (progress) => {
      const gtmId = progress.ids.GTM_CONTAINER_ID || 'GTM-XXXXXXX';
      const ga4Id = progress.ids.GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';
      stepHeader(6, 18, 'Create GA4 Configuration Tag in GTM', 'US-8.1 Manual Step 1.8');
      instruction(`Open your GTM container (${c(CYAN, gtmId)})`);
      instruction('Click Tags → New → Tag Configuration');
      info('Choose: Google Analytics: GA4 Configuration');
      info(`Measurement ID: ${c(CYAN, ga4Id)}`);
      info('Triggering: All Pages');
      info('Tag Name: GA4 - Configuration');
      instruction('Click Save (do NOT publish yet)');
      link(`https://tagmanager.google.com/#/container/${gtmId || 'YOUR_CONTAINER'}/workspaces`);
      openUrl('https://tagmanager.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'gtm-preview-verify',
    phase: 'US-8.1 — Foundation',
    title: 'Verify with GTM Preview Mode',
    run: async (progress) => {
      const gtmId = progress.ids.GTM_CONTAINER_ID || 'GTM-XXXXXXX';
      stepHeader(7, 18, 'Verify with GTM Preview Mode', 'US-8.1 Manual Step 1.9');
      warning('Make sure Script 1 has been run first:');
      info(`  node scripts/analytics/1-install-gtm.js --gtm-id ${gtmId}`);
      warning('And your dev server is running: npm run dev\n');
      instruction('In GTM → click Preview (top right)');
      instruction('Enter: https://mapleinsight.ca → Connect');
      instruction('Visit a few pages — verify "GA4 - Configuration" shows under Fired tags');
      instruction('Open GA4 → Admin → DebugView in another tab');
      info('page_view events should appear within ~30 seconds');
      link('https://tagmanager.google.com');
      await pressEnterToContinue();

      const ok = await confirm('Did page_view events appear in GA4 DebugView?');
      if (!ok) {
        warning('Troubleshooting:');
        info('1. Check browser console for GTM errors');
        info('2. Verify the GTM snippet is in <head> of your pages (View Source)');
        info('3. Check that your Measurement ID in the GTM tag matches GA4 exactly');
        info('4. Make sure you are NOT on an IP address that is filtered out');
        await pressEnterToContinue();
      }
    }
  },

  {
    id: 'gtm-publish-v1',
    phase: 'US-8.1 — Foundation',
    title: 'Publish GTM Container v1',
    run: async (progress) => {
      stepHeader(8, 18, 'Publish GTM Container — Version 1', 'US-8.1 Manual Step 1.10');
      instruction('In GTM → click Submit (top right)');
      info('Version Name: v1 - Initial GA4 Setup');
      info('Version Description: GA4 configuration tag, all pages trigger');
      instruction('Click Publish');
      success('Your GA4 tracking is now live on mapleinsight.ca! 🎉');
      await pressEnterToContinue();
    }
  },

  // ─── US-8.2 PHASE 2 ────────────────────────────────────────────────────────

  {
    id: 'gtm-calculator-triggers',
    phase: 'US-8.2 — Calculator Events',
    title: 'Create GTM Triggers for Calculator Events',
    run: async (progress) => {
      stepHeader(9, 18, 'Create GTM Custom Event Triggers (Calculators)', 'US-8.2 Manual Step 2.1–2.3');
      warning('Make sure Script 2 has been run and developer has applied calculator patches first\n');
      instruction('In GTM → Triggers → New (repeat 3 times):');
      info('Trigger 1: Name="Custom Event - calculator_started"    | Type=Custom Event | Event="calculator_started"');
      info('Trigger 2: Name="Custom Event - calculator_result_viewed" | Type=Custom Event | Event="calculator_result_viewed"');
      info('Trigger 3: Name="Custom Event - calculator_result_emailed" | Type=Custom Event | Event="calculator_result_emailed"');
      link('https://tagmanager.google.com');
      openUrl('https://tagmanager.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'gtm-calculator-variables',
    phase: 'US-8.2 — Calculator Events',
    title: 'Create GTM Data Layer Variables (Calculators)',
    run: async (progress) => {
      stepHeader(10, 18, 'Create Data Layer Variables (Calculators)', 'US-8.2 Manual Step 2.4–2.6');
      instruction('In GTM → Variables → New → Data Layer Variable (repeat 3 times):');
      info('Variable 1: Name="DLV - calculator_name" | DL var name="calculator_name" | Version 2');
      info('Variable 2: Name="DLV - province"        | DL var name="province"        | Version 2');
      info('Variable 3: Name="DLV - income_range"    | DL var name="income_range"    | Version 2');
      await pressEnterToContinue();
    }
  },

  {
    id: 'gtm-calculator-tags',
    phase: 'US-8.2 — Calculator Events',
    title: 'Create GTM GA4 Event Tags (Calculators)',
    run: async (progress) => {
      stepHeader(11, 18, 'Create GA4 Event Tags (Calculators)', 'US-8.2 Manual Step 2.7–2.9');
      instruction('In GTM → Tags → New (repeat 3 times):');
      info('Tag 1: "GA4 - calculator_started"');
      info('   Type: GA4 Event | Config: GA4-Configuration | Event: calculator_started');
      info('   Params: calculator_name → {{DLV - calculator_name}}');
      info('   Trigger: Custom Event - calculator_started\n');
      info('Tag 2: "GA4 - calculator_result_viewed"');
      info('   Type: GA4 Event | Config: GA4-Configuration | Event: calculator_result_viewed');
      info('   Params: calculator_name, province, income_range (all → corresponding DLVs)');
      info('   Trigger: Custom Event - calculator_result_viewed\n');
      info('Tag 3: "GA4 - calculator_result_emailed"');
      info('   Type: GA4 Event | Config: GA4-Configuration | Event: calculator_result_emailed');
      info('   Params: calculator_name → {{DLV - calculator_name}}');
      info('   Trigger: Custom Event - calculator_result_emailed');
      await pressEnterToContinue();
    }
  },

  {
    id: 'ga4-custom-dimensions-calculators',
    phase: 'US-8.2 — Calculator Events',
    title: 'Register Custom Dimensions in GA4 (Calculators)',
    run: async (progress) => {
      stepHeader(12, 18, 'Register Custom Dimensions in GA4', 'US-8.2 Manual Step 2.11');
      instruction('GA4 → Admin → Custom Definitions → Custom Dimensions → Create (3 times):');
      info('1. Name="Calculator Name" | Scope=Event | Event param="calculator_name"');
      info('2. Name="Province"        | Scope=Event | Event param="province"');
      info('3. Name="Income Range"    | Scope=Event | Event param="income_range"');
      link('https://analytics.google.com');
      openUrl('https://analytics.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'gtm-publish-v2',
    phase: 'US-8.2 — Calculator Events',
    title: 'Publish GTM Container v2',
    run: async (progress) => {
      stepHeader(13, 18, 'Publish GTM Container — Version 2', 'US-8.2 Manual Step 2.12');
      instruction('Preview mode: test calculator_started and calculator_result_viewed on /calculators/tfsa-vs-rrsp');
      info('Verify income_range shows BINNED value (e.g. $40K–$60K), not a raw number');
      instruction('GTM → Submit → Version Name: "v2 - Calculator Events" → Publish');
      await pressEnterToContinue();
    }
  },

  // ─── US-8.3 PHASE 3 ────────────────────────────────────────────────────────

  {
    id: 'gtm-checklist-newsletter-triggers',
    phase: 'US-8.3 — Checklist & Newsletter',
    title: 'Create GTM Triggers for Checklist & Newsletter',
    run: async (progress) => {
      stepHeader(14, 18, 'Create GTM Custom Event Triggers (Checklist & Newsletter)', 'US-8.3 Manual Step 3.1–3.4');
      warning('Make sure Script 3 has been run and developer has deployed the patches\n');
      instruction('GTM → Triggers → New (repeat 4 times):');
      info('Trigger 1: "Custom Event - checklist_item_checked"   | Event="checklist_item_checked"');
      info('Trigger 2: "Custom Event - checklist_milestone_reached" | Event="checklist_milestone_reached"');
      info('Trigger 3: "Custom Event - newsletter_signup"        | Event="newsletter_signup"');
      info('Trigger 4: "Custom Event - checklist_completed"      | Event="checklist_completed"');
      info('\nAlso create Variables → DLV (5 new ones):');
      info('DLV - item_id | DLV - item_period | DLV - action | DLV - milestone_percent | DLV - signup_placement');
      info('\nAlso create 4 Tags:');
      info('"GA4 - checklist_item_checked"    → params: item_id, item_period, action');
      info('"GA4 - checklist_milestone_reached" → params: milestone_percent');
      info('"GA4 - newsletter_signup"          → params: signup_placement');
      info('"GA4 - checklist_completed"        → no extra params, mark as conversion');
      link('https://tagmanager.google.com');
      openUrl('https://tagmanager.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'ga4-conversions',
    phase: 'US-8.3 — Checklist & Newsletter',
    title: 'Mark Conversions in GA4',
    run: async (progress) => {
      stepHeader(15, 18, 'Mark GA4 Conversion Events', 'US-8.3 Manual Step 3.14–3.16');
      warning('Events must have fired at least once before they appear in GA4 Events list.\n');
      instruction('GA4 → Admin → Events → find each event → toggle "Mark as conversion"');
      info('✅ newsletter_signup       → Mark as conversion');
      info('✅ calculator_result_emailed → Mark as conversion');
      info('✅ checklist_completed     → Mark as conversion');
      instruction('\nGA4 → Admin → Custom Definitions → Custom Dimensions → Create (5 more):');
      info('Checklist Item ID | Checklist Item Period | Checklist Action | Milestone Percent | Signup Placement');
      link('https://analytics.google.com');
      openUrl('https://analytics.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'gtm-publish-v3',
    phase: 'US-8.3 — Checklist & Newsletter',
    title: 'Publish GTM Container v3',
    run: async (progress) => {
      stepHeader(16, 18, 'Publish GTM Container — Version 3', 'US-8.3 Manual Step 3.18');
      instruction('Preview: check checklist item → verify checklist_item_checked in DebugView');
      instruction('Preview: submit newsletter form → verify newsletter_signup with correct placement');
      instruction('GTM → Submit → Version Name: "v3 - Checklist & Newsletter Events" → Publish');
      await pressEnterToContinue();
    }
  },

  // ─── US-8.4 PHASE 4 ────────────────────────────────────────────────────────

  {
    id: 'ga4-exploration-dashboard',
    phase: 'US-8.4 — Dashboard',
    title: 'Create GA4 Exploration Dashboard',
    run: async (progress) => {
      stepHeader(17, 18, 'Create GA4 Exploration Dashboard', 'US-8.4 Manual Step 4.1');
      warning('Wait 48–72 hours after going live before this step — you need data first.\n');
      instruction('GA4 → Explore → Blank → Name: "Maple Insight — Post-Launch Overview"');
      info('Create 7 tabs as defined in US-8.4-Analytics-Dashboard-Cadence.md:');
      info('  Tab 1: Traffic Sources       | Rows: source/medium  | Values: Sessions, Bounce rate');
      info('  Tab 2: Top Landing Pages     | Rows: landing page   | Values: Sessions, Duration');
      info('  Tab 3: Calculator Usage      | Rows: Calculator Name | Values: calculator_result_viewed count');
      info('  Tab 4: Newsletter by Placement | Rows: signup_placement | Values: newsletter_signup count');
      info('  Tab 5: Checklist Funnel      | Funnel Exploration — see spec for steps');
      info('  Tab 6: Affiliate Links       | Rows: event=click, outbound=true | Link URL');
      info('  Tab 7: Device Split          | Rows: device category | Values: key event counts');
      instruction('\nAlso create the weekly drop alert:');
      info('GA4 → Admin → Custom Insights → Create');
      info('Name: "Weekly Session Drop Alert" | Sessions drops >30% | Notify: roycetonis@gmail.com');
      link('https://analytics.google.com/analytics/web/#/p/explorations');
      openUrl('https://analytics.google.com');
      await pressEnterToContinue();
    }
  },

  {
    id: 'setup-review-cadence',
    phase: 'US-8.4 — Dashboard',
    title: 'Set Up Review Calendar Reminders',
    run: async (progress) => {
      stepHeader(18, 18, 'Set Up Review Cadence', 'US-8.4 Manual Step 4.4–4.5');
      instruction('Add these recurring calendar reminders in Google Calendar:');
      info('Weekly (Weeks 1–4): "Maple Insight — Analytics Weekly Review" | 30 min');
      info('Monthly (from Week 5): "Maple Insight — Analytics Monthly Review" | 45 min');
      link('https://calendar.google.com');
      openUrl('https://calendar.google.com');
      await pressEnterToContinue();
    }
  },

];

// ── Main flow ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--reset')) {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    console.log(c(GREEN, '\n  Progress reset. Starting fresh.\n'));
  }

  const progress = loadProgress();

  if (args.includes('--status')) {
    header('Setup Progress Status');
    const done = progress.completed.length;
    const total = STEPS.length;
    console.log(`  Completed: ${c(GREEN, `${done} / ${total}`)} steps\n`);
    for (const step of STEPS) {
      const isDone = progress.completed.includes(step.id);
      console.log(`  ${isDone ? c(GREEN,'✅') : c(DIM,'○')} ${c(DIM, step.phase)} — ${step.title}`);
    }
    if (progress.ids && Object.keys(progress.ids).length > 0) {
      console.log(`\n  Saved IDs:`);
      for (const [k, v] of Object.entries(progress.ids)) {
        console.log(`    ${c(CYAN, k)}: ${v}`);
      }
    }
    rl.close();
    return;
  }

  if (args.includes('--export-ids')) {
    header('Saved IDs');
    if (!progress.ids || Object.keys(progress.ids).length === 0) {
      console.log('  No IDs saved yet. Complete setup steps to save your GTM and GA4 IDs.\n');
    } else {
      for (const [k, v] of Object.entries(progress.ids)) {
        console.log(`  ${c(CYAN, k.padEnd(25))} ${v}`);
      }
    }
    rl.close();
    return;
  }

  header(`Maple Insight — GTM & GA4 Setup Guide`);
  console.log(`  Account:  ${c(CYAN, ACCOUNT_EMAIL)}`);
  console.log(`  Site:     ${c(CYAN, 'mapleinsight.ca')}`);
  console.log(`  Progress: ${c(GREEN, `${progress.completed.length} / ${STEPS.length}`)} steps complete`);

  if (progress.completed.length > 0) {
    console.log(`\n  ${c(GREEN, '✅')} Resuming from where you left off.`);
    console.log(`  ${c(DIM, '   Completed steps will be skipped automatically.')}`);
  }

  console.log(`\n  ${c(YELLOW, '▸')} Progress is saved to: ${c(DIM, '.analytics-setup-progress.json')}`);
  console.log(`  ${c(YELLOW, '▸')} Stop anytime with Ctrl+C — resume by running this script again.`);
  console.log(`  ${c(YELLOW, '▸')} Run with --status to see progress, --export-ids to see saved IDs.\n`);

  // Group steps by phase for display
  let currentPhase = '';

  for (const step of STEPS) {
    if (step.phase !== currentPhase) {
      currentPhase = step.phase;
      console.log(`\n  ${c(BOLD + YELLOW, `── ${currentPhase} ──`)}`);
    }

    const isDone = progress.completed.includes(step.id);
    console.log(`  ${isDone ? c(GREEN,'✅') : c(DIM,'○')} ${step.title}`);
  }

  const remaining = STEPS.filter(s => !progress.completed.includes(s.id));
  if (remaining.length === 0) {
    console.log(`\n  ${c(GREEN + BOLD, '🎉 All steps complete! Your analytics setup is done.')}`);
    console.log(`\n  Run ${c(CYAN, 'node scripts/analytics/4-setup-guide.js --export-ids')} to see all saved IDs.\n`);
    rl.close();
    return;
  }

  console.log(`\n  ${remaining.length} step(s) remaining.\n`);
  const start = await confirm(`Start (or resume) setup now?`);
  if (!start) { rl.close(); return; }

  for (const step of STEPS) {
    await runStep(step, progress);
  }

  header('Setup Complete! 🎉');
  console.log(`  All ${STEPS.length} steps complete.\n`);
  console.log('  Your Saved IDs:');
  for (const [k, v] of Object.entries(progress.ids || {})) {
    console.log(`    ${c(CYAN, k.padEnd(25))} ${v}`);
  }
  console.log(`\n  ${c(GREEN, '▸')} GA4 data will begin flowing immediately.`);
  console.log(`  ${c(GREEN, '▸')} Allow 24–48h for standard reports to populate.`);
  console.log(`  ${c(GREEN, '▸')} Check GA4 DebugView for real-time event confirmation.\n`);

  rl.close();
}

main().catch(err => {
  console.error(c(RED, `\nUnexpected error: ${err.message}`));
  rl.close();
  process.exit(1);
});
