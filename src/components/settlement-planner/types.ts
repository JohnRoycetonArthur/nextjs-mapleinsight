export type PlannerMode = 'consultant' | 'public'
export type PublicFeedbackRating = 'very_helpful' | 'somewhat_helpful' | 'not_helpful'

export interface ConsultantBranding {
  slug: string
  displayName: string
  companyName: string | null
  logo: { asset: { url: string } } | null
  theme: { accentColor: string | null } | null
}
