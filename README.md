# Maple Insight Canada (Next.js)

A calm, Canada-focused site with built-in calculators:
- RRSP Refund (Ontario + Federal 2025 simplified brackets)
- Mortgage Comparison
- CCB Impact (Federal CCB, Jul 2025–Jun 2026)
- Car Financing Comparison

## Run locally
```bash
npm install
npm run dev
```

## Analytics
Google Analytics is routed through Google Tag Manager, not direct `gtag.js`.

Create `.env.local` from `.env.example`, set `NEXT_PUBLIC_GTM_ID`, then use `node scripts/analytics/4-setup-guide.js` to complete the GTM and GA4 dashboard steps. Custom app events are pushed into `window.dataLayer` from `src/lib/analytics.ts`.

## Deploy
Push to GitHub and Vercel will deploy automatically (repo is connected).
