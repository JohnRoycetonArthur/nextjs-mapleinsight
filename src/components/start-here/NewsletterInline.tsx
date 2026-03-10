"use client";

import { useState } from "react";

export function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to actual newsletter provider (US-4.1)
    setSubmitted(true);
  }

  return (
    <section
      className="no-print"
      style={{
        background: "#F3F4F6",
        borderTop: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          textAlign: "center",
        }}
        className="px-4 py-10 md:px-6 md:py-14"
      >
        <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 12 }}>📬</div>
        <h3
          style={{
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            fontSize: 22,
            color: "#1B4F4A",
            margin: "0 0 8px",
            fontWeight: 700,
          }}
        >
          Get the Newcomer&apos;s Financial Checklist
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            margin: "0 0 24px",
            lineHeight: 1.6,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}
        >
          Subscribe to Maple Insight and receive our free PDF checklist
          covering every financial step for your first year in Canada.
        </p>

        {submitted ? (
          <p style={{ color: "#1B7A4A", fontWeight: 600, fontSize: 15 }}>
            Thank you! Check your inbox for the checklist.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: 420, margin: "0 auto" }}
            className="flex flex-col gap-[10px] md:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Your email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                outline: "none",
                background: "#fff",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#1B7A4A",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#155e38")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1B7A4A")}
            >
              Subscribe Free
            </button>
          </form>
        )}

        <p
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 12,
            lineHeight: 1.5,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}
        >
          No spam. Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </section>
  );
}
