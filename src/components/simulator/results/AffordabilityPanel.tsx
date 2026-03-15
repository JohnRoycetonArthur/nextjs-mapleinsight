'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CostEstimate, LifestyleTier } from '@/lib/simulator/engines/colTypes';
import type { NetIncomeResult } from '@/lib/simulator/engines/taxTypes';
import type { CCBEstimate } from '@/lib/simulator/engines/ccbTypes';
import { Panel } from './Panel';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  col:               CostEstimate;
  taxResult:         NetIncomeResult;
  ccb:               CCBEstimate;
  lifestyle:         LifestyleTier;
  onLifestyleChange: (l: LifestyleTier) => void;
}

/** Split non-shelter monthly into food / transport / other using MBM proportions. */
function splitNonShelter(nonShelter: number) {
  const food      = Math.round(nonShelter * 0.47);
  const transport = Math.round(nonShelter * 0.20);
  const other     = nonShelter - food - transport;
  return { food, transport, other };
}

export function AffordabilityPanel({ col, taxResult, ccb, lifestyle, onLifestyleChange }: Props) {
  const { food, transport, other } = splitNonShelter(col.non_shelter_monthly);
  const ccbMonthly   = ccb.applicable ? ccb.monthly_estimate : 0;
  const incomeTotal  = taxResult.monthly_take_home + ccbMonthly;
  const surplus      = incomeTotal - col.estimated_total_monthly;

  const shelterRatio = col.shelter_cost_to_income_ratio;
  const ratioColor   = shelterRatio < 0.3 ? '#1B7A4A' : shelterRatio < 0.5 ? '#B8860B' : '#C41E3A';
  const ratioLabel   = shelterRatio < 0.3 ? 'Affordable' : shelterRatio < 0.5 ? 'At Risk' : 'Unaffordable';

  const barData = [
    { name: 'Income',   amount: incomeTotal },
    { name: 'Expenses', amount: col.estimated_total_monthly },
  ];

  const expenseRows = [
    { name: 'Rent',      value: col.rent_benchmark_monthly, color: '#C41E3A' },
    { name: 'Food',      value: food,                       color: '#B8860B' },
    { name: 'Transport', value: transport,                  color: '#2563EB' },
    { name: 'Other',     value: other,                      color: '#9333EA' },
  ];

  const confidenceForBadge = {
    score:   col.confidence.score,
    tier:    col.confidence.tier as 'High' | 'Medium' | 'Low',
    signals: col.confidence.signals as string[],
  };

  return (
    <Panel
      title="Cost of Living & Affordability"
      icon="🏠"
      color="#B8860B"
      badge={<ConfidenceBadge confidence={confidenceForBadge} />}
    >
      {/* Lifestyle toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap',
        fontFamily: "'DM Sans', Helvetica, sans-serif",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Lifestyle:
        </span>
        {(['frugal', 'moderate', 'comfortable'] as LifestyleTier[]).map((l) => (
          <button
            key={l}
            onClick={() => onLifestyleChange(l)}
            aria-pressed={lifestyle === l}
            style={{
              padding: '6px 16px', borderRadius: 8,
              border: `2px solid ${lifestyle === l ? '#1B7A4A' : '#E5E7EB'}`,
              background: lifestyle === l ? '#E8F5EE' : '#fff',
              fontSize: 12, fontWeight: lifestyle === l ? 700 : 500,
              color: lifestyle === l ? '#1B7A4A' : '#374151',
              cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
              fontFamily: "'DM Sans', Helvetica, sans-serif",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Income vs Expenses bar chart */}
      <div style={{ height: 160, marginBottom: 20 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" barSize={36}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="name" width={80}
              style={{ fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 13 }}
            />
            <Tooltip
              formatter={(v) => typeof v === 'number' ? `$${Math.round(v).toLocaleString('en-CA')}` : String(v)}
              contentStyle={{
                borderRadius: 10, border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 13,
              }}
            />
            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
              <Cell fill="#1B7A4A" />
              <Cell fill="#B8860B" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Shelter-to-income ratio card */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderRadius: 12,
        background: `${ratioColor}0A`, border: `1px solid ${ratioColor}22`,
        marginBottom: 16, fontFamily: "'DM Sans', Helvetica, sans-serif",
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Shelter-to-Income Ratio</div>
          <div style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 24, fontWeight: 700, color: ratioColor,
          }}>
            {(shelterRatio * 100).toFixed(0)}%
          </div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 8,
          background: `${ratioColor}18`, color: ratioColor,
          fontSize: 12, fontWeight: 700,
        }}>
          {ratioLabel}
        </div>
      </div>

      {/* Expense breakdown */}
      <div style={{ marginBottom: ccb.applicable ? 12 : 16 }}>
        {expenseRows.map((item) => (
          <div key={item.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '1px solid #F3F4F6',
            fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 13,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: item.color, flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{ color: '#374151' }}>{item.name}</span>
            </div>
            <span style={{ fontWeight: 600, color: '#374151' }}>
              ${item.value.toLocaleString('en-CA')}/mo
            </span>
          </div>
        ))}
      </div>

      {/* Government Benefits section — AC-5, AC-7 */}
      {ccb.applicable && (
        <div style={{
          marginBottom: 16,
          padding: '12px 14px',
          borderRadius: 10,
          background: '#E8F5EE',
          border: '1px solid #1B7A4A22',
          fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#1B7A4A',
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
          }}>
            Government Benefits
          </div>

          {/* CCB line item */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 13, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: '#1B7A4A', flexShrink: 0, display: 'inline-block',
              }} />
              <div>
                <span style={{ color: '#1B4F4A', fontWeight: 600 }}>Canada Child Benefit</span>
                <span style={{
                  marginLeft: 8, fontSize: 10, color: '#6B7280',
                  fontStyle: 'italic',
                }}>
                  {ccb.under_6_count > 0 && `${ccb.under_6_count} child${ccb.under_6_count > 1 ? 'ren' : ''} under 6`}
                  {ccb.under_6_count > 0 && ccb.age_6to17_count > 0 && ', '}
                  {ccb.age_6to17_count > 0 && `${ccb.age_6to17_count} child${ccb.age_6to17_count > 1 ? 'ren' : ''} 6–17`}
                </span>
              </div>
            </div>
            <span style={{ fontWeight: 700, color: '#1B7A4A' }}>
              +${ccb.monthly_estimate.toLocaleString('en-CA')}/mo
            </span>
          </div>

          {/* AC-6: disclaimer */}
          <p style={{
            margin: 0, fontSize: 11, color: '#6B7280',
            lineHeight: 1.5, fontStyle: 'italic',
          }}>
            {ccb.disclaimer}
          </p>
        </div>
      )}

      {/* Surplus / deficit callout */}
      <div
        role="status"
        aria-live="polite"
        aria-label={`Monthly ${surplus >= 0 ? 'surplus' : 'deficit'}: $${Math.abs(surplus).toLocaleString('en-CA')}`}
        style={{
          textAlign: 'center', padding: '18px', borderRadius: 12,
          background: surplus >= 0 ? '#E8F5EE' : '#FEF2F2',
          border: `1px solid ${surplus >= 0 ? '#1B7A4A22' : '#C41E3A22'}`,
          fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}
      >
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Monthly {surplus >= 0 ? 'Surplus' : 'Deficit'}
        </div>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 36, fontWeight: 700,
          color: surplus >= 0 ? '#1B7A4A' : '#C41E3A',
        }}>
          {surplus >= 0 ? '+' : '−'}${Math.abs(surplus).toLocaleString('en-CA')}
        </div>
        {ccb.applicable && (
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
            Includes ${ccb.monthly_estimate.toLocaleString('en-CA')}/mo Canada Child Benefit
          </div>
        )}
      </div>

      {/* Screen-reader accessible table */}
      <table className="sr-only" aria-label="Monthly budget summary">
        <tbody>
          <tr><th scope="row">Monthly Take-Home</th><td>${taxResult.monthly_take_home.toLocaleString('en-CA')}</td></tr>
          {ccb.applicable && <tr><th scope="row">Canada Child Benefit</th><td>+${ccb.monthly_estimate.toLocaleString('en-CA')}/mo</td></tr>}
          <tr><th scope="row">Rent</th><td>${col.rent_benchmark_monthly.toLocaleString('en-CA')}/mo</td></tr>
          <tr><th scope="row">Food</th><td>${food.toLocaleString('en-CA')}/mo</td></tr>
          <tr><th scope="row">Transport</th><td>${transport.toLocaleString('en-CA')}/mo</td></tr>
          <tr><th scope="row">Other</th><td>${other.toLocaleString('en-CA')}/mo</td></tr>
          <tr><th scope="row">Total Expenses</th><td>${col.estimated_total_monthly.toLocaleString('en-CA')}/mo</td></tr>
          <tr><th scope="row">Monthly {surplus >= 0 ? 'Surplus' : 'Deficit'}</th><td>${Math.abs(surplus).toLocaleString('en-CA')}</td></tr>
        </tbody>
      </table>
    </Panel>
  );
}
