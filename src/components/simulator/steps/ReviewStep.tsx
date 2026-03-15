'use client';

import { C, F } from '../tokens';
import {
  type MigrationStage, type CityOption, type WorkState, type HouseholdState,
  MIGRATION_STAGES, BEDROOM_OPTIONS, PROVINCE_NAMES,
} from '../wizardTypes';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function Section({
  title, stepIdx, onEdit, children,
}: {
  title: string; stepIdx: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 14,
      border: `1px solid ${C.border}`, marginBottom: 12, background: C.white,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700, color: C.forest }}>{title}</span>
        <button
          type="button"
          onClick={() => onEdit(stepIdx)}
          aria-label={`Edit ${title}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.green, fontSize: 13, fontWeight: 600, fontFamily: F.body,
          }}
        >
          <EditIcon /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', fontFamily: F.body, fontSize: 14,
    }}>
      <span style={{ color: C.gray }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.textDark }}>{value}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  stage:     MigrationStage | null;
  city:      CityOption | null;
  work:      WorkState;
  household: HouseholdState;
  onEdit:    (step: number) => void;
}

export function ReviewStep({ stage, city, work, household, onEdit }: Props) {
  const stageLabel    = MIGRATION_STAGES.find((s) => s.id === stage)?.label ?? '—';
  const bedroomLabel  = BEDROOM_OPTIONS.find((b) => b.value === household.bedrooms)?.label ?? '—';
  const provinceName  = city ? (PROVINCE_NAMES[city.province_code] ?? city.province_code) : '—';

  return (
    <div>
      <h2 style={{ fontFamily: F.heading, fontSize: 24, color: C.forest, margin: '0 0 8px', fontWeight: 700 }}>
        Review your details
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 15, color: C.gray, margin: '0 0 24px', lineHeight: 1.6 }}>
        Confirm everything looks right, then run your simulation.
      </p>

      <Section title="Migration Stage" stepIdx={0} onEdit={onEdit}>
        <Row label="Stage" value={stageLabel} />
      </Section>

      <Section title="Location" stepIdx={1} onEdit={onEdit}>
        <Row label="City"     value={city ? `${city.name}, ${city.province_code}` : '—'} />
        <Row label="Province" value={provinceName} />
      </Section>

      <Section title="Work" stepIdx={2} onEdit={onEdit}>
        <Row label="Occupation" value={work.occupation?.title ?? '—'} />
        <Row label="NOC Code"   value={work.occupation ? `NOC ${work.occupation.noc_code}` : '—'} />
        <Row label="Experience" value={`${work.experience} year${work.experience !== 1 ? 's' : ''}`} />
        <Row label="Hours/Week" value={`${work.hoursPerWeek}h`} />
        <Row label="Type"       value={work.employmentType === 'employee' ? 'Employee' : 'Self-Employed'} />
      </Section>

      <Section title="Household" stepIdx={3} onEdit={onEdit}>
        <Row label="Adults"   value={household.adults} />
        <Row label="Children" value={household.children} />
        {household.children > 0 && (
          <Row
            label="Children's Ages"
            value={household.childAges.map((a, i) => `Child ${i + 1}: ${a}`).join(' · ')}
          />
        )}
        {household.adults === 2 && (
          <Row label="Spouse Working" value={household.spouseWorking ? 'Yes' : 'No'} />
        )}
        <Row label="Bedrooms" value={bedroomLabel} />
      </Section>
    </div>
  );
}
