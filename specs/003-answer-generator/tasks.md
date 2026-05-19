---
description: "Task list for 003-answer-generator"
---

# Tasks: Answer Generator

**Input**: Design documents from `specs/003-answer-generator/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/answer.md ✅

**Tests**: Unit tests with mocked Anthropic client — no real API calls in tests.

---

## Phase 1: Setup

- [x] T001 Extend `src/types.ts` — add `AnswerResult` and `InjectionSummary` interfaces per `data-model.md`
- [x] T002 Create `src/answer.ts` — export skeleton with `generateAnswer` and `injectAnswers` stubs; add JSDoc per contract

---

## Phase 2: Foundational

- [x] T003 Add `buildMessages(question, resumeText)` helper to `src/answer.ts` — constructs the Anthropic API message array with cached system prompt + resume block and uncached question block per `research.md` Decision 4; returns `MessageParam[]`; add JSDoc

**Checkpoint**: `buildMessages` is independently testable — takes inputs, returns structured message array, no API call.

---

## Phase 3: User Story 1 — Generate contextual answers (P1) 🎯 MVP

**Goal**: `generateAnswer` calls Claude with the constructed prompt and returns a
2–4 sentence answer referencing the job description and resume.

**Independent Test**: Call `generateAnswer` with a mock Anthropic client returning a
fixed response. Confirm the returned `AnswerResult` has the correct `answer`,
`questionText`, and `fieldSelector`. Confirm errors are captured, not thrown.

### Unit Tests for User Story 1

- [x] T004 [P] [US1] Create `tests/unit/answer.test.ts` — mock `@anthropic-ai/sdk`;
  test `buildMessages` returns correct structure with `cache_control` on system and
  resume blocks; test `generateAnswer` returns correct `AnswerResult` on success;
  test `generateAnswer` returns `error` field (not throw) on API failure

### Implementation for User Story 1

- [x] T005 [US1] Implement `generateAnswer` in `src/answer.ts` — instantiate
  `Anthropic` client from `process.env.ANTHROPIC_API_KEY`; call
  `client.messages.create` with model `claude-sonnet-4-5`, `max_tokens: 300`, and
  messages from `buildMessages`; extract text from response; return `AnswerResult`;
  wrap in try/catch — on error return `AnswerResult` with empty answer and error message

**Checkpoint**: `generateAnswer` returns correct answer structure with mocked client;
catches and wraps API errors without throwing.

---

## Phase 4: User Story 2 — Handle multiple questions without repetition (P2)

**Goal**: `injectAnswers` processes all open-ended questions sequentially, injects
each answer into the form via Playwright, and returns an `InjectionSummary`.

**Independent Test**: Call `injectAnswers` with a mocked page and 2 questions. Confirm
`InjectionSummary.answered === 2`, both field selectors were called with `fill()`, and
a failed injection increments `failed` without crashing.

### Unit Tests for User Story 2

- [x] T006 [P] [US2] Extend `tests/unit/answer.test.ts` — test `injectAnswers` calls
  `generateAnswer` once per question; test that a failed `generateAnswer` increments
  `failed` in summary and continues; test that injection failure (mock page throws)
  increments `failed` and continues

### Implementation for User Story 2

- [x] T007 [US2] Implement `injectAnswers` in `src/answer.ts` — iterate questions
  sequentially; call `generateAnswer` for each; on success call
  `page.locator(fieldSelector).fill(answer)` and increment `answered`; on any error
  log to stderr and increment `failed`; return `InjectionSummary`
- [x] T008 [US2] Update `src/index.ts` — replace the answer generation stub in
  `processJob` with a real call to `injectAnswers(fillResult.page, fillResult.openEndedQuestions, profile.resumeText)`;
  log answered/failed counts from `InjectionSummary`

**Checkpoint**: End-to-end run fills standard fields, generates and injects answers,
pauses for review.

---

## Phase 5: Polish

- [x] T009 [P] Verify all exports in `src/answer.ts` have complete JSDoc
- [x] T010 Run `npm test` — confirm all unit tests pass
- [x] T011 [P] Run `npm run build` — confirm zero TypeScript errors
- [ ] T012 Run quickstart validation in `specs/003-answer-generator/quickstart.md`
- [x] T013 [P] Remove dead code and commented-out stubs from `src/index.ts` and `src/answer.ts`

---

## Dependencies & Execution Order

- **Phase 1**: No dependencies
- **Phase 2**: Depends on Phase 1 (needs types from T001)
- **Phase 3**: Depends on Phase 2 (buildMessages used by generateAnswer)
- **Phase 4**: Depends on Phase 3 (injectAnswers calls generateAnswer)
- **Phase 5**: Depends on all story phases

### Parallel opportunities

```bash
# Phase 3 + 4 test tasks (same file, write sequentially):
T004: answer.test.ts US1 tests
T006: answer.test.ts US2 tests (extend same file after T004)
```
