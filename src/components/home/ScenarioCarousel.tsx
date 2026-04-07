'use client';

import { useEffect, useRef, useState } from 'react';
import { SCENARIOS } from '@/lib/scenarios';
import type { Scenario } from '@/lib/scenarios';
import { ScenarioCard } from './ScenarioCard';

// Display order: student → skilled professional → work permit → family
const DISPLAY_ORDER = ['student_toronto', 'professional_ee', 'worker_calgary', 'family_pnp'];
const ORDERED_SCENARIOS = DISPLAY_ORDER.map(
  (type) => SCENARIOS.find((s) => s.type === type)!,
);

// ─── Dot indicators ───────────────────────────────────────────────────────────

function DotIndicators({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 16 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === activeIndex ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i === activeIndex ? '#1B7A4A' : '#D1D5DB',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── ScenarioCarousel ─────────────────────────────────────────────────────────

interface ScenarioCarouselProps {
  onCardClick: (scenario: Scenario) => void;
}

export function ScenarioCarousel({ onCardClick }: ScenarioCarouselProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartIndexRef = useRef(0);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Track active card on mobile scroll
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;
    const container = scrollRef.current;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = (container.firstChild as HTMLElement)?.offsetWidth || 300;
      const gap = 16;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveCard(Math.min(index, ORDERED_SCENARIOS.length - 1));
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  const scrollToCard = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = Array.from(container.children) as HTMLElement[];
    const target = cards[index];
    if (!target) return;
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    setActiveCard(index);
  };

  if (isMobile) {
    return (
      <div>
        <div
          ref={scrollRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Immigration scenario examples"
          className="scenario-scroll"
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingLeft: 20,
            paddingRight: 60,
            paddingBottom: 4,
          }}
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0]?.clientX ?? null;
            touchStartIndexRef.current = activeCard;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartXRef.current;
            const endX = event.changedTouches[0]?.clientX ?? null;
            touchStartXRef.current = null;
            if (startX == null || endX == null) return;

            const deltaX = startX - endX;
            const swipeThreshold = 32;

            if (Math.abs(deltaX) < swipeThreshold) {
              scrollToCard(touchStartIndexRef.current);
              return;
            }

            const direction = deltaX > 0 ? 1 : -1;
            const nextIndex = Math.max(
              0,
              Math.min(ORDERED_SCENARIOS.length - 1, touchStartIndexRef.current + direction),
            );
            scrollToCard(nextIndex);
          }}
        >
          {ORDERED_SCENARIOS.map((s, i) => (
            <ScenarioCard
              key={s.type}
              scenario={s}
              onClick={onCardClick}
              index={i}
              isMobile
            />
          ))}
        </div>
        <DotIndicators count={SCENARIOS.length} activeIndex={activeCard} />
      </div>
    );
  }

  const gridColumns = isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';
  const maxWidth = isTablet ? 640 : 1160;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Immigration scenario examples"
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: 16,
        maxWidth,
        margin: '0 auto',
      }}
    >
      {ORDERED_SCENARIOS.map((s, i) => (
        <ScenarioCard
          key={s.type}
          scenario={s}
          onClick={onCardClick}
          index={i}
          isMobile={false}
        />
      ))}
    </div>
  );
}
