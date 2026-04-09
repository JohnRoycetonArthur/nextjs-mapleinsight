'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AirplaneTicket,
  Analytics,
  ArrowForward,
  Checklist,
  Description,
  Devices,
  Flag,
  Handshake,
  Home,
  IosShare,
  KeyboardArrowDown,
  Lightbulb,
  Mail,
  MenuBook,
  QueryStats,
  Schedule,
  ShieldLock,
  SmartToy,
  Target,
  TaskAlt,
  TrackChanges,
  TrendingUp,
  WorkspacePremium,
} from '@material-symbols-svg/react'
import { ResultsDashboard } from '@/components/settlement-planner/ResultsDashboard'
import { SettlementSessionProvider } from '@/components/settlement-planner/SettlementSessionContext'
import { type ActionPlan, type ActionPlanTask } from '@/lib/settlement-engine/action-plan'
import { VersionStamp } from '@/components/settlement-planner/VersionStamp'

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  red: '#C41E3A', blue: '#2563EB', purple: '#9333EA',
  gray: '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  white: '#FFFFFF', text: '#374151', textDark: '#111827',
  textLight: '#9CA3AF', bg: '#FAFBFC',
}
const FONT = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES = [
  { id: 'pre-arrival', label: 'Pre-Arrival',     icon: '✈️', color: C.accent,  lightColor: '#E8F5EE', subtitle: 'Set yourself up for a smooth landing' },
  { id: 'first-week',  label: 'First Week',      icon: '🏁', color: C.gold,    lightColor: '#FDF6E3', subtitle: 'Hit the ground running' },
  { id: 'first-30',    label: 'First 30 Days',   icon: '📋', color: C.blue,    lightColor: '#EFF6FF', subtitle: 'Build your Canadian foundation' },
  { id: 'first-90',    label: 'First 90 Days',   icon: '🎯', color: C.purple,  lightColor: '#F5F0FF', subtitle: 'Start thriving, not just surviving' },
] as const

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function orderTasksForPhase(tasks: ActionPlanTask[], originalOrder: Map<string, number>) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    const priorityDelta = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    if (priorityDelta !== 0) return priorityDelta

    return (originalOrder.get(a.id) ?? 9999) - (originalOrder.get(b.id) ?? 9999)
  })
}

// ─── Preview tasks (empty state) ─────────────────────────────────────────────

const PREVIEW_TASKS = [
  { title: 'Apply for your Social Insurance Number', phase: 'First Week' },
  { title: 'Open a Canadian bank account', phase: 'Pre-Arrival' },
  { title: 'Set up provincial health insurance', phase: 'First 30 Days' },
  { title: 'Start building Canadian credit', phase: 'First 30 Days' },
  { title: 'Open a TFSA savings account', phase: 'First 90 Days' },
]

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const MapleLeafIcon = ({ size = 14, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

const CheckSvg = () => <TaskAlt size={14} color="#fff" aria-hidden="true" />

const BookIcon = () => <MenuBook size={12} color="currentColor" aria-hidden="true" />

const ArrowIcon = ({ s = 10 }: { s?: number }) => <ArrowForward size={s} color="currentColor" aria-hidden="true" />

const ChevronIcon = ({ open }: { open: boolean }) => (
  <KeyboardArrowDown
    size={16}
    color="currentColor"
    aria-hidden="true"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .3s', flexShrink: 0 }}
  />
)

const TargetIcon = () => <Target size={18} color={C.accent} aria-hidden="true" />

const SparkIcon = () => <WorkspacePremium size={14} color="currentColor" aria-hidden="true" />

function PhaseIcon({ phaseId, color, size = 18 }: { phaseId: ActionPlanTask['phase']; color: string; size?: number }) {
  if (phaseId === 'pre-arrival') return <AirplaneTicket size={size} color={color} aria-hidden="true" />
  if (phaseId === 'first-week') return <Flag size={size} color={color} aria-hidden="true" />
  if (phaseId === 'first-30') return <Checklist size={size} color={color} aria-hidden="true" />
  return <Target size={size} color={color} aria-hidden="true" />
}

function ValuePropIcon({ title }: { title: string }) {
  if (title === 'Personalized') return <Target size={18} color={C.forest} aria-hidden="true" />
  if (title === 'Track progress') return <TrackChanges size={18} color={C.forest} aria-hidden="true" />
  if (title === 'Linked guides') return <MenuBook size={18} color={C.forest} aria-hidden="true" />
  return <ShieldLock size={18} color={C.forest} aria-hidden="true" />
}

function CompletionLinkIcon({ label }: { label: string }) {
  if (label === 'Start investing') return <TrendingUp size={14} color={C.textDark} aria-hidden="true" />
  if (label === 'Optimize your taxes') return <Description size={14} color={C.textDark} aria-hidden="true" />
  return <Home size={14} color={C.textDark} aria-hidden="true" />
}

function ToolTileIcon({ label }: { label: string }) {
  if (label === 'View Full Report') return <QueryStats size={16} color={C.textDark} aria-hidden="true" />
  if (label === 'Share Plan') return <IosShare size={16} color={C.textDark} aria-hidden="true" />
  if (label === 'Save to Phone') return <Devices size={16} color={C.textDark} aria-hidden="true" />
  return <Mail size={16} color={C.textDark} aria-hidden="true" />
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 80, stroke = 7, color = C.accent }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct === 100 ? 'url(#planGrad)' : color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      <defs>
        <linearGradient id="planGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.accent} /><stop offset="50%" stopColor={C.blue} /><stop offset="100%" stopColor={C.purple} />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    high:   { label: 'High', bg: '#FEF2F2', color: C.red },
    medium: { label: 'Med',  bg: '#FDF6E3', color: C.gold },
    low:    { label: 'Low',  bg: C.lightGray, color: C.gray },
  }
  const c = cfg[priority] ?? cfg.medium
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 4, padding: '2px 6px', fontFamily: FONT }}>
      {c.label}
    </span>
  )
}

// ─── Task Item (phase section) ────────────────────────────────────────────────

function TaskItem({
  task,
  phaseColor,
  onToggle,
  movement,
}: {
  task: ActionPlanTask
  phaseColor: string
  onToggle: (id: string) => void
  movement?: 'up' | 'down' | null
}) {
  const [hov, setHov] = useState(false)
  const done = task.completed
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '14px 0',
      borderBottom: `1px solid ${C.lightGray}`,
      alignItems: 'flex-start',
      opacity: done ? 0.55 : 1,
      transition: 'opacity .3s',
      animation: movement === 'up'
        ? 'taskBubbleUp 0.4s cubic-bezier(0.34,1.56,0.64,1)'
        : movement === 'down'
          ? 'taskSinkDown 0.4s cubic-bezier(0.4,0,0.2,1)'
          : 'none',
    }}>
      <button
        role="checkbox" aria-checked={done} aria-label={task.title}
        onClick={() => onToggle(task.id)}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          width: 26, height: 26, minWidth: 26, borderRadius: 8,
          border: done ? 'none' : `2px solid ${hov ? phaseColor : '#D1D5DB'}`,
          background: done ? phaseColor : hov ? `${phaseColor}08` : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all .2s', padding: 0, marginTop: 1,
          transform: done ? 'scale(1)' : hov ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {done && <CheckSvg />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: done ? C.textLight : C.textDark, lineHeight: 1.35, textDecoration: done ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && !done && (
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray, margin: '0 0 4px', lineHeight: 1.5 }}>{task.description}</p>
        )}
        {task.whyItMatters && !done && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, padding: '4px 8px', borderRadius: 6, background: `${C.gold}08`, marginBottom: 6 }}>
            <Lightbulb size={14} color={C.gold} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontFamily: FONT, fontSize: 12, color: C.gold, lineHeight: 1.5, fontWeight: 500 }}>{task.whyItMatters}</span>
          </div>
        )}
        {task.articleSlug && !done && (
          <Link href={`/articles/${task.articleSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: phaseColor, textDecoration: 'none', padding: '3px 10px', borderRadius: 6, background: `${phaseColor}08`, border: `1px solid ${phaseColor}15` }}>
            <BookIcon /> Learn more <ArrowIcon />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Phase Section (accordion) ───────────────────────────────────────────────

function PhaseSection({ phase, tasks, completedCount, onToggleTask, defaultOpen }: {
  phase: typeof PHASES[number]
  tasks: ActionPlanTask[]
  completedCount: number
  onToggleTask: (id: string) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [movementById, setMovementById] = useState<Record<string, 'up' | 'down'>>({})
  const prevOrderRef = useRef<string[]>(tasks.map(task => task.id))

  useEffect(() => {
    const nextOrder = tasks.map(task => task.id)
    const prevOrder = prevOrderRef.current
    const movement: Record<string, 'up' | 'down'> = {}

    nextOrder.forEach((id, nextIndex) => {
      const prevIndex = prevOrder.indexOf(id)
      if (prevIndex === -1 || prevIndex === nextIndex) return
      movement[id] = nextIndex < prevIndex ? 'up' : 'down'
    })

    prevOrderRef.current = nextOrder

    if (Object.keys(movement).length === 0) return

    setMovementById(movement)
    const timeout = setTimeout(() => setMovementById({}), 450)
    return () => clearTimeout(timeout)
  }, [tasks])

  const total = tasks.length
  const allDone = completedCount === total && total > 0
  const phaseId = phase.id as ActionPlanTask['phase']
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${allDone ? phase.color + '30' : C.border}`, background: C.white, overflow: 'hidden', marginBottom: 10, transition: 'border-color .3s' }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ width: '100%', padding: '16px 18px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: allDone ? phase.color : phase.lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background .3s', flexShrink: 0 }}>
          {allDone ? <CheckSvg /> : <PhaseIcon phaseId={phaseId} color={phase.color} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: allDone ? phase.color : C.forest }}>{phase.label}</span>
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.textLight }}>{phase.subtitle}</span>
          </div>
          <div style={{ height: 4, background: C.lightGray, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${total > 0 ? (completedCount / total) * 100 : 0}%`, background: phase.color, borderRadius: 2, transition: 'width .4s ease' }} />
          </div>
        </div>
        <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: allDone ? phase.color : C.textLight, whiteSpace: 'nowrap' }}>{completedCount}/{total}</span>
        <ChevronIcon open={open} />
      </button>
      <div style={{ maxHeight: open ? 9999 : 0, overflow: 'hidden', transition: 'max-height .4s ease' }}>
        <div style={{ padding: '0 18px 14px' }}>
          {tasks.map(t => <TaskItem key={t.id} task={t} phaseColor={phase.color} onToggle={onToggleTask} movement={movementById[t.id]} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() > 0.5 ? 8 : 6,
      round: Math.random() > 0.5,
      color: [C.accent, C.gold, C.blue, C.purple, C.red][Math.floor(Math.random() * 5)],
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
    })), [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: -20,
          width: p.size, height: p.size,
          borderRadius: p.round ? '50%' : 2,
          background: p.color,
          animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ActionPlanPageContentProps {
  initialPlan?: ActionPlan | null
  reportAvailable?: boolean
  onViewFullReport?: () => void
}

function ActionPlanPageContent({
  initialPlan = null,
  reportAvailable = false,
  onViewFullReport,
}: ActionPlanPageContentProps) {
  const router = useRouter()
  const [plan, setPlan] = useState<ActionPlan | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [milestoneLabel, setMilestoneLabel] = useState<string | null>(null)
  const prevPctRef = useRef(0)
  // Track milestones already celebrated (to avoid re-triggering on uncheck/recheck)
  const celebratedRef = useRef<Set<number>>(new Set())

  // ── Load from localStorage ──
  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan)
      const total = initialPlan.tasks.length
      const done = initialPlan.tasks.filter(t => t.completed).length
      prevPctRef.current = total > 0 ? Math.round((done / total) * 100) : 0
      setLoaded(true)
      return
    }

    try {
      const raw = localStorage.getItem('mi_action_plan')
      if (raw) {
        const parsed = JSON.parse(raw) as ActionPlan
        if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.tasks)) {
          setPlan(parsed)
          const total = parsed.tasks.length
          const done = parsed.tasks.filter(t => t.completed).length
          prevPctRef.current = total > 0 ? Math.round((done / total) * 100) : 0
        }
      }
    } catch {
      // private browsing or corrupted data — show empty state
    }
    setLoaded(true)
  }, [initialPlan])

  // ── Derived values ──
  const tasks = plan?.tasks ?? []
  const taskOrder = useMemo(() => new Map(tasks.map((task, index) => [task.id, index])), [tasks])
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const currentPhase = useMemo(() => {
    for (const phase of PHASES) {
      if (tasks.some(t => t.phase === phase.id && !t.completed)) return phase.id
    }
    return PHASES[PHASES.length - 1].id
  }, [tasks])

  const todaysFocus = useMemo(() =>
    orderTasksForPhase(
      tasks.filter(t => t.phase === currentPhase),
      taskOrder,
    ).filter(t => !t.completed).slice(0, 3),
    [currentPhase, taskOrder, tasks])

  const currentPhaseMeta = PHASES.find(phase => phase.id === currentPhase) ?? PHASES[0]

  // ── Persist + milestone check ──
  const toggleTask = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const next = { ...prev, updatedAt: new Date().toISOString(), tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }
      try { localStorage.setItem('mi_action_plan', JSON.stringify(next)) } catch { /* ignore */ }

      const newDone = next.tasks.filter(t => t.completed).length
      const newPct = next.tasks.length > 0 ? Math.round((newDone / next.tasks.length) * 100) : 0
      const oldPct = prevPctRef.current

      const milestones: Array<{ threshold: number; label: string }> = [
        { threshold: 25, label: 'First milestone unlocked!' },
        { threshold: 50, label: 'Halfway milestone unlocked!' },
        { threshold: 75, label: 'Almost there — final stretch!' },
        { threshold: 100, label: 'You\'re fully prepared for Canada!' },
      ]
      for (const m of milestones) {
        if (newPct >= m.threshold && oldPct < m.threshold && !celebratedRef.current.has(m.threshold)) {
          celebratedRef.current.add(m.threshold)
          // Check for reduced motion
          const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (!prefersReduced) setShowConfetti(true)
          setMilestoneLabel(m.label)
          setTimeout(() => { setShowConfetti(false); setMilestoneLabel(null) }, 3000)
          break
        }
      }
      prevPctRef.current = newPct
      return next
    })
  }, [])

  const resetPlan = useCallback(() => {
    if (window.confirm('This will clear all your progress. Are you sure?')) {
      try { localStorage.removeItem('mi_action_plan') } catch { /* ignore */ }
      setPlan(null)
      celebratedRef.current.clear()
      prevPctRef.current = 0
    }
  }, [])

  // ── Focus on the Top 3 animation state ──
  const [departingId, setDepartingId] = useState<string | null>(null)
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const prevFocusRef = useRef<string[]>([])

  useEffect(() => {
    const prevIds = prevFocusRef.current
    const newIds = todaysFocus.map(t => t.id)
    const entering = newIds.find(id => !prevIds.includes(id))
    prevFocusRef.current = newIds
    if (entering && prevIds.length > 0) {
      setEnteringId(entering)
      const t = setTimeout(() => setEnteringId(null), 450)
      return () => clearTimeout(t)
    }
  }, [todaysFocus])

  const handleFocusToggle = useCallback((id: string) => {
    setDepartingId(id)
    setTimeout(() => {
      setDepartingId(null)
      toggleTask(id)
    }, 350)
  }, [toggleTask])

  // ── SSR hydration guard ──
  if (!loaded) return null

  // ═══ EMPTY STATE ═════════════════════════════════════════════════════════════
  if (!plan) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <MapleLeafIcon size={18} color={C.accent} />
              <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.forest }}>Maple Insight</span>
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.forest, margin: '0 0 10px', lineHeight: 1.2 }}>
              Your Settlement Plan
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 16, color: C.gray, margin: 0, lineHeight: 1.6 }}>
              A personalized step-by-step checklist to guide you before, during, and after your move to Canada.
            </p>
          </div>

          {/* Blurred preview card */}
          <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.white, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
            <div style={{ padding: '18px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Checklist size={18} color={C.accent} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.forest }}>Sample Checklist</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.textLight }}>Personalized to your pathway &amp; city</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', filter: 'blur(2px)', userSelect: 'none', pointerEvents: 'none' }}>
              {PREVIEW_TASKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < PREVIEW_TASKS.length - 1 ? `1px solid ${C.lightGray}` : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid #D1D5DB`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{t.phase}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(transparent, white)', pointerEvents: 'none' }} />
          </div>

          {/* Value props 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {[
              { icon: '🎯', title: 'Personalized', desc: 'Based on your pathway, city & family' },
              { icon: '📱', title: 'Track progress', desc: 'Check off tasks as you go' },
              { icon: '📚', title: 'Linked guides', desc: 'Every task connects to a guide' },
              { icon: '🔒', title: 'Private', desc: 'Data stays in your browser' },
            ].map((v, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.white }}>
                <div style={{ marginBottom: 4 }}><ValuePropIcon title={v.title} /></div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{v.title}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{v.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/immigration-costs#your-plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 100, background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`, color: C.white, fontFamily: FONT, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px ${C.accent}30` }}>
              <MapleLeafIcon size={16} color="#fff" /> Create My Plan — It&apos;s Free
            </Link>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Schedule size={14} color={C.textLight} aria-hidden="true" />3 min</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><SmartToy size={14} color={C.textLight} aria-hidden="true" />No AI</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Analytics size={14} color={C.textLight} aria-hidden="true" />IRCC data</span>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 375px) {
            .sp-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    )
  }

  // ═══ ACTIVE STATE ════════════════════════════════════════════════════════════
  const motivationalText =
    pct === 100 ? "You're fully prepared for Canada!"
    : pct >= 75  ? "You're ahead of most newcomers!"
    : pct >= 50  ? "More than halfway ready!"
    : pct >= 25  ? "Great momentum — keep going!"
    : pct > 0    ? `You're ${pct}% ready for life in Canada`
    : "Your journey starts here"

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      {showConfetti && <Confetti />}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* ── Plan header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapleLeafIcon size={16} color={C.accent} />
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.forest }}>Your Plan</span>
          </div>
          <div style={{ fontSize: 11, color: C.textLight }}>
            {plan.pathway} · {plan.city}
            {plan.familySize > 1 ? ` · ${plan.familySize} people` : ''}
          </div>
        </div>

        {/* ── Progress card ── */}
        <div style={{
          borderRadius: 16, padding: '24px 20px',
          background: pct === 100 ? `linear-gradient(135deg, ${C.forest}, ${C.accent})` : C.white,
          border: pct === 100 ? 'none' : `1px solid ${C.border}`,
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20,
          transition: 'background .6s',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ProgressRing pct={pct} size={80} stroke={7} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: pct === 100 ? C.white : C.forest }}>{pct}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: pct === 100 ? C.white : C.forest, marginBottom: 2 }}>
              {motivationalText}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: pct === 100 ? 'rgba(255,255,255,0.8)' : C.gray }}>
              {completed} of {total} steps completed
            </div>
            {milestoneLabel && pct < 100 && (
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.gold, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <SparkIcon /> {milestoneLabel}
              </div>
            )}
          </div>
        </div>

        {/* ── 100% completion: What's next ── */}
        {pct === 100 && (
          <div style={{ borderRadius: 14, border: `2px solid ${C.gold}25`, background: `linear-gradient(135deg, ${C.gold}06, ${C.gold}02)`, padding: '20px 18px', marginBottom: 14 }}>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.forest, marginBottom: 6 }}>What&apos;s next? Keep building.</div>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray, margin: '0 0 14px', lineHeight: 1.6 }}>You&apos;ve nailed the essentials. Now it&apos;s time to grow your money and plan ahead.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: '📈', label: 'Start investing',         slug: 'how-to-start-investing' },
                { icon: '📋', label: 'Optimize your taxes',     slug: 'first-tax-return' },
                { icon: '🏠', label: 'Plan for homeownership',  slug: 'fhsa-introduction' },
              ].map((item, i) => (
                <Link key={i} href={`/articles/${item.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.textDark, textDecoration: 'none' }}>
                  <CompletionLinkIcon label={item.label} /> {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Next step nudge (1–99%) ── */}
        {false && pct > 0 && pct < 100 && todaysFocus.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: `${C.accent}06`, border: `1px solid ${C.accent}12`, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>👉</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.forest }}>Next: {todaysFocus[0]?.title}</span>
              {todaysFocus[0]?.description && (
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray, marginLeft: 4 }}>
                  — {todaysFocus[0]?.description?.split('.')[0].substring(0, 50)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Focus on the Top 3 ── */}
        {todaysFocus.length > 0 && (
          <div style={{ borderRadius: 14, border: `2px solid ${C.accent}20`, background: `linear-gradient(135deg, ${C.accent}04, ${C.accent}02)`, padding: '18px 18px', marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TargetIcon />
              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.forest }}>Focus on the Top 3</span>
              <span style={{ fontFamily: FONT, fontSize: 11, color: C.textLight }}>What should you do next?</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '6px 10px', borderRadius: 999, background: currentPhaseMeta.lightColor }}>
              <PhaseIcon phaseId={currentPhase as ActionPlanTask['phase']} color={currentPhaseMeta.color} size={13} />
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: currentPhaseMeta.color }}>
                Focusing on {currentPhaseMeta.label}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              {todaysFocus.map((task, i) => {
                const isDeparting = departingId === task.id
                const isEntering = enteringId === task.id
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: isDeparting ? '0 12px' : '10px 12px',
                      borderRadius: 10, background: C.white,
                      border: `1px solid ${isDeparting ? C.accent + '40' : C.border}`,
                      marginBottom: isDeparting ? 0 : (i < todaysFocus.length - 1 ? 6 : 0),
                      transform: isDeparting ? 'translateX(-110%) scale(0.95)' : 'translateX(0)',
                      opacity: isDeparting ? 0 : 1,
                      maxHeight: isDeparting ? 0 : 80,
                      overflow: 'hidden',
                      transition: isDeparting
                        ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, max-height 0.3s 0.1s ease, margin-bottom 0.3s 0.1s ease, padding 0.3s 0.1s ease'
                        : isEntering
                          ? 'none'
                          : 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-bottom 0.25s ease',
                      animation: isEntering ? 'focusSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
                    }}
                  >
                    <button
                      onClick={() => handleFocusToggle(task.id)}
                      disabled={!!departingId}
                      role="checkbox" aria-checked={false} aria-label={task.title}
                      style={{
                        width: 26, height: 26, minWidth: 26, borderRadius: 8,
                        border: `2px solid ${C.accent}40`,
                        background: isDeparting ? C.accent : 'transparent',
                        cursor: departingId ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, transition: 'background 0.2s, transform 0.15s',
                        transform: isDeparting ? 'scale(0.9)' : 'scale(1)',
                      }}
                    >
                      {isDeparting && <CheckSvg />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: isDeparting ? C.textLight : C.textDark, lineHeight: 1.3, textDecoration: isDeparting ? 'line-through' : 'none', transition: 'color 0.2s' }}>
                        {task.title}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, marginTop: 1 }}>
                        {PHASES.find(p => p.id === task.phase)?.label}
                        {task.priority === 'high' && <span style={{ color: C.red, marginLeft: 6 }}>● High priority</span>}
                      </div>
                    </div>
                    {task.articleSlug && !isDeparting && (
                      <Link href={`/articles/${task.articleSlug}`} style={{ color: C.accent, flexShrink: 0, padding: 4, opacity: isDeparting ? 0 : 1, transition: 'opacity 0.15s' }}>
                        <BookIcon />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Phase sections ── */}
        {PHASES.map(phase => {
          const phaseTasks = orderTasksForPhase(
            tasks.filter(t => t.phase === phase.id),
            taskOrder,
          )
          const phaseCompleted = phaseTasks.filter(t => t.completed).length
          if (phaseTasks.length === 0) return null
          return (
            <PhaseSection
              key={phase.id}
              phase={phase}
              tasks={phaseTasks}
              completedCount={phaseCompleted}
              onToggleTask={toggleTask}
              defaultOpen={phase.id === currentPhase}
            />
          )
        })}

        {/* ── Retention Hub ── */}
        <div style={{ marginTop: 24, borderRadius: 14, background: C.white, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.forest }}>Your Plan Tools</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { icon: '📊', label: 'View Full Report', desc: 'Cost breakdown & analysis', action: () => router.push('/immigration-costs') },
                { icon: '🔗', label: 'Share Plan', desc: 'Copy link to this page', action: () => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); } },
                { icon: '📲', label: 'Save to Phone', desc: 'Add to your home screen', action: () => alert('Open your browser menu and tap "Add to Home Screen"') },
                { icon: '📧', label: 'Email My Plan', desc: 'Coming soon — save the link', action: () => alert('Coming soon — save the link for now.') },
              ].map((item, i) => (
                <button key={i} onClick={item.label === 'View Full Report' && reportAvailable && onViewFullReport ? onViewFullReport : item.action} style={{ padding: '14px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: `${C.lightGray}60`, cursor: 'pointer', textAlign: 'left', fontFamily: FONT, transition: 'background .2s, border-color .2s', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ToolTileIcon label={item.label} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textLight, paddingLeft: 22 }}>{item.label === 'View Full Report' && reportAvailable ? 'Flip back to your report' : item.desc}</span>
                </button>
              ))}
            </div>
            {/* Consultant CTA */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: `${C.accent}06`, border: `1px solid ${C.accent}15`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Handshake size={16} color="#fff" aria-hidden="true" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.forest }}>Want expert guidance?</div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray, marginTop: 1 }}>Share your plan with a Regulated Canadian Immigration Consultant</div>
              </div>
              <Link href="/for-consultants" style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Find one →
              </Link>
            </div>
          </div>
          {/* Reset */}
          <div style={{ padding: '10px 20px 14px', borderTop: `1px solid ${C.lightGray}`, textAlign: 'center' }}>
            <button onClick={resetPlan} style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, background: 'none', border: 'none', cursor: 'pointer' }}>
              Reset plan and start over
            </button>
          </div>
        </div>

        {/* ── Version stamp ── */}
        <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 4 }}>
          <VersionStamp />
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes focusSlideIn {
          0%   { transform: translateY(20px) scale(0.96); opacity: 0; }
          60%  { transform: translateY(-2px) scale(1.01); opacity: 0.8; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes taskBubbleUp {
          0%   { transform: translateY(16px); opacity: 0.7; }
          60%  { transform: translateY(-3px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes taskSinkDown {
          0%   { transform: translateY(-10px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}

function getFlipFaceStyle(isActive: boolean, restingRotation: number) {
  return {
    width: '100%',
    position: isActive ? 'relative' as const : 'absolute' as const,
    inset: isActive ? undefined : 0,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    transform: isActive ? 'rotateY(0deg)' : `rotateY(${restingRotation}deg)`,
    opacity: isActive ? 1 : 0,
    pointerEvents: isActive ? 'auto' as const : 'none' as const,
    transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease',
  }
}

function ReportPlanFlipExperience() {
  const searchParams = useSearchParams()
  const startsInReport = searchParams.get('view') === 'report'
  const [activeView, setActiveView] = useState<'report' | 'plan'>(startsInReport ? 'report' : 'plan')
  const [plan, setPlan] = useState<ActionPlan | null>(null)

  useEffect(() => {
    if (startsInReport) {
      setActiveView('report')
    }
  }, [startsInReport])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleOpenSettlementPlan = useCallback((nextPlan: ActionPlan) => {
    setPlan(nextPlan)
    setActiveView('plan')
    scrollToTop()
  }, [scrollToTop])

  const handleViewFullReport = useCallback(() => {
    setActiveView('report')
    scrollToTop()
  }, [scrollToTop])

  if (!startsInReport) {
    return <ActionPlanPageContent />
  }

  return (
    <SettlementSessionProvider slug="pillar-article" mode="public">
      <div style={{ background: C.bg, minHeight: '100vh', perspective: 1800 }}>
        <div style={{ position: 'relative' }}>
          <div aria-hidden={activeView !== 'report'} style={getFlipFaceStyle(activeView === 'report', -180)}>
            <ResultsDashboard onOpenSettlementPlan={handleOpenSettlementPlan} />
          </div>
          <div aria-hidden={activeView !== 'plan'} style={getFlipFaceStyle(activeView === 'plan', 180)}>
            <ActionPlanPageContent
              initialPlan={plan}
              reportAvailable
              onViewFullReport={handleViewFullReport}
            />
          </div>
        </div>
      </div>
    </SettlementSessionProvider>
  )
}

export default function SettlementPlanPage() {
  return <ReportPlanFlipExperience />
}


