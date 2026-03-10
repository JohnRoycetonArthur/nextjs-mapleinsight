'use client'

import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface FAQItemData {
  question: string
  answer: string
  anchorSlug: string | null
}

interface FAQItemProps extends FAQItemData {
  index: number
}

function ChevronDownIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: 'transform 0.25s ease',
        transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CopyLinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function FAQItem({ question, answer, anchorSlug, index }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const handleCopyLink = () => {
    if (!anchorSlug) return
    const url = window.location.origin + pathname + '#' + anchorSlug
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      id={anchorSlug ?? undefined}
      style={{
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <span
            style={{
              fontFamily: "'DM Sans', Helvetica, sans-serif",
              fontSize: '10px',
              fontWeight: 700,
              color: '#B8860B',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            FAQ {index + 1}
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', Helvetica, sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              color: '#1B4F4A',
              lineHeight: 1.4,
            }}
          >
            {question}
          </span>
        </div>
        <ChevronDownIcon rotated={isOpen} />
      </button>

      <div
        ref={answerRef}
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? (answerRef.current?.scrollHeight ?? 0) + 'px' : '0px',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div
          style={{
            paddingBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', Helvetica, sans-serif",
              fontSize: '14px',
              color: '#374151',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {answer}
          </p>
          {anchorSlug && (
            <button
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                fontFamily: "'DM Sans', Helvetica, sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: copied ? '#1B7A4A' : '#9CA3AF',
                transition: 'color 0.2s',
                alignSelf: 'flex-start',
              }}
              title="Copy link to this answer"
            >
              <CopyLinkIcon />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface FAQSectionProps {
  faqItems: FAQItemData[]
}

export function FAQSection({ faqItems }: FAQSectionProps) {
  if (!faqItems || faqItems.length === 0) return null

  return (
    <section
      aria-labelledby="faq-heading"
      style={{
        marginTop: '48px',
        padding: '32px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      <h2
        id="faq-heading"
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '22px',
          fontWeight: 700,
          color: '#1B4F4A',
          marginBottom: '4px',
        }}
      >
        Frequently Asked Questions
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', Helvetica, sans-serif",
          fontSize: '13px',
          color: '#6B7280',
          marginBottom: '20px',
        }}
      >
        {faqItems.length} question{faqItems.length !== 1 ? 's' : ''}
      </p>
      <div>
        {faqItems.map((item, i) => (
          <FAQItem
            key={item.anchorSlug ?? i}
            index={i}
            question={item.question}
            answer={item.answer}
            anchorSlug={item.anchorSlug}
          />
        ))}
      </div>
    </section>
  )
}
