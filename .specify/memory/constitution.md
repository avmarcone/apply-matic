<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0
New principles: I. Clean Code, II. Method-Level Documentation, III. Basic Unit Testing,
                IV. Secrets Safety, V. Human-in-the-Loop, VI. Simplicity
Added sections: Tech Stack, Development Workflow
Removed sections: none
Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gates align with principles
  ✅ .specify/templates/spec-template.md — no conflicts; requirements sections compatible
  ✅ .specify/templates/tasks-template.md — test tasks marked optional, consistent with Principle III
Deferred TODOs: none
-->

# apply-matic Constitution

## Core Principles

### I. Clean Code

Code MUST be readable, purposeful, and consistently structured. Functions and modules MUST have
a single, clear responsibility. Dead code, commented-out blocks, and unused imports MUST be
removed before merging. Naming MUST be explicit — abbreviations are only acceptable when
universally understood in context (e.g., `url`, `csv`, `api`).

**Rationale**: A CLI tool that automates sensitive actions (form filling, API calls) must be
auditable and easy to reason about. Opaque code creates risk.

### II. Method-Level Documentation

Every exported function and class MUST have a JSDoc comment describing its purpose, parameters,
and return value. Internal helper functions SHOULD be documented when their behavior is
non-obvious. Inline comments MUST explain *why*, not *what* — the code explains what.

**Rationale**: This project integrates multiple concerns (Playwright, Claude API, CSV parsing).
Clear documentation reduces context-switching cost and makes the codebase accessible for future
contributors.

### III. Basic Unit Testing

Core logic MUST have unit tests covering the happy path and at least one failure/edge case.
Tests live in `tests/unit/` and MUST be runnable via a single `npm test` command. Tests MUST
NOT require a live browser, network connection, or real API key to pass — mock/stub externals.

**Rationale**: Playwright and Claude API calls are expensive and slow. Unit tests MUST isolate
business logic so it can be verified cheaply and repeatedly.

### IV. Secrets Safety

`profile.json` and `.env` MUST be listed in `.gitignore` and MUST never be committed to version
control. The repository MUST only contain `.env.example` with placeholder values. Code MUST
load secrets exclusively via `process.env` — no secrets hardcoded or interpolated into source.

**Rationale**: `profile.json` contains PII (name, email, phone, resume text). A single
accidental commit could expose personal data publicly and permanently.

### V. Human-in-the-Loop

The browser MUST pause for human review before any form is submitted. Auto-submission is
explicitly out of scope for v1 and MUST NOT be implemented, even as an opt-in flag. Every job
run MUST wait for explicit user confirmation at the review step.

**Rationale**: Automated job applications submitted without review create reputational risk.
User trust depends on the human always having final say.

### VI. Simplicity

The v1 scope is Greenhouse ATS only. New ATS platforms (Workday, Lever, Ashby), frontend UIs,
and cover letter generation MUST NOT be added until the MVP success criteria are validated.
Every added dependency MUST be justified — prefer Node.js built-ins before reaching for a
library.

**Rationale**: YAGNI. The fastest path to a working tool is a narrow, well-executed scope.
Complexity compounds quickly in browser automation projects.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 22+
- **Browser automation**: Playwright (Chromium)
- **AI**: Claude API via `@anthropic-ai/sdk` (Sonnet)
- **Data**: `csv-parse` for jobs.csv, `dotenv` for environment config
- **Testing**: to be confirmed at `/speckit-plan` stage

All stack changes MUST be reflected in `package.json` and documented in the relevant spec.

## Development Workflow

- All new features MUST be developed on a feature branch off `apply-matic-v1`
- Commits MUST be atomic and scoped to a single logical change
- `profile.json` and `.env` MUST be verified absent before every push
- `npm run build` MUST succeed with zero TypeScript errors before merging

## Governance

This constitution supersedes all other development practices for apply-matic. Amendments
require: (1) a written rationale, (2) a version bump per semantic versioning rules, and
(3) an update to `LAST_AMENDED_DATE`. All specs and plans MUST pass a Constitution Check
against the principles above before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
