import { trackEvent } from '@/lib/analytics'
import type { PlannerMode } from '@/components/settlement-planner/types'

interface BasePlannerEvent {
  mode: PlannerMode
}

interface StepEvent extends BasePlannerEvent {
  step: number
  step_name: string
}

interface CompleteEvent extends BasePlannerEvent {
  destination?: string | null
  pathway?: string | null
}

interface SocialEvent extends BasePlannerEvent {
  platform: 'reddit' | 'whatsapp' | 'facebook'
}

export function trackPlannerStart(event: BasePlannerEvent) {
  trackEvent('planner_start', { ...event })
}

export function trackPlannerStepComplete(event: StepEvent) {
  trackEvent('step_complete', { ...event })
}

export function trackPlannerComplete(event: CompleteEvent) {
  trackEvent('planner_complete', { ...event })
}

export function trackPublicReportSent(event: CompleteEvent) {
  trackEvent('public_report_sent', { ...event })
}

export function trackPublicFeedbackSubmitted(event: CompleteEvent) {
  trackEvent('public_feedback_submitted', { ...event })
}

export function trackPublicShareLinkCopied(event: BasePlannerEvent) {
  trackEvent('public_share_link_copied', { ...event })
}

export function trackPublicShareSocial(event: SocialEvent) {
  trackEvent('public_share_social', { ...event })
}
