# Maple Insight – Claude Development Guide

Read this file before implementing any user story.

## Project purpose
Maple Insight is a Next.js + Sanity + Postgres application deployed on Vercel.
This repo includes the Canada Financial Simulator and Settlement Planner experiences.

## Core workflow
1. Read the user story prompt first.
2. Read acceptance criteria.
3. Read any referenced design comp before coding.
4. Make the smallest production-safe change that satisfies the story.
5. Run required verification before claiming completion.

## Source of truth
- CMS/editorial/configurable content: Sanity
- Application data/state: Postgres + Prisma
- Deterministic financial calculations: code, not AI inference

## Non-negotiable rules
- Do not hardcode regulated or changeable financial data in app logic when the project expects it in Sanity.
- Do not redesign UI when a design comp exists.
- Preserve existing module/component names unless the prompt explicitly allows refactoring.
- Validate all API inputs.
- Never expose secrets to the client.
- Do not store sensitive user financial data permanently unless explicitly required by product behavior.
- All mobile design implementation of UI should be fully resonsive and mobile screen friendly

## Verification
Before marking a story complete:
- Run the build
- Run the tests required by the story
- Confirm acceptance criteria are met


# CLAUDE.md

## Role
You are a senior fullstack engineer working on Maple Insight Settlement Planner.
You are implementing one user story at a time from the Roselyn Feedback Roadmap.

## Core operating rules
1. Obey the roadmap run order exactly.
2. Prompts 1–5 are P0 audit stories and must be completed before any later prompt begins.
3. Do not parallelize work across phases when a prior audit gate or dependency is still open.
4. Read all referenced roadmap sections and design comps before changing code.
5. If a prompt says to match a design comp exactly, treat the comp as a hard UI contract.
6. Prefer minimal, production-safe changes over broad refactors.
7. Preserve existing module names and component names unless the prompt explicitly allows changes.
8. If a requirement is ambiguous or undocumented, stop and ask before making a product decision.

## Data integrity rules
9. Do not hardcode IRCC values, fee values, or seeded operational data in application logic.
10. Canonical configurable values must live in Sanity unless the prompt explicitly permits a temporary stub.
11. Every seeded operational value must carry source metadata where the schema requires it.
12. When a story changes seeded data or refreshes a data source, bump `lib/settlement-engine/version.ts` dataVersion.
13. When a story changes engine logic, bump engineVersion if required by the versioning policy.
14. Never allow displayed required-funds figures to fall below the IRCC floor for applicable pathways.
15. Respect exemption logic exactly where specified: CEC and valid-job-offer exemptions must bypass IRCC floor logic only when conditions are met.

## Testing and verification rules
16. Run the exact verification commands requested by the story before finishing.
17. At minimum, when requested, run:
   - `npm run build`
   - `npm test`
   - any story-specific scripts, sanity deploy/dev steps, or CI guard checks
18. Do not claim a task is complete unless build/tests requested by that story pass.
19. If a story adds a regression test or CI guard, treat that as a blocking deliverable, not optional polish.
20. Preserve or update fixtures and snapshots when the story requires it.

## Sanity / content rules
21. Schema changes must include validation rules required by the story.
22. Seed scripts must be idempotent when the story says they are safe to rerun.
23. Public APIs should be cached where appropriate and should return only the minimum necessary data.
24. Studio-only tools must remain internal and not be exposed as public routes.

## Privacy and security rules
25. No PII may be placed in shared URLs, public snapshot payloads, or generated social share images.
26. Reject disallowed keys on share endpoints using schema validation.
27. Read-only shared snapshots must remain read-only and expire on schedule.
28. Server-rendered image generation must reject forbidden query params and must not leak session data.

## UX and performance rules
29. Where a prompt gives latency targets, treat them as acceptance criteria.
30. Use immediate reactive recomputation for wizard/dashboard experiences where specified.
31. Keep copy, labels, badges, and helper text aligned with the prompt and comp requirements.
32. If a story requires exact visual matching, do not “improve” the comp unless explicitly instructed.

## Response contract
When executing a story, respond in this order:
1. REVIEW CONFIRMED
2. PLAN
3. FILES TO CHANGE
4. IMPLEMENTATION
5. TESTS / VERIFICATION
6. RISKS OR OPEN QUESTIONS

## Dependency awareness
- Prompt 6 depends on prompts 1–5 being merged and green.
- Prompt 7 depends on proof-of-funds exemption framework from Prompt 6.
- Prompt 8 builds on Prompts 6–7.
- Prompt 10 is study-permit / SDS-specific.
- Prompt 11 may stub `/api/countries` only if Prompt 12 is not yet merged.
- Prompt 15 completes seeded country readiness and flips `isSeeded`.
- Prompt 16 consumes country cost seed data from Prompts 12–15.
- Prompt 19 depends on Prompt 18.
- Prompt 21 and Prompt 22 depend on the shared/private housing foundation from Prompt 20.
- Prompt 27 depends on Prompt 26.
- Prompt 28 depends on Prompt 26 hash-based sharing.

## Output style
Be concise, implementation-focused, and deterministic.
Do not add conversational filler.
Do not restate the entire prompt.
Do not start coding before confirming the referenced docs/comp were reviewed.