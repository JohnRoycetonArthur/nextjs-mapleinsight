'use client';

import { useState } from 'react';
import type { RoadmapOutput, RoadmapTask } from '@/lib/simulator/engines/roadmapTypes';
import { Panel } from './Panel';
import { trackEvent } from '@/lib/analytics';
import { deduplicateRoadmapLinks, stageHasNoLinks } from '@/lib/roadmap-utils';

interface StageConfig {
  title:      string;
  subtitle:   string;
  icon:       string;
  color:      string;
  lightColor: string;
}

const STAGE_CONFIG: Record<string, StageConfig> = {
  pre_arrival:   { title: 'Before You Arrive',  subtitle: 'Pre-arrival planning',  icon: '✈️', color: '#9333EA', lightColor: '#F5F0FF' },
  first_30_days: { title: 'First 30 Days',       subtitle: 'Essential setup',       icon: '🚀', color: '#1B7A4A', lightColor: '#E8F5EE' },
  month_2_3:     { title: 'Month 2–3',           subtitle: 'Building foundations',  icon: '🧱', color: '#B8860B', lightColor: '#FDF6E3' },
  month_4_6:     { title: 'Month 4–6',           subtitle: 'Growing & saving',      icon: '📈', color: '#2563EB', lightColor: '#EFF6FF' },
  month_7_12:    { title: 'Month 7–12',          subtitle: 'Looking ahead',         icon: '🏠', color: '#9333EA', lightColor: '#F5F0FF' },
};

const PRIORITY_COLORS: Record<string, string> = {
  do_now:   '#1B7A4A',
  do_soon:  '#B8860B',
  do_later: '#6B7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  do_now:   'Do Now',
  do_soon:  'Do Soon',
  do_later: 'Do Later',
};

const LINK_ICONS: Record<string, string> = {
  article:    '📄',
  calculator: '🧮',
  tool:       '🔧',
  guide:      '📋',
};

// Stage keys in display order (matches STAGE_ORDER in roadmapEngine)
const STAGE_KEYS = ['pre_arrival', 'first_30_days', 'month_2_3', 'month_4_6', 'month_7_12'] as const;

// Stages shown for settled persona only
const SETTLED_ONLY_STAGES = new Set(['month_4_6', 'month_7_12']);

// Overridden titles/subtitles for settled persona
const SETTLED_STAGE_OVERRIDES: Partial<Record<string, Pick<StageConfig, 'title' | 'subtitle'>>> = {
  month_4_6:  { title: 'Growing Your Money', subtitle: 'Invest & build wealth' },
  month_7_12: { title: 'Big Decisions',      subtitle: 'Housing, family & future' },
};

interface Props {
  roadmap:  RoadmapOutput;
  isMobile: boolean;
  stage?:   string | null;
}

export function RoadmapPanel({ roadmap, isMobile, stage }: Props) {
  const isSettled = stage === 'settled';
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string, task: RoadmapTask, stageKey: string) {
    const willCheck = !checked.has(id);
    trackEvent('roadmap_task_check', {
      task_id:  id,
      stage:    stageKey,
      priority: task.priority,
      checked:  willCheck,
    });
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeStages = STAGE_KEYS.filter((key) => {
    if (!roadmap.staged_tasks[key].length) return false;
    if (isSettled && !SETTLED_ONLY_STAGES.has(key)) return false;
    return true;
  });

  // De-duplicate link slugs across stages (AC-5: runs after persona filter)
  const deduplicatedTasks = deduplicateRoadmapLinks(activeStages, roadmap.staged_tasks);

  // Default: only the first stage is open
  const [openStages, setOpenStages] = useState<Set<string>>(
    () => new Set(activeStages.length > 0 ? [activeStages[0]] : []),
  );

  function toggleStage(key: string) {
    setOpenStages((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <Panel title="Your Personalized Roadmap" icon="🗺️" color="#1B4F4A">
      {/* Personalization summary */}
      <div style={{
        padding: '16px 18px', borderRadius: 12,
        background: 'linear-gradient(135deg, #1B4F4A08, #1B7A4A08)',
        border: '1px solid #1B7A4A15',
        marginBottom: 24,
        fontFamily: "'DM Sans', Helvetica, sans-serif",
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', margin: 0 }}>
          {roadmap.personalization_summary}
        </p>
      </div>

      {/* Stage list */}
      {activeStages.map((stageKey, stageIdx) => {
        const tasks    = (deduplicatedTasks[stageKey] ?? []) as RoadmapTask[];
        const baseCfg  = STAGE_CONFIG[stageKey] ?? STAGE_CONFIG.first_30_days;
        const override = isSettled ? SETTLED_STAGE_OVERRIDES[stageKey] : undefined;
        const cfg      = override ? { ...baseCfg, ...override } : baseCfg;
        const isLast = stageIdx === activeStages.length - 1;

        const isOpen = openStages.has(stageKey);

        return (
          <div
            key={stageKey}
            style={{
              marginBottom: isLast ? 0 : 12,
              borderTop: stageIdx > 0 ? '1px solid #F3F4F6' : 'none',
              paddingTop: stageIdx > 0 ? 12 : 0,
            }}
          >
            {/* Stage header — clickable to expand/collapse */}
            <button
              onClick={() => toggleStage(stageKey)}
              aria-expanded={isOpen}
              aria-controls={`stage-tasks-${stageKey}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', background: 'none', border: 'none',
                padding: '6px 0', cursor: 'pointer', marginBottom: isOpen ? 14 : 0,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: cfg.lightColor, border: `1px solid ${cfg.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }} aria-hidden="true">
                {cfg.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 18, fontWeight: 700, color: cfg.color, margin: 0, lineHeight: 1.2,
                }}>
                  {cfg.title}
                </h3>
                <span style={{
                  fontFamily: "'DM Sans', Helvetica, sans-serif",
                  fontSize: 11, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500,
                }}>
                  {cfg.subtitle} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </div>
              {/* Chevron */}
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="#9CA3AF" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Task cards — only rendered when stage is open */}
            {isOpen && (
            <div
              id={`stage-tasks-${stageKey}`}
              style={{
                marginLeft: isMobile ? 0 : 20,
                paddingLeft: isMobile ? 0 : 22,
                borderLeft: isMobile ? 'none' : `2px solid ${cfg.color}18`,
              }}
            >
              {/* Fallback when all links were de-duplicated away */}
              {stageHasNoLinks(tasks) && (
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #E5E7EB', background: '#FAFBFC',
                  marginBottom: 8,
                  fontFamily: "'DM Sans', Helvetica, sans-serif",
                  fontSize: 13, color: '#9CA3AF', fontStyle: 'italic',
                }}>
                  You&apos;ve already covered these topics in earlier phases.
                </div>
              )}
              {tasks.map((task) => {
                const isChecked = checked.has(task.task_id);
                return (
                  <div key={task.task_id} style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: `1px solid ${isChecked ? '#1B7A4A22' : '#E5E7EB'}`,
                    background: isChecked ? '#FAFBFC' : '#fff',
                    marginBottom: 8, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Checkbox button */}
                      <button
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-label={`Mark "${task.title}" as ${isChecked ? 'incomplete' : 'complete'}`}
                        onClick={() => toggle(task.task_id, task, stageKey)}
                        style={{
                          width: 22, height: 22, minWidth: 22, borderRadius: 6,
                          border: isChecked ? 'none' : '2px solid #E5E7EB',
                          background: isChecked ? cfg.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s',
                          padding: 0, marginTop: 1, flexShrink: 0,
                        }}
                      >
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title + priority badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{
                            fontFamily: "'DM Sans', Helvetica, sans-serif",
                            fontSize: 14, fontWeight: 600,
                            color: isChecked ? '#9CA3AF' : '#374151',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            transition: 'all 0.2s',
                          }}>
                            {task.title}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            fontFamily: "'DM Sans', Helvetica, sans-serif",
                            textTransform: 'uppercase', letterSpacing: 0.3,
                            background: `${PRIORITY_COLORS[task.priority]}14`,
                            color: PRIORITY_COLORS[task.priority],
                          }}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{
                          fontFamily: "'DM Sans', Helvetica, sans-serif",
                          fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: '0 0 8px',
                        }}>
                          {task.description}
                        </p>

                        {/* Links */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {task.links.map((link, li) => (
                            <a
                              key={li}
                              href={link.slug}
                              onClick={() => trackEvent('roadmap_link_click', { task_id: task.task_id, link_type: link.type, link_title: link.title, stage: stageKey })}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                fontFamily: "'DM Sans', Helvetica, sans-serif",
                                textDecoration: 'none',
                                color: cfg.color, background: cfg.lightColor,
                                border: `1px solid ${cfg.color}18`,
                                transition: 'background 0.2s',
                              }}
                            >
                              <span aria-hidden="true">{LINK_ICONS[link.type] ?? '📄'}</span>
                              {link.title}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2, flexShrink: 0 }} aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        );
      })}

      {/* Task count summary */}
      <div style={{
        marginTop: 16, textAlign: 'center',
        fontFamily: "'DM Sans', Helvetica, sans-serif",
        fontSize: 12, color: '#9CA3AF',
      }}>
        {roadmap.total_task_count} personalized tasks across {activeStages.length} stages
      </div>
    </Panel>
  );
}
