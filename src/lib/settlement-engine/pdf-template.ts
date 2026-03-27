/**
 * Settlement Planner — PDF HTML Template (US-14.1)
 *
 * Generates a self-contained HTML document rendered by headless Chromium.
 *
 * Client PDF  (mode = 'client'):    Page 1 (snapshot) + Page 2 (breakdown)
 * Consultant PDF (mode = 'consultant'): adds Pages 3–5 (advisory sections)
 *
 * Uses DM Serif Display + DM Sans via Google Fonts CDN.
 * All sections are pure functions over MapleReportPackage — no side effects.
 */

import type { MapleReportPackage } from './export'
import type { ConsultantAdvisory } from './consultant-advisory'
import type { TimelineItem }       from './narrative'
import type { DataSource }         from './types'
import { generateChecklist }       from './checklist'

// ─── Formatters ───────────────────────────────────────────────────────────────

function money(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
  }).format(n)
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') : ''
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const PATHWAY_LABELS: Record<string, string> = {
  express_entry: 'Express Entry', pnp: 'Provincial Nominee Program',
  study_permit: 'Study Permit', work_permit: 'Work Permit',
  family: 'Family Sponsorship', refugee: 'Refugee Protection', other: 'Other',
}

const HOUSING_LABELS: Record<string, string> = {
  studio: 'Studio', '1br': '1-Bedroom', '2br': '2-Bedroom',
  'shared-room': 'Shared Room', 'on-campus': 'On-Campus', homestay: 'Homestay',
  'staying-family': 'Staying with Family',
}

const JOB_LABELS: Record<string, string> = {
  secured_30: 'Job Secured', offer_30_90: 'Offer in Hand',
  no_offer: 'No Offer Yet', student: 'Full-Time Student',
}

const SEV_COLOR: Record<string, string> = {
  critical: '#B91C1C', high: '#B91C1C', medium: '#92400E', low: '#1D4ED8',
}
const SEV_BG: Record<string, string> = {
  critical: '#FEE2E2', high: '#FEE2E2', medium: '#FEF3C7', low: '#DBEAFE',
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');

@page { size: letter; margin: 0; }
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  font-size: 9.5pt;
  color: #374151;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  width: 8.5in;
  padding: 0;
  page-break-after: always;
  background: #ffffff;
}
.page:last-child { page-break-after: avoid; }

/* ── Header ── */
.page-header {
  background: #1B4F4A;
  color: #ffffff;
  padding: 14px 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header-title {
  font-family: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  font-size: 15pt;
  letter-spacing: -0.01em;
}
.page-header-consultant { font-size: 11pt; font-weight: 600; }
.page-header-sub { font-size: 8.5pt; opacity: 0.75; margin-top: 2px; }

.page-content { padding: 22px 44px 44px; }

/* ── Typography ── */
h2 {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 13pt;
  color: #1B4F4A;
  margin-bottom: 10px;
}
h3 {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 11pt;
  color: #1B4F4A;
  margin-bottom: 8px;
}
h4 { font-size: 9.5pt; font-weight: 700; color: #1B4F4A; margin-bottom: 6px; }

.section { margin-bottom: 20px; }
.divider { border: none; border-top: 1px solid #E5E7EB; margin: 18px 0; }

/* ── Badge ── */
.badge {
  display: inline-block;
  padding: 1.5px 6px;
  border-radius: 3px;
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Client summary ── */
.summary-bar {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-bottom: 16px;
  font-size: 9pt;
}
.summary-bar span { color: #6B7280; }
.summary-bar strong { color: #111827; }

/* ── Metrics ── */
.metric-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.metric-tile {
  flex: 1;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 11px 14px;
  border-top: 3px solid #1B4F4A;
}
.metric-label { font-size: 7.5pt; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; }
.metric-value {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 16pt;
  color: #1B4F4A;
  margin: 2px 0 1px;
  line-height: 1;
}
.metric-sub { font-size: 7.5pt; color: #9CA3AF; }

/* ── Gap card ── */
.gap-card {
  border-radius: 7px;
  padding: 11px 14px;
  margin-bottom: 16px;
  border-left: 4px solid;
}
.gap-card.deficit { background: #FEF2F2; border-color: #FCA5A5; }
.gap-card.ok      { background: #F0FDF4; border-color: #86EFAC; }
.gap-title  { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 3px; }
.gap-amount { font-family: 'DM Serif Display', Georgia, serif; font-size: 19pt; line-height: 1.1; margin-bottom: 4px; }
.gap-text   { font-size: 8.5pt; line-height: 1.5; }

/* ── Two columns ── */
.two-col { display: flex; gap: 16px; }
.two-col > * { flex: 1; min-width: 0; }

/* ── Risks & actions ── */
.risk-item { margin-bottom: 10px; }
.risk-title { font-size: 9.5pt; font-weight: 700; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.risk-desc { font-size: 8.5pt; color: #6B7280; margin-top: 2px; line-height: 1.4; }

.action-item { display: flex; gap: 7px; margin-bottom: 9px; align-items: flex-start; }
.action-num {
  width: 18px; height: 18px;
  background: #1B4F4A; color: #fff;
  border-radius: 50%; font-size: 8pt; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.action-title { font-size: 9.5pt; font-weight: 700; }
.action-desc  { font-size: 8.5pt; color: #6B7280; margin-top: 2px; line-height: 1.4; }

/* ── Tables ── */
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
th {
  background: #1B4F4A; color: #fff;
  text-align: left; padding: 5px 9px;
  font-size: 8pt; font-weight: 600;
}
td { padding: 4px 9px; border-bottom: 1px solid #F3F4F6; }
tr:last-child td { border-bottom: none; font-weight: 700; background: #F9FAFB; }

/* ── Checklist ── */
.period-heading {
  font-size: 9.5pt; font-weight: 700; color: #1B4F4A;
  margin: 10px 0 5px;
  display: flex; align-items: center; gap: 5px;
}
.cl-item {
  display: flex; gap: 5px;
  margin-bottom: 3px; align-items: flex-start;
}
.cl-box {
  width: 10px; height: 10px;
  border: 1.5px solid #9CA3AF; border-radius: 2px;
  flex-shrink: 0; margin-top: 2px;
}
.cl-text { font-size: 8.5pt; line-height: 1.4; }

/* ── Scenario notes ── */
.timeline-item { display: flex; gap: 8px; margin-bottom: 7px; font-size: 9pt; }
.timeline-label { font-weight: 700; white-space: nowrap; min-width: 120px; color: #1B4F4A; }

/* ── Disclaimer ── */
.disclaimer { font-size: 7.5pt; color: #9CA3AF; line-height: 1.6; }
.sources { font-size: 8pt; color: #6B7280; margin-bottom: 6px; }

/* ── Footer ── */
.page-footer {
  margin-top: 22px;
  border-top: 1px solid #E5E7EB;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 7.5pt;
  color: #9CA3AF;
}

/* ── Consultant pages ── */
.confidential-banner {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 5px;
  padding: 7px 12px;
  font-size: 8pt;
  color: #7F1D1D;
  text-align: center;
  margin-bottom: 16px;
}

.readiness-block { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 16px; }
.gauge-wrap { flex-shrink: 0; text-align: center; }
.gauge-score { font-family: 'DM Serif Display', serif; font-size: 26pt; line-height: 1; }
.gauge-tier  { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
.gauge-narrative { flex: 1; font-size: 9pt; line-height: 1.6; color: #374151; }

.component-bar-bg { background: #E5E7EB; height: 5px; border-radius: 3px; margin: 3px 0 7px; }
.component-bar    { height: 5px; border-radius: 3px; }
.component-label  { display: flex; justify-content: space-between; font-size: 8pt; }

.scenario-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.scenario-card {
  flex: 0 0 calc(50% - 4px);
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 10px 12px;
}
.scenario-name  { font-size: 9pt; font-weight: 700; color: #1B4F4A; }
.scenario-delta { font-family: 'DM Serif Display', serif; font-size: 13pt; margin: 2px 0 3px; }
.scenario-detail { font-size: 8pt; color: #6B7280; line-height: 1.4; }

.strategy-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #F3F4F6; }
.strategy-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.strategy-title { font-size: 9.5pt; font-weight: 700; }
.strategy-meta  { font-size: 8pt; color: #6B7280; margin: 2px 0 4px; }
.strategy-rationale { font-size: 8.5pt; line-height: 1.4; }

.note-card { border-radius: 5px; padding: 9px 12px; margin-bottom: 9px; border-left: 3px solid; }

.meeting-list { padding-left: 14px; }
.meeting-list li { font-size: 8.5pt; line-height: 1.6; margin-bottom: 2px; }
.flag-item { margin-bottom: 9px; }
.flag-title  { font-size: 9pt; font-weight: 700; color: #B91C1C; }
.flag-detail { font-size: 8.5pt; color: #6B7280; line-height: 1.4; margin-top: 1px; }
.referral-item { margin-bottom: 7px; }
.referral-tool { font-size: 9pt; font-weight: 700; color: #1B4F4A; }
.referral-reason { font-size: 8.5pt; color: #6B7280; line-height: 1.4; }
`

// ─── Section: Page header ─────────────────────────────────────────────────────

function renderPageHeader(
  consultantName: string | null,
  companyName:    string | null,
  generatedAt:    string,
  subtitle?:      string,
): string {
  const date = new Date(generatedAt).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return `
    <div class="page-header">
      <div>
        <div class="page-header-consultant">${esc(consultantName ?? 'Maple Insight')}</div>
        ${companyName ? `<div class="page-header-sub">${esc(companyName)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div class="page-header-title">${subtitle ? esc(subtitle) : 'Canada Settlement Plan'}</div>
        <div class="page-header-sub">${esc(date)}</div>
      </div>
    </div>
  `
}

// ─── Section: Client summary bar ─────────────────────────────────────────────

function renderSummaryBar(pkg: MapleReportPackage): string {
  const { answers } = pkg
  const pathway  = PATHWAY_LABELS[answers.pathway ?? ''] ?? cap(answers.pathway ?? '')
  const city     = cap(answers.city ?? '')
  const province = answers.province ?? ''
  const adults   = answers.adults ?? 1
  const children = answers.children ?? 0
  const hh       = `${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} child${children > 1 ? 'ren' : ''}` : ''}`
  const housing  = HOUSING_LABELS[answers.housing ?? ''] ?? cap(answers.housing ?? '')
  const job      = JOB_LABELS[answers.jobStatus ?? ''] ?? cap(answers.jobStatus ?? '')

  return `
    <div class="summary-bar">
      <span>Pathway: <strong>${esc(pathway)}</strong></span>
      <span>Destination: <strong>${esc(city)}, ${esc(province)}</strong></span>
      <span>Household: <strong>${esc(hh)}</strong></span>
      <span>Housing: <strong>${esc(housing)}</strong></span>
      <span>Employment: <strong>${esc(job)}</strong></span>
    </div>
  `
}

// ─── Section: Metrics row ─────────────────────────────────────────────────────

function renderMetrics(pkg: MapleReportPackage): string {
  const { results } = pkg
  const runway = results.runwayMonths >= 24
    ? '24+ mo' : results.runwayMonths <= 0
    ? 'None' : `${Math.round(results.runwayMonths)} mo`

  return `
    <div class="metric-row">
      <div class="metric-tile">
        <div class="metric-label">One-Time Costs</div>
        <div class="metric-value">${esc(money(results.upfront))}</div>
        <div class="metric-sub">Required at arrival</div>
      </div>
      <div class="metric-tile" style="border-top-color:#B8860B;">
        <div class="metric-label">Monthly Budget</div>
        <div class="metric-value" style="color:#92400E;">${esc(money(results.monthlyMin))}</div>
        <div class="metric-sub">Minimum monthly cost</div>
      </div>
      <div class="metric-tile" style="border-top-color:#2563EB;">
        <div class="metric-label">Savings Runway</div>
        <div class="metric-value" style="color:#1D4ED8;">${esc(runway)}</div>
        <div class="metric-sub">Without income</div>
      </div>
    </div>
  `
}

// ─── Section: Savings gap ─────────────────────────────────────────────────────

function renderGap(pkg: MapleReportPackage): string {
  const { results, narrative } = pkg
  const hasGap = results.savingsGap > 0
  const verdict = narrative?.verdict
    ?? (hasGap
      ? `You need ${money(results.savingsGap)} more before your move.`
      : 'Your savings meet the recommended settlement target.')
  const cls = hasGap ? 'deficit' : 'ok'
  const titleColor = hasGap ? '#B91C1C' : '#166534'
  const amtColor   = hasGap ? '#B91C1C' : '#166534'

  return `
    <div class="gap-card ${cls}">
      <div class="gap-title" style="color:${titleColor};">
        ${hasGap ? 'Savings Gap' : 'Savings Status'}
      </div>
      <div class="gap-amount" style="color:${amtColor};">
        ${hasGap ? esc(money(results.savingsGap)) : '✓ Target Met'}
      </div>
      <div class="gap-text">${esc(verdict)}</div>
    </div>
  `
}

// ─── Section: Top risks + priority actions ────────────────────────────────────

function renderRisksActions(pkg: MapleReportPackage): string {
  const risks = pkg.risks.slice(0, 3)

  const actions: Array<{ title: string; description: string }> = []
  for (const r of risks) {
    if (r.actions.length > 0) actions.push({ title: r.actions[0].title, description: r.actions[0].description })
  }
  if (actions.length === 0 && pkg.narrative?.priorityAction) {
    const pa = pkg.narrative.priorityAction
    actions.push({ title: pa.title, description: pa.description })
  }
  const topActions = actions.slice(0, 3)

  const risksHtml = risks.length > 0
    ? risks.map(r => `
        <div class="risk-item">
          <div class="risk-title">
            <span class="badge" style="background:${SEV_BG[r.severity]};color:${SEV_COLOR[r.severity]};">${cap(r.severity)}</span>
            ${esc(r.title)}
          </div>
          <div class="risk-desc">${esc(r.description)}</div>
        </div>
      `).join('')
    : '<p style="font-size:8.5pt;color:#6B7280;">No significant risks identified.</p>'

  const actionsHtml = topActions.length > 0
    ? topActions.map((a, i) => `
        <div class="action-item">
          <div class="action-num">${i + 1}</div>
          <div>
            <div class="action-title">${esc(a.title)}</div>
            <div class="action-desc">${esc(a.description)}</div>
          </div>
        </div>
      `).join('')
    : '<p style="font-size:8.5pt;color:#6B7280;">No priority actions at this time.</p>'

  return `
    <div class="two-col">
      <div>
        <h3>Top Risks</h3>
        ${risksHtml}
      </div>
      <div>
        <h3>Priority Actions</h3>
        ${actionsHtml}
      </div>
    </div>
  `
}

// ─── Section: Cost breakdown ──────────────────────────────────────────────────

function renderCostBreakdown(pkg: MapleReportPackage): string {
  const { results } = pkg
  const upfrontTotal  = results.upfrontBreakdown.reduce((s, i) => s + i.cad, 0)
  const monthlyTotal  = results.monthlyBreakdown.reduce((s, i) => s + i.cad, 0)

  const upfrontRows = results.upfrontBreakdown
    .filter(i => i.cad > 0)
    .map(i => `<tr><td>${esc(i.label)}</td><td style="text-align:right;">${esc(money(i.cad))}</td></tr>`)
    .join('')

  const monthlyRows = results.monthlyBreakdown
    .filter(i => i.cad > 0)
    .map(i => `<tr><td>${esc(i.label)}</td><td style="text-align:right;">${esc(money(i.cad))}</td></tr>`)
    .join('')

  return `
    <div class="section">
      <h2>Cost Breakdown</h2>
      <div class="two-col">
        <div>
          <h4>One-Time Costs</h4>
          <table>
            <thead><tr><th>Category</th><th style="text-align:right;">CAD</th></tr></thead>
            <tbody>
              ${upfrontRows}
              <tr><td>Total Upfront</td><td style="text-align:right;">${esc(money(upfrontTotal))}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4>Monthly Budget</h4>
          <table>
            <thead><tr><th>Category</th><th style="text-align:right;">CAD/mo</th></tr></thead>
            <tbody>
              ${monthlyRows}
              <tr><td>Total Monthly</td><td style="text-align:right;">${esc(money(monthlyTotal))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

// ─── Section: Scenario notes ──────────────────────────────────────────────────

function renderScenarioNotes(pkg: MapleReportPackage): string {
  const items = pkg.narrative?.timelineGuidance
  if (!items?.length) return ''

  return `
    <div class="section">
      <h3>Timeline Scenarios</h3>
      ${(items as TimelineItem[]).map(item => `
        <div class="timeline-item">
          <span class="timeline-label">${esc(item.label)}</span>
          <span style="color:#374151;">${esc(item.description)}</span>
        </div>
      `).join('')}
    </div>
  `
}

// ─── Section: Checklist ───────────────────────────────────────────────────────

function renderChecklist(pkg: MapleReportPackage): string {
  const { answers, risks } = pkg
  const checklist = generateChecklist(
    {
      pathway:   answers.pathway  ?? '',
      province:  answers.province ?? 'ON',
      city:      answers.city     ?? 'toronto',
      gicStatus: answers.studyPermit?.gicStatus ?? null,
      income:    pkg.narrative?.monthlyIncome ?? 0,
      savings:   pkg.engineInput.liquidSavings,
    },
    risks,
  )

  const groups = [
    { icon: '✈', title: 'Pre-Arrival',   items: checklist.preArrival.items },
    { icon: '🏁', title: 'First Week',    items: checklist.firstWeek.items  },
    { icon: '📋', title: 'First 30 Days', items: checklist.first30.items    },
    { icon: '🎯', title: 'First 90 Days', items: checklist.first90.items    },
  ]

  const col = (grps: typeof groups) => grps.map(g => `
    <div>
      <div class="period-heading"><span>${g.icon}</span> ${esc(g.title)}</div>
      ${g.items.map(it => `
        <div class="cl-item">
          <div class="cl-box"></div>
          <span class="cl-text">${esc(it.label)}</span>
        </div>
      `).join('')}
    </div>
  `).join('')

  return `
    <div class="section">
      <h2>Settlement Checklist</h2>
      <div class="two-col">
        <div>${col(groups.slice(0, 2))}</div>
        <div>${col(groups.slice(2))}</div>
      </div>
    </div>
  `
}

// ─── NEW: Client PDF — Section renderers (US-19.1) ────────────────────────────

/** Short colored text label for a breakdown row (PDF-safe, no hover) */
function sourceTextLabel(
  sourceKey: string | undefined,
  source: string,
  dataSources?: Map<string, DataSource>,
): string {
  if (sourceKey === 'user-input') {
    return `<span style="font-size:7pt;color:#B8860B;font-weight:700;"> [Yours]</span>`
  }
  if (sourceKey && dataSources) {
    const src = dataSources.get(sourceKey)
    if (src) {
      const color = src.category === 'regulatory' ? '#1B7A4A'
        : src.category === 'authority' ? '#2563EB'
        : '#6B7280'
      const abbrev = src.category === 'regulatory' ? 'IRCC'
        : sourceKey.startsWith('cmhc') ? 'CMHC'
        : sourceKey.startsWith('transit') ? 'Transit'
        : 'Est.'
      return `<span style="font-size:7pt;color:${color};font-weight:700;"> [${esc(abbrev)}]</span>`
    }
  }
  const MAP: Record<string, string> = {
    ircc: 'IRCC', cmhc: 'CMHC', estimate: 'Est.', constant: 'Est.',
    provincial: 'Prov.', bank: 'Bank', 'national-average': 'Avg.',
  }
  const lbl = MAP[source] ?? source
  return `<span style="font-size:7pt;color:#9CA3AF;"> [${esc(lbl)}]</span>`
}

/** Compliance status card — shown on Page 1 for study permit or EE/PNP pathways */
function renderComplianceCard(pkg: MapleReportPackage): string {
  const { results, engineInput, answers } = pkg
  // answers.pathway uses underscores ('study_permit'), engineInput.pathway uses hyphens ('study-permit')
  const pathway = (answers.pathway ?? engineInput.pathway ?? '').replace(/_/g, '-')
  const savings = engineInput.liquidSavings

  if (pathway === 'study-permit' && results.irccCompliance) {
    const { required, compliant, shortfall } = results.irccCompliance
    const surplus = savings - required
    const bg = compliant ? '#ECFDF5' : '#FEF2F2'
    const border = compliant ? '#1B7A4A' : '#FCA5A5'
    const color = compliant ? '#1B7A4A' : '#B91C1C'
    const headline = compliant ? '✓ Meets Requirement' : '✗ Does Not Meet Requirement'
    const detail = compliant
      ? `Your savings of ${money(savings)} exceed the IRCC minimum of ${money(required)} by ${money(surplus)}`
      : `Shortfall of ${money(shortfall)} — you need ${money(required)} to meet IRCC proof-of-funds requirements`
    return `
      <div style="background:${bg};border:2px solid ${border};border-radius:10px;padding:14px 20px;margin-bottom:14px;text-align:center;">
        <div style="font-size:7.5pt;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">IRCC Study Permit — Proof of Funds</div>
        <div style="font-family:'DM Serif Display',Georgia,serif;font-size:17pt;color:${color};margin-bottom:4px;">${esc(headline)}</div>
        <div style="font-size:9pt;color:#374151;">${esc(detail)}</div>
        <div style="font-size:7.5pt;color:#9CA3AF;margin-top:4px;">Based on IRCC proof-of-funds table effective September 2025</div>
      </div>
    `
  }

  const isEEorPNP = ['express-entry-fsw', 'express-entry-fstp', 'pnp'].includes(pathway)
  if (isEEorPNP && results.complianceRequirement) {
    const required = results.complianceRequirement
    const compliant = savings >= required
    const surplus = savings - required
    const bg = compliant ? '#ECFDF5' : '#FEF2F2'
    const border = compliant ? '#1B7A4A' : '#FCA5A5'
    const color = compliant ? '#1B7A4A' : '#B91C1C'
    const headline = compliant ? '✓ Settlement Funds: Compliant' : '✗ Settlement Funds: Below Minimum'
    const detail = compliant
      ? `Your savings of ${money(savings)} exceed the IRCC minimum of ${money(required)} by ${money(surplus)}`
      : `IRCC requires ${money(required)} — you need ${money(Math.abs(surplus))} more`
    return `
      <div style="background:${bg};border:2px solid ${border};border-radius:10px;padding:14px 20px;margin-bottom:14px;text-align:center;">
        <div style="font-size:7.5pt;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">IRCC Settlement Funds Requirement</div>
        <div style="font-family:'DM Serif Display',Georgia,serif;font-size:17pt;color:${color};margin-bottom:4px;">${esc(headline)}</div>
        <div style="font-size:9pt;color:#374151;">${esc(detail)}</div>
        <div style="font-size:7.5pt;color:#9CA3AF;margin-top:4px;">Based on IRCC proof-of-funds table effective July 2025</div>
      </div>
    `
  }

  return ''
}

/** 4 metric tiles — upfront / monthly / safe target / runway */
function renderClientMetrics(pkg: MapleReportPackage): string {
  const { results } = pkg
  const runway = results.runwayMonths >= 24
    ? '24+ mo' : results.runwayMonths <= 0
    ? 'None' : `${Math.round(results.runwayMonths)} mo`

  const tile = (label: string, value: string, sub: string, color: string) => `
    <div style="flex:1 1 120px;background:#fff;border-radius:10px;border:1px solid #E5E7EB;border-left:4px solid ${color};padding:11px 13px;">
      <div style="font-size:7pt;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">${esc(label)}</div>
      <div style="font-family:'DM Serif Display',Georgia,serif;font-size:18pt;color:#1B4F4A;line-height:1.1;">${esc(value)}</div>
      <div style="font-size:7.5pt;color:#6B7280;margin-top:2px;">${esc(sub)}</div>
    </div>
  `

  return `
    <div style="display:flex;gap:9px;margin-bottom:13px;flex-wrap:wrap;">
      ${tile('Upfront Costs',  money(results.upfront),            'One-time setup',        '#2563EB')}
      ${tile('Monthly Min.',   money(results.monthlyMin),         'Recurring expenses',     '#9333EA')}
      ${tile('Safe Target',    money(results.safeSavingsTarget),  'Recommended total',      '#B8860B')}
      ${tile('Runway',         runway,                            'Without income',         '#C41E3A')}
    </div>
  `
}

/** Savings gap visualizer with progress bar */
function renderClientGap(pkg: MapleReportPackage): string {
  const { results, engineInput } = pkg
  const hasGap = results.savingsGap > 0
  const savings = engineInput.liquidSavings
  const target  = results.safeSavingsTarget
  const pct     = target > 0 ? Math.min(100, Math.round((savings / target) * 100)) : 100

  if (hasGap) {
    return `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:13px 16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13pt;font-weight:700;color:#B91C1C;">Savings Gap: ${esc(money(results.savingsGap))}</span>
          <span style="font-size:8pt;color:#6B7280;">Your savings cover ${pct}% of the safe target</span>
        </div>
        <div style="height:9px;background:#FECACA;border-radius:5px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:#1B7A4A;border-radius:5px;"></div>
        </div>
        <div style="margin-top:6px;font-size:8.5pt;color:#374151;">
          You have <strong>${esc(money(savings))}</strong> — safe target is <strong>${esc(money(target))}</strong>.
        </div>
      </div>
    `
  }

  return `
    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:13px 16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13pt;font-weight:700;color:#166534;">✓ Target Met</span>
        <span style="font-size:8pt;color:#6B7280;">Your savings cover ${pct}% of the safe target</span>
      </div>
      <div style="height:9px;background:#BBF7D0;border-radius:5px;overflow:hidden;">
        <div style="width:${Math.min(100, pct)}%;height:100%;background:#1B7A4A;border-radius:5px;"></div>
      </div>
      <div style="margin-top:6px;font-size:8.5pt;color:#374151;">
        You have <strong>${esc(money(savings))}</strong> — safe target is <strong>${esc(money(target))}</strong>.
      </div>
    </div>
  `
}

/** Top 3 risk flags as dot + text (Page 1 compact view) */
function renderClientRiskFlags(pkg: MapleReportPackage): string {
  const risks = pkg.risks.slice(0, 3)
  if (!risks.length) return ''

  const dotColor: Record<string, string> = {
    critical: '#B91C1C', high: '#B91C1C', medium: '#B8860B', low: '#1B7A4A',
  }

  return `
    <div style="margin-top:12px;">
      <div style="font-size:8.5pt;font-weight:700;color:#374151;margin-bottom:7px;">Key Risk Flags</div>
      ${risks.map(r => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="width:8px;height:8px;min-width:8px;border-radius:50%;background:${dotColor[r.severity] ?? '#6B7280'};display:inline-block;"></span>
          <span style="font-size:8.5pt;color:#374151;">${esc(r.title)}</span>
        </div>
      `).join('')}
    </div>
  `
}

/** Compact side-by-side breakdown tables for Page 2 */
function renderClientBreakdown(pkg: MapleReportPackage, dataSources?: Map<string, DataSource>): string {
  const { results } = pkg
  const MAX_ROWS = 8

  const upfrontItems = results.upfrontBreakdown.filter(i => i.cad > 0).slice(0, MAX_ROWS)
  const monthlyItems = results.monthlyBreakdown.filter(i => i.cad > 0).slice(0, MAX_ROWS)
  const upfrontTotal = results.upfrontBreakdown.reduce((s, i) => s + i.cad, 0)
  const monthlyTotal = results.monthlyBreakdown.reduce((s, i) => s + i.cad, 0)

  const renderRows = (items: typeof upfrontItems) =>
    items.map(i => `
      <tr>
        <td style="padding:5px 10px;border-bottom:1px solid #F3F4F6;font-size:8.5pt;color:#374151;">
          ${esc(i.label)}${sourceTextLabel(i.sourceKey, i.source, dataSources)}
        </td>
        <td style="padding:5px 10px;border-bottom:1px solid #F3F4F6;text-align:right;font-size:8.5pt;font-weight:600;color:#1B4F4A;white-space:nowrap;">
          ${esc(money(i.cad))}
        </td>
      </tr>
    `).join('')

  const tblWrap   = 'border-radius:8px;border:1px solid #E5E7EB;overflow:hidden;flex:1;'
  const headStyle = 'padding:7px 10px;background:#F8FAFC;font-size:8.5pt;font-weight:700;color:#374151;border-bottom:1px solid #E5E7EB;'
  const totStyle  = 'padding:7px 10px;font-size:9pt;font-weight:700;color:#1B4F4A;border-top:2px solid #E5E7EB;background:#F9FAFB;'

  return `
    <div style="margin-bottom:16px;">
      <div style="font-family:'DM Serif Display',Georgia,serif;font-size:13pt;color:#1B4F4A;margin-bottom:10px;">Cost Breakdown</div>
      <div style="display:flex;gap:12px;">
        <div style="${tblWrap}">
          <div style="${headStyle}">One-Time (Upfront)</div>
          <table style="width:100%;border-collapse:collapse;">
            ${renderRows(upfrontItems)}
            <tr>
              <td style="${totStyle}">Total Upfront</td>
              <td style="${totStyle}text-align:right;">${esc(money(upfrontTotal))}</td>
            </tr>
          </table>
        </div>
        <div style="${tblWrap}">
          <div style="${headStyle}">Monthly Budget</div>
          <table style="width:100%;border-collapse:collapse;">
            ${renderRows(monthlyItems)}
            <tr>
              <td style="${totStyle}">Total Monthly</td>
              <td style="${totStyle}text-align:right;">${esc(money(monthlyTotal))}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `
}

/** Top 5 recommended actions for Page 2 */
function renderTopActions(pkg: MapleReportPackage): string {
  const actions: Array<{ title: string; impact?: string }> = []

  for (const r of pkg.risks) {
    for (const a of r.actions) {
      if (actions.length >= 5) break
      const impact = a.impactCAD > 0
        ? `-${money(a.impactCAD)}`
        : a.impactCAD < 0 ? `+${money(Math.abs(a.impactCAD))}` : undefined
      actions.push({ title: a.title, impact: impact ?? undefined })
    }
    if (actions.length >= 5) break
  }

  if (actions.length < 5 && pkg.narrative?.priorityAction) {
    actions.push({ title: pkg.narrative.priorityAction.title })
  }

  if (!actions.length) return ''

  return `
    <div style="margin-bottom:16px;">
      <div style="font-family:'DM Serif Display',Georgia,serif;font-size:13pt;color:#1B4F4A;margin-bottom:10px;">Recommended Actions</div>
      ${actions.slice(0, 5).map((a, i) => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <span style="width:20px;height:20px;min-width:20px;border-radius:6px;background:#1B7A4A1A;color:#1B7A4A;font-size:8pt;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
          <span style="font-size:9pt;color:#374151;flex:1;">${esc(a.title)}</span>
          ${a.impact ? `<span style="font-size:7.5pt;font-weight:700;color:#1B7A4A;background:#ECFDF5;padding:2px 6px;border-radius:4px;white-space:nowrap;">${esc(a.impact)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

/** CTA block — Schedule Your Plan Review */
function renderCTABlock(pkg: MapleReportPackage): string {
  const name    = pkg.consultant?.displayName ?? 'a Maple Insight consultant'
  const company = pkg.consultant?.companyName ?? 'Maple Insight'
  return `
    <div style="padding:18px 22px;border-radius:10px;border:2px solid #C41E3A;background:#FEF2F2;text-align:center;margin-bottom:14px;">
      <div style="font-family:'DM Serif Display',Georgia,serif;font-size:14pt;font-weight:700;color:#C41E3A;margin-bottom:5px;">Schedule Your Plan Review</div>
      <div style="font-size:9pt;color:#374151;margin-bottom:10px;">Discuss this plan with ${esc(name)} at ${esc(company)} to finalise your settlement strategy.</div>
      <div style="display:inline-block;padding:8px 24px;background:#C41E3A;color:#fff;border-radius:7px;font-size:10pt;font-weight:700;">Book a Consultation</div>
    </div>
  `
}

// ─── Section: Disclaimers ─────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  regulatory: '#1B7A4A',
  authority:  '#2563EB',
  estimate:   '#6B7280',
}

function renderDisclaimers(pkg: MapleReportPackage, dataSources?: Map<string, DataSource>): string {
  // Collect unique sourceKeys from the breakdown items
  const uniqueKeys = [...new Set([
    ...pkg.results.upfrontBreakdown.map(i => i.sourceKey),
    ...pkg.results.monthlyBreakdown.map(i => i.sourceKey),
  ])].filter((k): k is string => Boolean(k) && k !== 'user-input')

  let sourcesHtml: string
  if (dataSources && dataSources.size > 0) {
    sourcesHtml = uniqueKeys.map(key => {
      const src = dataSources.get(key)
      if (!src) return ''
      const color = CATEGORY_COLOR[src.category] ?? '#6B7280'
      const verified = src.lastVerified.slice(0, 10)
      return `<div style="margin-bottom:4px;font-size:9.5px;">
        <span style="color:${color};font-weight:700;">[${esc(src.category.toUpperCase())}]</span>
        <strong>${esc(src.name)}</strong>
        — effective ${esc(src.effectiveDate)} · verified ${esc(verified)}
      </div>`
    }).filter(Boolean).join('')
  } else {
    // Fallback: simple list from source field
    const sourceMap: Record<string, string> = {
      ircc: 'IRCC', cmhc: 'CMHC', constant: 'Maple Insight Estimates',
      estimate: 'Maple Insight Estimates', provincial: 'Provincial Government',
      bank: 'Bank', 'national-average': 'Statistics Canada', 'user-input': 'Client Input',
    }
    const sources = [...new Set([
      ...pkg.results.upfrontBreakdown.map(i => i.source),
      ...pkg.results.monthlyBreakdown.map(i => i.source),
    ])].map(s => sourceMap[s] ?? s.toUpperCase())
    sourcesHtml = sources.map(s => `<span style="margin-right:14px;">• ${esc(s)}</span>`).join('')
  }

  return `
    <div class="section">
      <h3>Data Sources &amp; Freshness</h3>
      <div class="sources">${sourcesHtml}</div>
      <div class="disclaimer">
        This report is generated by Maple Insight's Settlement Financial Planner and is intended as a planning
        estimate only. Actual costs may vary significantly based on market conditions. This document does not
        constitute financial, legal, or immigration advice. All immigration cost figures are sourced from IRCC
        published fee schedules. Cost-of-living figures are based on Statistics Canada and Maple Insight's
        proprietary cost models. Engine&nbsp;v${esc(pkg.engineVersion)} · Data&nbsp;v${esc(pkg.dataVersion)}.
      </div>
    </div>
  `
}

// ─── Consultant page helpers ───────────────────────────────────────────────────

function gaugeColor(score: number): string {
  if (score >= 8) return '#1B7A4A'
  if (score >= 6) return '#2563EB'
  if (score >= 4) return '#B8860B'
  return '#B91C1C'
}

function renderReadinessGauge(advisory: ConsultantAdvisory): string {
  const { readiness } = advisory
  const r      = 65
  const total  = Math.PI * r          // ≈ 204.2
  const filled = (readiness.score / 10) * total
  const color  = readiness.color ?? gaugeColor(readiness.score)
  const cx     = 80, cy = 75

  const gaugeSvg = `
    <svg width="160" height="85" viewBox="0 0 160 85" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
            fill="none" stroke="#E5E7EB" stroke-width="12" stroke-linecap="round"/>
      <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
            fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${filled.toFixed(1)} ${total.toFixed(1)}"/>
      <text x="${cx}" y="${cy - 4}" text-anchor="middle"
            font-family="DM Serif Display, Georgia, serif" font-size="22" fill="${color}"
            font-weight="400">${readiness.score.toFixed(1)}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle"
            font-family="DM Sans, Arial, sans-serif" font-size="7" fill="#6B7280"
            font-weight="700" letter-spacing="1">${esc(readiness.tier.toUpperCase())}</text>
    </svg>
  `

  const componentBars = readiness.components.map(c => `
    <div style="margin-bottom:6px;">
      <div class="component-label">
        <span>${esc(c.label)}</span>
        <span style="font-weight:700;">${c.score.toFixed(1)}<span style="color:#9CA3AF;">/10</span></span>
      </div>
      <div class="component-bar-bg">
        <div class="component-bar" style="width:${(c.score / 10 * 100).toFixed(0)}%;background:${gaugeColor(c.score)};"></div>
      </div>
    </div>
  `).join('')

  return `
    <div class="section">
      <h2>Financial Readiness Assessment</h2>
      <div class="readiness-block">
        <div class="gauge-wrap">
          ${gaugeSvg}
          <div style="font-size:7.5pt;color:#6B7280;margin-top:2px;">out of 10.0</div>
        </div>
        <div style="flex:1;">
          <p style="font-size:9pt;line-height:1.6;margin-bottom:10px;">${esc(readiness.narrative)}</p>
          ${componentBars}
        </div>
      </div>
    </div>
  `
}

function renderScenarios(advisory: ConsultantAdvisory): string {
  const scenarios = advisory.scenarios.slice(0, 4)
  if (!scenarios.length) return ''

  return `
    <div class="section">
      <h2>Alternative Scenario Analysis</h2>
      <div class="scenario-grid">
        ${scenarios.map(s => {
          const isPos = s.positive
          const deltaColor = isPos ? '#166534' : '#B91C1C'
          return `
            <div class="scenario-card">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:12pt;">${esc(s.icon)}</span>
                <span class="scenario-name">${esc(s.name)}</span>
              </div>
              <div class="scenario-delta" style="color:${deltaColor};">${esc(s.deltaLabel)}</div>
              <div style="font-size:8pt;color:#6B7280;margin-bottom:4px;">${esc(s.change)}</div>
              <div class="scenario-detail">${esc(s.details)}</div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function renderStrategies(advisory: ConsultantAdvisory): string {
  if (!advisory.strategies.length) return ''

  const diffColor: Record<string, string> = {
    Easy: '#166534', Moderate: '#92400E', Hard: '#B91C1C',
  }

  return `
    <div class="section">
      <h2>Gap Closure Strategies</h2>
      ${advisory.strategies.map((s, i) => `
        <div class="strategy-item">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:flex-start;gap:7px;flex:1;">
              <div class="action-num" style="margin-top:1px;">${i + 1}</div>
              <div>
                <div class="strategy-title">${esc(s.title)}</div>
                <div class="strategy-meta">
                  <span style="color:${diffColor[s.difficulty] ?? '#374151'};font-weight:600;">${esc(s.difficulty)}</span>
                  &nbsp;·&nbsp;${esc(s.timeline)}
                  ${s.impact < 0 ? `&nbsp;·&nbsp;<span style="color:#166534;font-weight:600;">${esc(money(Math.abs(s.impact)))} saved</span>` : ''}
                </div>
                <div class="strategy-rationale">${esc(s.rationale)}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function renderProgramNotes(advisory: ConsultantAdvisory): string {
  if (!advisory.programNotes.length) return ''

  const noteStyle: Record<string, string> = {
    warning:  'background:#FEF3C7;border-color:#F59E0B;',
    info:     'background:#EFF6FF;border-color:#3B82F6;',
    positive: 'background:#F0FDF4;border-color:#22C55E;',
    negative: 'background:#FEF2F2;border-color:#EF4444;',
  }
  const noteHeadingColor: Record<string, string> = {
    warning: '#92400E', info: '#1E40AF', positive: '#166534', negative: '#B91C1C',
  }

  return `
    <div class="section">
      <h2>Program Advisory Notes</h2>
      ${advisory.programNotes.map(n => `
        <div class="note-card" style="${noteStyle[n.severity] ?? noteStyle.info}">
          <div style="font-weight:700;font-size:9.5pt;color:${noteHeadingColor[n.severity] ?? '#1E40AF'};margin-bottom:3px;">
            ${esc(n.title)}
          </div>
          <div style="font-size:8.5pt;line-height:1.5;">${esc(n.content)}</div>
          ${n.source ? `<div style="font-size:7.5pt;color:#9CA3AF;margin-top:4px;">Source: ${esc(n.source)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function renderMeetingGuide(advisory: ConsultantAdvisory): string {
  const { meetingGuide } = advisory

  const talkingPoints = meetingGuide.talkingPoints.length > 0
    ? `<ul class="meeting-list">${meetingGuide.talkingPoints.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '<p style="font-size:8.5pt;color:#6B7280;">No talking points generated.</p>'

  const questions = meetingGuide.questions.length > 0
    ? `<ul class="meeting-list">${meetingGuide.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>`
    : '<p style="font-size:8.5pt;color:#6B7280;">No discovery questions generated.</p>'

  const redFlags = meetingGuide.redFlags.length > 0
    ? meetingGuide.redFlags.map(f => `
        <div class="flag-item">
          <div class="flag-title">⚠ ${esc(f.flag)}</div>
          <div class="flag-detail">${esc(f.detail)}</div>
        </div>
      `).join('')
    : '<p style="font-size:8.5pt;color:#6B7280;">No red flags identified.</p>'

  return `
    <div>
      <div class="section">
        <h2>Meeting Preparation Guide</h2>
        <div class="two-col">
          <div>
            <h3>Talking Points</h3>
            ${talkingPoints}
          </div>
          <div>
            <h3>Discovery Questions</h3>
            ${questions}
          </div>
        </div>
      </div>

      <hr class="divider">

      <div>
        <h3>Red Flags to Address</h3>
        ${redFlags}
      </div>
    </div>
  `
}

// ─── Page builders ────────────────────────────────────────────────────────────

/** Client Page 1: compliance card + 4 metric tiles + gap visualizer + top 3 risk flags */
function buildClientPage1(pkg: MapleReportPackage, totalPages: number): string {
  const { consultant, generatedAt } = pkg
  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt)}
      <div class="page-content">
        ${renderSummaryBar(pkg)}
        ${renderComplianceCard(pkg)}
        ${renderClientMetrics(pkg)}
        ${renderClientGap(pkg)}
        ${renderClientRiskFlags(pkg)}
        <div class="page-footer">
          <span>Maple Insight Settlement Planner</span>
          <span>Page 1 of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

/** Client Page 2: compact breakdown tables + top 5 actions + CTA + disclaimer */
function buildClientPage2(pkg: MapleReportPackage, totalPages: number, dataSources?: Map<string, DataSource>): string {
  const { consultant, generatedAt } = pkg
  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt)}
      <div class="page-content">
        ${renderClientBreakdown(pkg, dataSources)}
        ${renderTopActions(pkg)}
        ${renderCTABlock(pkg)}
        ${renderDisclaimers(pkg, dataSources)}
        <div class="page-footer">
          <span>Maple Insight Settlement Planner · Planning estimate only</span>
          <span>Page 2 of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

/** Client Appendix: full settlement checklist with "Appendix" header */
function buildClientAppendix(pkg: MapleReportPackage, totalPages: number, appendixPageNum: number): string {
  const { consultant, generatedAt, answers, risks } = pkg
  const checklist = generateChecklist(
    {
      pathway:   answers.pathway  ?? '',
      province:  answers.province ?? 'ON',
      city:      answers.city     ?? 'toronto',
      gicStatus: answers.studyPermit?.gicStatus ?? null,
      income:    pkg.narrative?.monthlyIncome ?? 0,
      savings:   pkg.engineInput.liquidSavings,
    },
    risks,
  )

  const groups = [
    { icon: '✈', title: 'Pre-Arrival',   items: checklist.preArrival.items },
    { icon: '🏁', title: 'First Week',    items: checklist.firstWeek.items  },
    { icon: '📋', title: 'First 30 Days', items: checklist.first30.items    },
    { icon: '🎯', title: 'First 90 Days', items: checklist.first90.items    },
  ]

  const col = (grps: typeof groups) => grps.map(g => `
    <div>
      <div class="period-heading"><span>${g.icon}</span> ${esc(g.title)}</div>
      ${g.items.map(it => `
        <div class="cl-item">
          <div class="cl-box"></div>
          <span class="cl-text">${esc(it.label)}</span>
        </div>
      `).join('')}
    </div>
  `).join('')

  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt, 'Settlement Checklist — Appendix')}
      <div class="page-content">
        <div style="display:inline-block;background:#9CA3AF;color:#fff;font-size:8pt;font-weight:700;padding:2px 10px;border-radius:4px;margin-bottom:12px;letter-spacing:0.05em;">APPENDIX</div>
        <h2 style="margin-bottom:14px;">Settlement Checklist</h2>
        <div class="two-col">
          <div>${col(groups.slice(0, 2))}</div>
          <div>${col(groups.slice(2))}</div>
        </div>
        <div class="page-footer">
          <span>Maple Insight Settlement Planner</span>
          <span>Page ${appendixPageNum} of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

function buildPage3Consultant(pkg: MapleReportPackage, advisory: ConsultantAdvisory, totalPages: number): string {
  const { consultant, generatedAt } = pkg
  const p = totalPages - 2   // e.g. page 4 of 6 when totalPages = 6
  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt, 'Consultant Intelligence Report')}
      <div class="page-content">
        <div class="confidential-banner">
          CONFIDENTIAL — FOR CONSULTANT USE ONLY — Do not share with client
        </div>
        ${renderReadinessGauge(advisory)}
        <hr class="divider">
        ${renderScenarios(advisory)}
        <div class="page-footer">
          <span>Maple Insight · Consultant Report — Confidential</span>
          <span>Page ${p} of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

function buildPage4Consultant(pkg: MapleReportPackage, advisory: ConsultantAdvisory, totalPages: number): string {
  const { consultant, generatedAt } = pkg
  const p = totalPages - 1
  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt, 'Consultant Intelligence Report')}
      <div class="page-content">
        <div class="confidential-banner">
          CONFIDENTIAL — FOR CONSULTANT USE ONLY — Do not share with client
        </div>
        ${renderStrategies(advisory)}
        <hr class="divider">
        ${renderProgramNotes(advisory)}
        <div class="page-footer">
          <span>Maple Insight · Consultant Report — Confidential</span>
          <span>Page ${p} of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

function buildPage5Consultant(pkg: MapleReportPackage, advisory: ConsultantAdvisory, totalPages: number): string {
  const { consultant, generatedAt } = pkg
  return `
    <div class="page">
      ${renderPageHeader(consultant?.displayName ?? null, consultant?.companyName ?? null, generatedAt, 'Consultant Intelligence Report')}
      <div class="page-content">
        <div class="confidential-banner">
          CONFIDENTIAL — FOR CONSULTANT USE ONLY — Do not share with client
        </div>
        ${renderMeetingGuide(advisory)}
        <div class="page-footer">
          <span>Maple Insight · Consultant Report — Confidential · Generated ${new Date(generatedAt).toLocaleDateString('en-CA')}</span>
          <span>Page ${totalPages} of ${totalPages}</span>
        </div>
      </div>
    </div>
  `
}

// ─── Public: renderPdfTemplate ────────────────────────────────────────────────

/**
 * Generates a self-contained HTML document for PDF rendering.
 *
 * Client PDF:    Page 1 (metrics/compliance/gap/risks) + Page 2 (breakdown/actions/CTA) + Appendix (checklist)
 * Consultant PDF: client pages + 3 consultant advisory pages
 *
 * @param pkg                   Full MapleReportPackage from generateReportPackage()
 * @param includeConsultantPages  When true, appends Pages 4–6 (consultant advisory)
 * @param dataSources           Optional catalog for source badge labels in breakdown tables
 */
export function renderPdfTemplate(
  pkg: MapleReportPackage,
  includeConsultantPages = false,
  dataSources?: Map<string, DataSource>,
): string {
  const advisory    = pkg.consultantAdvisory
  const hasAdvisory = includeConsultantPages && advisory != null

  // Client: 3 pages (1 + 2 + Appendix). Consultant adds 3 more = 6 total.
  const totalPages = hasAdvisory ? 6 : 3

  const consultantPages = hasAdvisory && advisory
    ? `
        ${buildPage3Consultant(pkg, advisory, totalPages)}
        ${buildPage4Consultant(pkg, advisory, totalPages)}
        ${buildPage5Consultant(pkg, advisory, totalPages)}
      `
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Maple Insight Settlement Plan</title>
  <style>${CSS}</style>
</head>
<body>
  ${buildClientPage1(pkg, totalPages)}
  ${buildClientPage2(pkg, totalPages, dataSources)}
  ${buildClientAppendix(pkg, totalPages, 3)}
  ${consultantPages}
</body>
</html>`
}
