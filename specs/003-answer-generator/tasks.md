---
description: "Task list for 003-answer-generator"
---

# Tasks: Answer Generator

**Input**: Design documents from `specs/003-answer-generator/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/answer.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the answer module skeleton so all story phases can work independently.

- [ ] T001 Create `src/answer/` directory and empty module files: `types.ts`, `aiProvider.ts`, `claudeProvider.ts`, `ollamaProvider.ts`, `demographicFilter.ts`, `generateAnswer.ts`, `injectAnswers.ts`
- [ ] T002 [P] Create `tests/unit/` directory (if not already from spec 002) with empty files: `demographicFilter.test.ts`, `generateAnswer.test.ts`, `ollamaProvider.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and AIProvider interface that all story phases depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Define `AnswerResult`, `InjectionSummary`, and `AIProvider` interface types in `src/answer/types.ts` (per data-model.md — include `status: 'answered' | 'skipped' | 'failed'`, `skipReason`, `skipped` count on InjectionSummary)

**Checkpoint**: Types and interface defined — provider implementations and story phases can begin.

---

## Phase 3: User Story 1 — Generate Contextual Answers to Narrative Questions (Priority: P1) 🎯 MVP

**Goal**: Given a narrative open-ended question, resume text, and job context, the answer
generator calls the Claude API and returns a 2–4 sentence response that references
specific resume or job description details. Demographic questions are filtered before any
AI call and returned with `status: 'skipped'`.

**Independent Test**: Call `generateAnswer` directly with a narrative question ("Why do
you want to work here?") and a mock `ClaudeProvider`. Confirm the response is 2–4
sentences. Call it again with a demographic question ("What is your race/ethnicity?")
and confirm no provider call is made and `status === 'skipped'`.

### Implementation for User Story 1

- [ ] T004 [US1] Implement `isDemographic(questionText: string): boolean` in `src/answer/demographicFilter.ts` using the keyword list from research.md Decision 6 (case-insensitive substring match; no external dependencies)
- [ ] T005 [P] [US1] Write unit tests for `demographicFilter` covering: keyword match returns true, partial match returns true, unrelated text returns false, empty string returns false — in `tests/unit/demographicFilter.test.ts`
- [ ] T006 [US1] Implement `ClaudeProvider` class in `src/answer/claudeProvider.ts` — wraps `@anthropic-ai/sdk`, model from `CLAUDE_MODEL` env var (default `claude-sonnet-4-6`), applies `cache_control: { type: "ephemeral" }` to system prompt and resume block per research.md Decision 3
- [ ] T007 [US1] Implement `createAIProvider(): AIProvider` factory in `src/answer/aiProvider.ts` — reads `AI_PROVIDER` env var, returns `ClaudeProvider` when value is `'claude'` or unset (Ollama branch stubbed as `throw new Error('not yet implemented')` until US3)
- [ ] T008 [US1] Implement `generateAnswer(question, resumeText, provider)` in `src/answer/generateAnswer.ts` — (1) call `isDemographic`, return `{status:'skipped', skipReason:'demographic'}` if true; (2) build prompt per research.md Decision 4; (3) call `provider.generate`; (4) return `{status:'answered', answer}` or `{status:'failed', error}` on exception; never throws
- [ ] T009 [P] [US1] Write unit tests for `generateAnswer` using a mock `AIProvider` implementation: narrative question answered, demographic question skipped with no provider call, provider error returns `status:'failed'` — in `tests/unit/generateAnswer.test.ts`

**Checkpoint**: Single-question answer generation works with Claude; demographic questions skipped.

---

## Phase 4: User Story 2 — Handle Multiple Questions Per Application (Priority: P2)

**Goal**: A single application may have 2–5 open-ended questions. `injectAnswers`
processes all of them sequentially, injects successful answers into the live Playwright
page, logs skipped demographic questions for manual review, and returns a complete
`InjectionSummary` with counts.

**Independent Test**: Call `injectAnswers` with 3 questions (1 narrative, 1 demographic,
1 narrative) and a mock provider. Confirm: 2 answers injected, 1 skipped with terminal
log, `InjectionSummary.answered === 2`, `skipped === 1`, `failed === 0`.

### Implementation for User Story 2

- [ ] T010 [US2] Implement `injectAnswers(page, questions, resumeText, provider)` in `src/answer/injectAnswers.ts` — calls `generateAnswer` sequentially; `answered`: fills via `page.locator(fieldSelector).fill(answer)` and logs; `skipped`: logs "⚠ skipped (demographic) — review manually"; `failed`: logs to stderr; returns `InjectionSummary`
- [ ] T011 [US2] Wire `injectAnswers` into the main runner in `src/index.ts` — call after `fillForm` returns `FillResult`, passing the live `page`, `openEndedQuestions`, `profile.resumeText`, and the provider from `createAIProvider()`; print `InjectionSummary` totals before the review prompt

**Checkpoint**: Multiple questions processed; skipped demographic questions listed in terminal before user review.

---

## Phase 5: User Story 3 — Local Model for Lower Environments (Priority: P2)

**Goal**: When `AI_PROVIDER=ollama` is set, the tool generates answers via a local Ollama
instance instead of the Claude API. No API key is needed. Switching between providers
requires only an environment variable change — no code modification.

**Independent Test**: Set `AI_PROVIDER=ollama OLLAMA_MODEL=llama3` and run the tool.
Confirm answers come from Ollama (no `ANTHROPIC_API_KEY` required). Set an invalid
`OLLAMA_PORT=9999` and confirm a clear connection error is thrown — not a silent
fallback to Claude.

### Implementation for User Story 3

- [ ] T012 [US3] Implement `OllamaProvider` class in `src/answer/ollamaProvider.ts` — HTTP POST to `http://localhost:{OLLAMA_PORT}/api/generate` using native `fetch`; model from `OLLAMA_MODEL` env var; port from `OLLAMA_PORT` (default `11434`); on fetch failure throws `Error('Ollama unreachable at ...')` with host/port in message
- [ ] T013 [P] [US3] Write unit tests for `OllamaProvider` using mocked `fetch`: successful response returns text, network error throws with clear message, wrong port produces descriptive error — in `tests/unit/ollamaProvider.test.ts`
- [ ] T014 [US3] Update `createAIProvider()` in `src/answer/aiProvider.ts` — replace the Ollama stub with a real `OllamaProvider` instantiation; validate that `OLLAMA_MODEL` is set when `AI_PROVIDER=ollama`, throw descriptive error if missing

**Checkpoint**: `AI_PROVIDER=ollama` generates answers locally; bad Ollama config fails loudly.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Add JSDoc to all exported functions in `src/answer/` (createAIProvider, generateAnswer, injectAnswers, isDemographic) per constitution Principle II
- [ ] T016 [P] Add `.env.example` entries for `AI_PROVIDER`, `OLLAMA_MODEL`, `OLLAMA_PORT`, `CLAUDE_MODEL` with placeholder values and comments explaining each
- [ ] T017 Run quickstart.md verification checklist — Steps 1–7 — against a real Greenhouse URL with at least one open-ended and one demographic question

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — can begin as soon as types defined
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — `generateAnswer` must exist
- **US3 (Phase 5)**: Depends on Phase 2 types only — can start in parallel with US1 if staffed
- **Polish (Phase 6)**: Depends on Phase 5

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no dependencies on US2 or US3
- **US2 (P2)**: Depends on US1 — `injectAnswers` wraps `generateAnswer`
- **US3 (P2)**: Depends on Phase 2 types only — `OllamaProvider` is independent of US1 logic

### Parallel Opportunities

- T002 can run in parallel with T001
- T005 (demographicFilter tests) can run in parallel with T006 (ClaudeProvider impl) after T004
- T009 (generateAnswer tests) can run in parallel with T010 (injectAnswers impl) after T008
- T013 (OllamaProvider tests) can run in parallel with T012 (OllamaProvider impl)
- T015 and T016 can run in parallel in Phase 6

---

## Parallel Example: User Story 1

```bash
# After T004 is complete, launch in parallel:
Task T005: "Unit tests for demographicFilter in tests/unit/demographicFilter.test.ts"
Task T006: "Implement ClaudeProvider in src/answer/claudeProvider.ts"
```

---

## Implementation Strategy

### MVP First (US1 is the critical path)

US1 delivers the core value proposition. US2 and US3 extend it. Recommended order:

1. Complete Phase 1 + Phase 2: Setup and types
2. Complete Phase 3 (US1): Single narrative question → Claude → answer
3. **VALIDATE**: Call `generateAnswer` manually, confirm demographic filtering works
4. Complete Phase 4 (US2): Multiple questions, injection, summary
5. Complete Phase 5 (US3): Ollama local provider
6. Complete Phase 6: Polish
7. **VALIDATE**: Run full quickstart.md checklist

### Parallel Option (if US3 is urgent)

US3 (`OllamaProvider`) can be developed in parallel with US1 since it only depends on
the `AIProvider` interface from Phase 2.

---

## Notes

- [P] tasks = different files, no blocking dependencies within the phase
- Mock `AIProvider` in US1 tests eliminates all network dependencies for unit testing
- Constitution Principle IV: `ANTHROPIC_API_KEY` and `OLLAMA_MODEL` only via `process.env`
- `OllamaProvider` uses native `fetch` — no additional HTTP library dependency needed
