'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { NetIncomeResult } from '@/lib/simulator/engines/taxTypes';
import { Panel } from './Panel';

interface Props {
  tax: NetIncomeResult;
}

function fmt(n: number) {
  return `$${Math.abs(Math.round(n)).toLocaleString('en-CA')}`;
}

const CHART_COLORS = ['#C41E3A', '#B8860B', '#2563EB', '#9333EA', '#1B7A4A'];

export function NetIncomePanel({ tax }: Props) {
  const chartData = [
    { name: 'Federal Tax',    value: Math.round(tax.federal_tax),      color: '#C41E3A' },
    { name: 'Provincial Tax', value: Math.round(tax.provincial_tax),   color: '#B8860B' },
    { name: 'CPP/QPP',        value: Math.round(tax.cpp_contribution), color: '#2563EB' },
    { name: 'EI',             value: Math.round(tax.ei_premium),       color: '#9333EA' },
    { name: 'Take-Home',      value: Math.round(tax.annual_net_income), color: '#1B7A4A' },
  ];

  const rows = [
    { label: 'Gross Annual Income',                              val: tax.gross_income,       bold: true,  green: false },
    { label: 'Federal Tax',                                      val: -tax.federal_tax,        bold: false, green: false },
    { label: 'Provincial Tax',                                   val: -tax.provincial_tax,     bold: false, green: false },
    { label: tax.quebec_special_case ? 'QPP Contributions' : 'CPP Contributions', val: -tax.cpp_contribution, bold: false, green: false },
    { label: 'EI Premiums',                                      val: -tax.ei_premium,         bold: false, green: false },
    { label: 'Annual Net Income',                                val: tax.annual_net_income,   bold: true,  green: true  },
  ];

  return (
    <Panel title="Net Income & Take-Home Pay" icon="📊" color="#2563EB">
      {/* Monthly take-home hero */}
      <div style={{ textAlign: 'center', marginBottom: 24, fontFamily: "'DM Sans', Helvetica, sans-serif" }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#9CA3AF',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
        }}>
          Monthly Take-Home
        </div>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 48, fontWeight: 700, color: '#1B7A4A', lineHeight: 1,
        }}>
          ${tax.monthly_take_home.toLocaleString('en-CA')}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          per month after taxes & deductions
        </div>
      </div>

      {/* Donut chart */}
      <div style={{ height: 220, marginBottom: 16 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%" cy="50%"
              outerRadius={85} innerRadius={50}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => typeof v === 'number' ? `$${Math.round(v).toLocaleString('en-CA')}` : String(v)}
              contentStyle={{
                borderRadius: 10, border: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 13,
              }}
            />
            <Legend
              formatter={(val: string) => (
                <span style={{ fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 12, color: '#374151' }}>
                  {val}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown table */}
      <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '16px 18px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'DM Sans', Helvetica, sans-serif", fontSize: 13,
            borderTop: row.green ? '1px solid #E5E7EB' : 'none',
            marginTop: row.green ? 6 : 0,
            paddingTop: row.green ? 10 : 6,
            paddingBottom: 6,
          }}>
            <span style={{ color: '#374151', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
            <span style={{
              fontWeight: row.bold ? 700 : 500,
              color: row.green ? '#1B7A4A' : row.val < 0 ? '#C41E3A' : '#374151',
            }}>
              {row.val < 0 ? `−${fmt(row.val)}` : fmt(row.val)}
            </span>
          </div>
        ))}
      </div>

      {/* Assumptions */}
      <div style={{ marginTop: 14, fontSize: 11, color: '#9CA3AF', fontFamily: "'DM Sans', Helvetica, sans-serif" }}>
        <span style={{ fontWeight: 600 }}>Assumptions:</span>{' '}
        {tax.assumptions.join(' · ')}
      </div>

      {/* Screen-reader accessible table */}
      <table className="sr-only" aria-label="Income tax breakdown">
        <tbody>
          <tr><th scope="row">Gross Annual Income</th><td>{fmt(tax.gross_income)}</td></tr>
          <tr><th scope="row">Federal Tax</th><td>{fmt(tax.federal_tax)}</td></tr>
          <tr><th scope="row">Provincial Tax</th><td>{fmt(tax.provincial_tax)}</td></tr>
          <tr><th scope="row">CPP / QPP Contributions</th><td>{fmt(tax.cpp_contribution)}</td></tr>
          <tr><th scope="row">EI Premiums</th><td>{fmt(tax.ei_premium)}</td></tr>
          <tr><th scope="row">Annual Net Income</th><td>{fmt(tax.annual_net_income)}</td></tr>
          <tr><th scope="row">Monthly Take-Home</th><td>${tax.monthly_take_home.toLocaleString('en-CA')}</td></tr>
        </tbody>
      </table>
    </Panel>
  );
}
