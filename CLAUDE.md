Maple Insight – Claude Development Guide
Claude must read this file before implementing any user story.
This repository contains the implementation of the Canada Financial Simulator tool for MapleInsight.ca.
Claude should use this file as the primary guide for understanding the project structure, coding conventions, and development workflow.
---
Project Overview
Maple Insight is a Next.js application deployed on Vercel.
The Canada Financial Simulator helps newcomers estimate:
potential salary in Canada
tax deductions
net income
cost of living
affordability based on family size
personalized financial roadmap
The simulator integrates with existing Maple Insight articles and calculators.
---
Technology Stack
Frontend
Next.js (App Router)
React
TypeScript
TailwindCSS
Backend
Next.js Route Handlers
Node runtime on Vercel
Data
Postgres
Prisma ORM
Content
Sanity CMS
---
Folder Structure
All simulator work is under the Epic 9 structure.
/9
/9.1
/9.2
/9.3
/9.4
/9.5
/9.6
/9.7
/9.8
Each folder contains:
the user story prompt
related design files
implementation artifacts
Example:
9/
9.2/
US-9.2 prompt.md
US-9.2-onboarding-wizard-design-comp.jsx
---
Development Workflow
Claude should implement features one user story at a time.
Steps:
Read the prompt file in the user story folder
Review acceptance criteria
Review design comp (if present)
Implement feature
Validate acceptance criteria
Write tests if required
---
Design Implementation Rules
Some user stories include design comp files (.jsx).
These files represent the visual specification.
Claude must:
inspect the design component first
replicate layout exactly
maintain spacing, typography, and color
ensure responsive behavior
Goal:
Pixel-perfect match with design comp.
Do not redesign UI.
---
Financial Calculation Rules
Important:
Financial formulas must NOT rely on AI.
All calculations must be deterministic code.
Examples:
tax brackets
CPP/EI contributions
benefit estimates
cost-of-living estimates
These must be implemented using structured data.
---
Simulator Architecture
The simulator follows this pattern:
User Input → Simulation Engine → Result Dashboard
Components:
Onboarding Wizard
Salary Estimation Engine
Tax Calculation Engine
Cost-of-Living Engine
Roadmap Generator
Results Dashboard
---
Data Sources
The simulator uses:
Statistics Canada wage data
Government tax brackets
Job Bank wage estimates
internal cost-of-living models
Data should be stored in Postgres.
---
Coding Standards
Use:
TypeScript strict mode
Functional React components
Server-side computation for financial calculations
Follow patterns already used in the Maple Insight project.
---
Performance Goals
The simulator should:
load under 2 seconds
compute results under 300ms
be mobile friendly
---
Security Rules
Never store sensitive financial data permanently unless the user explicitly saves a scenario.
Do not expose server secrets to client.
Validate all API inputs.
---
Testing Expectations
Claude should verify:
acceptance criteria are satisfied
calculation outputs are correct
edge cases handled
UI matches design comp
---
Implementation Goal
The MVP simulator should allow a user to:
Answer onboarding questions
Estimate potential salary
Estimate taxes and net income
Estimate living expenses
View affordability
Receive a financial roadmap
Access related Maple Insight articles and tools
---
Important Principle
Build the simplest working implementation first.
Avoid overengineering.
Focus on:
accuracy
clarity
maintainability