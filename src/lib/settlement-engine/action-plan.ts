import type { Checklist } from './checklist'
import type { WizardAnswers } from '@/components/settlement-planner/SettlementSessionContext'

export interface ActionPlanTask {
  id: string
  phase: 'pre-arrival' | 'first-week' | 'first-30' | 'first-90'
  title: string
  description: string | null
  whyItMatters: string | null
  priority: 'high' | 'medium' | 'low'
  articleSlug: string | null
  completed: boolean
}

export interface ActionPlan {
  schemaVersion: 1
  createdAt: string
  updatedAt: string
  pathway: string
  city: string
  province: string
  familySize: number
  tasks: ActionPlanTask[]
}

const PERIOD_MAP: Record<string, ActionPlanTask['phase']> = {
  'Pre-Arrival': 'pre-arrival',
  preArrival: 'pre-arrival',
  'First Week': 'first-week',
  firstWeek: 'first-week',
  'First 30 Days': 'first-30',
  first30: 'first-30',
  'First 90 Days': 'first-90',
  first90: 'first-90',
}

export function buildActionPlanFromChecklist({
  answers,
  checklist,
  createdAt = new Date().toISOString(),
}: {
  answers: WizardAnswers
  checklist: Checklist
  createdAt?: string
}): ActionPlan {
  const allItems = [
    ...checklist.preArrival.items.map(item => ({ ...item, period: 'pre-arrival' as const })),
    ...checklist.firstWeek.items.map(item => ({ ...item, period: 'first-week' as const })),
    ...checklist.first30.items.map(item => ({ ...item, period: 'first-30' as const })),
    ...checklist.first90.items.map(item => ({ ...item, period: 'first-90' as const })),
  ]

  return {
    schemaVersion: 1,
    createdAt,
    updatedAt: createdAt,
    pathway: answers.pathway ?? '',
    city: answers.city ?? '',
    province: answers.province ?? 'ON',
    familySize: (answers.adults ?? 1) + (answers.children ?? 0),
    tasks: allItems.map((item, idx) => ({
      id: `task-${idx}`,
      phase: PERIOD_MAP[item.period] ?? item.period,
      title: item.label,
      description: null,
      whyItMatters: null,
      priority: item.priority <= 2 ? 'high' : item.priority <= 5 ? 'medium' : 'low',
      articleSlug: item.articleSlug ?? null,
      completed: false,
    })),
  }
}
