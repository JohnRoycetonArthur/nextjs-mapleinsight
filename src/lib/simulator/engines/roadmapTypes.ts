// Types scoped to the Roadmap Generator engine (US-9.6).

/** Five time-based stages of the newcomer financial roadmap (AC-1). */
export type RoadmapStage =
  | 'pre_arrival'
  | 'first_30_days'
  | 'month_2_3'
  | 'month_4_6'
  | 'month_7_12';

/** Task urgency level (AC-2). */
export type TaskPriority = 'do_now' | 'do_soon' | 'do_later';

/** Content resource types linked from tasks (AC-2). */
export type ContentType = 'article' | 'calculator' | 'tool' | 'guide';

/** Housing affordability flag from the COL engine. */
export type AffordabilityFlag = 'affordable' | 'at_risk' | 'unaffordable';

/** Migration stage from the onboarding wizard. */
export type MigrationStage = 'planning_to_move' | 'recently_arrived' | 'established';

// ── Data shapes (mirror JSON file structures) ─────────────────────────────────

/** One task definition from roadmap_tasks.json. */
export interface TaskDefinition {
  task_id:       string;
  stage:         RoadmapStage;
  title:         string;
  description:   string;
  priority:      TaskPriority;
  content_tags:  string[];
  always_include: boolean;
}

/** One entry in roadmap_rules.json. */
export interface RoadmapRule {
  rule_id:       string;
  description:   string;
  condition:     RuleCondition;
  include_tasks: string[];
  exclude_tasks: string[];
}

/** Condition clause for a rule. */
export interface RuleCondition {
  field: string;
  op:    'eq' | 'ne' | 'in' | 'gt' | 'lt' | 'gte';
  value: unknown;
}

/** One content resource from content_items.json (AC-4). */
export interface ContentItem {
  content_id: string;
  type:       ContentType;
  title:      string;
  slug:       string;
  tags:       string[];
}

// ── Engine inputs ─────────────────────────────────────────────────────────────

/**
 * Subset of the onboarding wizard state needed by the roadmap engine.
 * Sourced from sessionStorage ('maple-simulator-input-v1').
 */
export interface RoadmapInput {
  migration_stage:   MigrationStage;
  city_id:           string;
  city_name:         string;       // human-readable e.g. "Toronto"
  province_code:     string;
  noc_code:          string;
  occupation_title:  string;
  years_experience:  number;
  employment_type:   string;
  adults:            number;
  children:          number;
  hours_per_week:    number;
  bedrooms:          number;
}

/**
 * Combined outputs from salary, tax, and COL engines.
 * All dollar fields are in CAD.
 */
export interface RoadmapResult {
  // Salary engine
  annual_mid:   number;
  point_annual: number;
  // Tax engine
  monthly_take_home:   number;
  annual_net_income:   number;
  gross_monthly_income: number;  // gross / 12
  // COL engine
  estimated_total_monthly: number;
  monthly_surplus:         number;
  housing_affordability_flag: AffordabilityFlag;
}

/**
 * Flattened evaluation context built from RoadmapInput + RoadmapResult.
 * Used by the rule evaluator.
 */
export interface RoadmapContext {
  migration_stage:           MigrationStage;
  has_children:              boolean;
  housing_affordability_flag: AffordabilityFlag;
  monthly_surplus:           number;
  province_code:             string;
  adults:                    number;
  employment_type:           string;
}

// ── Engine outputs ────────────────────────────────────────────────────────────

/** A fully resolved task ready for UI rendering (AC-2). */
export interface RoadmapTask {
  task_id:     string;
  title:       string;
  description: string;
  priority:    TaskPriority;
  links:       TaskLink[];
}

/** A content link attached to a task (AC-2). */
export interface TaskLink {
  type:  ContentType;
  slug:  string;
  title: string;
}

/** Tasks grouped by roadmap stage (AC-1). */
export interface StagedTasks {
  pre_arrival:   RoadmapTask[];
  first_30_days: RoadmapTask[];
  month_2_3:     RoadmapTask[];
  month_4_6:     RoadmapTask[];
  month_7_12:    RoadmapTask[];
}

/** Full output of generateRoadmap() (AC-1 through AC-8). */
export interface RoadmapOutput {
  staged_tasks:          StagedTasks;
  all_tasks:             RoadmapTask[]; // flat list, deduplicated (AC-5)
  total_task_count:      number;
  personalization_summary: string;      // AC-8
}
