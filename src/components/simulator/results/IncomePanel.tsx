'use client';

import type { SalaryEstimate } from '@/lib/simulator/engines/salaryTypes';
import { Panel } from './Panel';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  salary:     SalaryEstimate;
  occupation: string;
  city:       string;
  level:      string;
}

const LEVEL_LABELS: Record<string, string> = {
  entry: 'Entry', intermediate: 'Intermediate', senior: 'Senior', executive: 'Executive',
};

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}

export function IncomePanel({ salary, occupation, city, level }: Props) {
  const { annual_low, annual_mid, annual_high } = salary;
  const range   = annual_high - annual_low;
  const midPct  = range > 0 ? ((annual_mid - annual_low) / range) * 100 : 50;
  const levelLabel = LEVEL_LABELS[level] ?? level;

  return (
    <Panel
      title="Income Potential"
      icon="💰"
      color="#1B7A4A"
      badge={<ConfidenceBadge confidence={salary.confidence} />}
    >
      {/* Sub-header */}
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, fontFamily: "'DM Sans', Helvetica, sans-serif" }}>
        Estimated as{' '}
        <strong style={{ color: '#1B4F4A' }}>{occupation}</strong> in{' '}
        <strong style={{ color: '#1B4F4A' }}>{city}</strong>
        {' '}· {levelLabel} level
      </div>

      {/* Salary range bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 8,
          fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 12, color: '#9CA3AF',
        }}>
          <span>Low</span><span>Median</span><span>High</span>
        </div>
        <div style={{ position: 'relative', height: 40, background: '#F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 10,
            background: 'linear-gradient(90deg, #1B7A4A22, #1B7A4A44, #1B7A4A22)',
          }} />
          {/* Median marker line */}
          <div style={{
            position: 'absolute', left: `${midPct}%`, top: 0, bottom: 0,
            width: 3, background: '#1B7A4A', borderRadius: 2, transform: 'translateX(-50%)',
          }} />
          {/* Median label pill */}
          <div style={{
            position: 'absolute', left: `${midPct}%`, top: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1B7A4A', color: '#fff',
            padding: '4px 12px', borderRadius: 8,
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {fmt(annual_mid)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: "'DM Sans', Helvetica, sans-serif" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{fmt(annual_low)}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{fmt(annual_high)}</span>
        </div>
      </div>

      {/* Hourly tiles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Hourly (Low)',  val: `$${salary.low_hourly.toFixed(2)}`    },
          { label: 'Hourly (Mid)',  val: `$${salary.median_hourly.toFixed(2)}` },
          { label: 'Hourly (High)', val: `$${salary.high_hourly.toFixed(2)}`   },
        ].map((item) => (
          <div key={item.label} style={{
            flex: '1 1 100px', padding: '10px 14px', borderRadius: 10,
            background: '#F3F4F6', textAlign: 'center',
            fontFamily: "'DM Sans', Helvetica, sans-serif",
          }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B4F4A' }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#9CA3AF',
          textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 6, fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}>
          Data Sources
        </div>
        {salary.data_sources.map((src, i) => (
          <div key={i} style={{
            fontSize: 12, color: '#6B7280',
            fontFamily: "'DM Sans', Helvetica, sans-serif",
            display: 'flex', gap: 6, marginBottom: 2,
          }}>
            <span style={{
              width: 4, height: 4, borderRadius: '50%', background: '#1B7A4A',
              marginTop: 6, flexShrink: 0, display: 'inline-block',
            }} />
            <span>{src.source} — {src.ref_period}</span>
          </div>
        ))}
      </div>

      {/* Screen-reader accessible table */}
      <table className="sr-only" aria-label="Annual salary range">
        <thead>
          <tr><th>Scenario</th><th>Annual</th><th>Hourly</th></tr>
        </thead>
        <tbody>
          <tr><td>Low</td><td>{fmt(annual_low)}</td><td>${salary.low_hourly.toFixed(2)}/hr</td></tr>
          <tr><td>Mid (median)</td><td>{fmt(annual_mid)}</td><td>${salary.median_hourly.toFixed(2)}/hr</td></tr>
          <tr><td>High</td><td>{fmt(annual_high)}</td><td>${salary.high_hourly.toFixed(2)}/hr</td></tr>
        </tbody>
      </table>
    </Panel>
  );
}
