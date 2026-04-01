import { trackEvent } from '@/lib/analytics'
import type { PlannerMode } from '@/components/settlement-planner/types'

interface BasePlannerEvent {
  mode: PlannerMode
}

interface StepEvent extends BasePlannerEvent {
  step: number
  step_name: string
}

interface StepViewEvent extends StepEvent {
  completed_steps?: number
}

interface CompleteEvent extends BasePlannerEvent {
  destination?: string | null
  pathway?: string | null
}

interface SeePlanClickEvent extends CompleteEvent {
  step: number
  step_name: string
}

interface SocialEvent extends BasePlannerEvent {
  platform: 'reddit' | 'whatsapp' | 'facebook'
}

interface ReportEvent extends CompleteEvent {
  report_type: 'client_plan'
}

interface ReportScrollEvent extends ReportEvent {
  depth_percentage: number
}

interface ReportTimeEvent extends ReportEvent {
  elapsed_seconds: number
}

export function trackPlannerStart(event: BasePlannerEvent) {
  trackEvent('planner_start', { ...event })
}

export function trackPlannerStepView(event: StepViewEvent) {
  trackEvent('planner_step_view', { ...event })
}

export function trackPlannerStepComplete(event: StepEvent) {
  trackEvent('step_complete', { ...event })
}

export function trackPlannerSeePlanClick(event: SeePlanClickEvent) {
  trackEvent('planner_see_plan_click', { ...event })
}

export function trackPlannerComplete(event: CompleteEvent) {
  trackEvent('planner_complete', { ...event })
}

export function trackPlannerReportView(event: ReportEvent) {
  trackEvent('planner_report_view', { ...event })
}

export function trackPlannerReportScrollDepth(event: ReportScrollEvent) {
  trackEvent('planner_report_scroll_depth', { ...event })
}

export function trackPlannerReportTimeMilestone(event: ReportTimeEvent) {
  trackEvent('planner_report_time_milestone', { ...event })
}

export function trackPlannerReportExit(event: ReportTimeEvent & { max_depth_percentage: number }) {
  trackEvent('planner_report_exit', { ...event })
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
