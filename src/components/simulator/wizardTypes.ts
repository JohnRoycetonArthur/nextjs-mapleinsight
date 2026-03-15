// Wizard state types for US-9.2 — Multi-Step Onboarding Questionnaire.

export type MigrationStage = 'planning' | 'recently_arrived' | 'settled';
export type EmploymentType  = 'employee' | 'self_employed';
export type BedroomOption   = 'studio' | '1br' | '2br' | '3br';

export interface CityOption {
  city_id:       string;
  name:          string;
  province_code: string;
  cma_code:      string;
  mbm_region:    string;
  latitude:      number;
  longitude:     number;
}

// Province name isn't in cities.json — we derive it client-side.
export const PROVINCE_NAMES: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island',
  QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon',
};

export interface OccupationOption {
  noc_code:   string;
  title:      string;
  synonyms:   string[];
  teer_level: number;
  sector:     string;
}

export interface WorkState {
  occupation:     OccupationOption | null;
  experience:     number;   // 0–30 years, default 3
  hoursPerWeek:   number;   // 20 | 30 | 37.5 | 40, default 40
  employmentType: EmploymentType;
}

export interface HouseholdState {
  adults:        1 | 2;
  children:      number;    // 0–6
  childAges:     number[];  // length === children, each 0–17
  spouseWorking: boolean;
  bedrooms:      BedroomOption;
}

export interface WizardState {
  step:      number;
  stage:     MigrationStage | null;
  city:      CityOption | null;
  work:      WorkState;
  household: HouseholdState;
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  step:  0,
  stage: null,
  city:  null,
  work: {
    occupation:     null,
    experience:     3,
    hoursPerWeek:   40,
    employmentType: 'employee',
  },
  household: {
    adults:        1,
    children:      0,
    childAges:     [],
    spouseWorking: false,
    bedrooms:      '1br',
  },
};

export const MIGRATION_STAGES: Array<{
  id:          MigrationStage;
  label:       string;
  icon:        string;
  description: string;
}> = [
  { id: 'planning',        label: 'Planning to Move',    icon: '🗺️', description: "I'm researching Canada and haven't moved yet" },
  { id: 'recently_arrived',label: 'Recently Arrived',    icon: '✈️', description: 'I arrived in Canada less than 1 year ago' },
  { id: 'settled',         label: 'Settled (1+ years)',  icon: '🏡', description: "I've been in Canada for over a year" },
];

export const BEDROOM_OPTIONS: Array<{ value: BedroomOption; label: string }> = [
  { value: 'studio', label: 'Studio'      },
  { value: '1br',    label: '1 Bedroom'   },
  { value: '2br',    label: '2 Bedrooms'  },
  { value: '3br',    label: '3+ Bedrooms' },
];

export const HOURS_OPTIONS = [20, 30, 37.5, 40] as const;
