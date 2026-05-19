# Implementation Plan: Answer Generator

**Branch**: `003-answer-generator` | **Date**: 2026-05-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-answer-generator/spec.md`

## Summary

Build `src/answer.ts` — a module that calls the Claude API to generate contextual
2–4 sentence answers for open-ended Greenhouse application questions, then injects
them into the live Playwright page. Uses prompt caching on the system prompt and
resume text to reduce API cost across multi-question applications. Updates
`src/index.ts` to replace the answer generation stub from spec 002.

## Technical Context

**Language/Version**: TypeScript 6 / Node.js 22+

**Primary Dependencies**:
- `@anthropic-ai/sdk` — Claude API client (already installed)
- `playwright` — for answer injection into the live page (already installed)
- Types from `src/types.ts` (specs 001–002)

**No new runtime dependencies required.**

**Storage**: N/A — stateless; reads profile, writes to DOM

**Testing**: Vitest unit tests for prompt construction and error handling (API calls mocked)

**Target Platform**: macOS local CLI

**Project Type**: CLI tool module

**Performance Goals**: Each answer generated and injected within 10 seconds (SC-003)

**Constraints**: Never fabricate experience; 2–4 sentence limit; graceful API error handling

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Clean Code | ✅ | `answer.ts` single responsibility: generate + inject answers |
| II. Method-Level Documentation | ✅ | JSDoc on all exports |
| III. Basic Unit Testing | ✅ | Unit tests with mocked Anthropic client |
| IV. Secrets Safety | ✅ | `ANTHROPIC_API_KEY` loaded via `process.env` only |
| V. Human-in-the-Loop | ✅ | Answers injected into form for user review before submission |
| VI. Simplicity | ✅ | No new dependencies; per-question calls are simple and debuggable |

**Result**: All gates pass. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-answer-generator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── answer.md
└── tasks.md
```

### Source Code

```text
src/
  answer.ts              # generateAnswer(), injectAnswers()
  types.ts               # Extended with AnswerResult, InjectionSummary

tests/
└── unit/
    └── answer.test.ts   # Unit tests with mocked Anthropic client
```

**Structure Decision**: Single project. `answer.ts` added to existing `src/`.
`src/index.ts` updated to replace the answer generation stub with `injectAnswers`.

## Complexity Tracking

> No constitution violations — this section is not required.
