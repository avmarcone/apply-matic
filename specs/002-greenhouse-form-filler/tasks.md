---
description: "Task list for 002-greenhouse-form-filler"
---

# Tasks: Greenhouse Form Filler

**Input**: Design documents from `specs/002-greenhouse-form-filler/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/greenhouse.md ✅

**Tests**: Unit tests for selector matching and field-mapping logic (Playwright integration tests require a live page — out of scope for v1).

---

## Phase 1: Setup

**Purpose**: Extend shared types and create new source files.

- [x] T001 Extend `src/types.ts` — add `JobContext`, `OpenEndedQuestion`, and `FillResult` interfaces per `data-model.md`
- [x] T002 Create `src/selectors.ts` — export `STANDARD_FIELD_SELECTORS` (selector strings per field) and `OPEN_ENDED_LABEL_EXCLUSIONS` (label substrings to exclude from open-ended detection) per `research.md`

---

## Phase 2: Foundational

**Purpose**: Core field-matching utilities used by all user stories.

- [x] T003 [P] Create `src/greenhouse.ts` — export skeleton with `fillForm(job, profile): Promise<FillResult>` and `closeBrowser(page): Promise<void>`; stub both functions with TODOs; add JSDoc per contract
- [x] T004 [P] Add `isOpenEndedQuestion(labelText: string): boolean` helper to `src/greenhouse.ts` — returns true if `labelText` does not match any entry in `OPEN_ENDED_LABEL_EXCLUSIONS` (case-insensitive); add JSDoc
- [x] T005 [P] Add `extractJobDescription(page: Page): Promise<string>` helper to `src/greenhouse.ts` — tries selectors `#content`, `.job-description`, `[data-job-description]` in order; returns empty string on failure; add JSDoc

**Checkpoint**: `isOpenEndedQuestion` and `extractJobDescription` are independently callable and testable.

---

## Phase 3: User Story 1 — Fill standard fields (P1) 🎯 MVP

**Goal**: `fillForm` opens the Greenhouse URL and fills name, email, phone, LinkedIn,
work auth, education, experience, and resume from `profile.json`.

**Independent Test**: Call `fillForm` with a real Greenhouse URL and profile. Confirm
all standard fields are populated and `filledFields` lists each one. Confirm missing
fields appear in `skippedFields` without error.

### Unit Tests for User Story 1

- [x] T006 [P] [US1] Create `tests/unit/greenhouse.test.ts` — test `isOpenEndedQuestion` returns false for all standard label patterns (`email`, `linkedin`, `phone`, etc.); test it returns true for `"Why do you want to work here?"`; test case-insensitivity

### Implementation for User Story 1

- [x] T007 [US1] Implement standard field filling in `fillForm` in `src/greenhouse.ts`:
  launch headed Chromium; navigate to `job.url` with 30s timeout; for each standard
  field in `STANDARD_FIELD_SELECTORS`, try selector → fill from profile value; add
  to `filledFields` on success, `skippedFields` if not found; use `setInputFiles` for
  resume upload
- [x] T008 [US1] Add label-text fallback to `fillForm` — for fields not found by
  selector, scan `<label>` elements for case-insensitive matches (linkedin, work
  authorization, education, experience) and fill their associated inputs

**Checkpoint**: Standard fields are filled on a real Greenhouse posting; skipped fields
are logged, not thrown.

---

## Phase 4: User Story 2 — Detect open-ended questions (P1)

**Goal**: After standard fields are filled, `fillForm` scans the form for unfilled
textareas and text inputs whose labels are not in the exclusion list, and returns them
as `OpenEndedQuestion[]`.

**Independent Test**: Run `fillForm` against a Greenhouse posting with 2 open-ended
questions. Confirm `openEndedQuestions` has length 2 with correct `questionText` and
`fieldSelector` for each.

### Unit Tests for User Story 2

- [x] T009 [P] [US2] Extend `tests/unit/greenhouse.test.ts` — test `extractJobDescription` returns empty string when no matching selector is found (mock page); test `isOpenEndedQuestion` edge cases (empty string, whitespace-only label)

### Implementation for User Story 2

- [x] T010 [US2] Implement open-ended question detection in `fillForm` in `src/greenhouse.ts` — after standard field filling, query all `textarea` and `input[type="text"]` elements; for each, get the associated label text; if `isOpenEndedQuestion(label)` is true, add an `OpenEndedQuestion` to the result with `questionText`, a unique `fieldSelector`, and `JobContext`
- [x] T011 [US2] Call `extractJobDescription` inside `fillForm` and attach the result to each `OpenEndedQuestion`'s `context.jobDescription`

**Checkpoint**: `openEndedQuestions` array is populated correctly; questions without
matching standard labels are included; standard fields are excluded.

---

## Phase 5: User Story 3 — Keep browser open for review (P1)

**Goal**: `fillForm` returns the live Playwright `Page` object to the orchestrator.
The orchestrator uses it for answer injection (spec 003) and then calls `closeBrowser`
after the user's review decision.

**Independent Test**: After `fillForm` returns, confirm the browser window remains
open and interactive. Call `closeBrowser(result.page)` and confirm it closes cleanly.

### Implementation for User Story 3

- [x] T012 [US3] Ensure `fillForm` returns `result.page` (the live Playwright Page) — browser context MUST NOT be closed inside `fillForm`
- [x] T013 [US3] Implement `closeBrowser(page)` in `src/greenhouse.ts` — closes the browser context associated with the page; catches and swallows errors if already closed; add JSDoc
- [x] T014 [US3] Update `src/index.ts` — replace the stub `processJob` with a real implementation that calls `fillForm(job, profile)`, then calls the answer generator for each open-ended question (stub for now — spec 003), then calls `promptReview`, then calls `closeBrowser`

**Checkpoint**: End-to-end run opens browser, fills fields, pauses for review, closes
browser after user input.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T015 [P] Verify all exported functions in `src/greenhouse.ts` and `src/selectors.ts` have complete JSDoc (purpose, `@param`, `@returns`)
- [x] T016 Run `npm test` — confirm all unit tests pass including new greenhouse tests
- [x] T017 [P] Run `npm run build` — confirm zero TypeScript errors
- [x] T018 Run quickstart validation in `specs/002-greenhouse-form-filler/quickstart.md` against a real Greenhouse URL
- [x] T019 [P] Remove any dead code or commented-out blocks from `src/greenhouse.ts` and `src/selectors.ts`

---

## Dependencies & Execution Order

- **Phase 1**: No dependencies — start immediately
- **Phase 2**: Depends on Phase 1 (needs types from T001, selectors from T002)
- **Phase 3**: Depends on Phase 2
- **Phase 4**: Depends on Phase 3 (detection runs after standard field filling)
- **Phase 5**: Depends on Phase 3 + 4 (page must be filled before returning)
- **Phase 6**: Depends on all story phases

### Parallel opportunities

```bash
# Phase 2:
T003 greenhouse.ts skeleton
T004 isOpenEndedQuestion helper   (same file, but pure function — no DOM deps)
T005 extractJobDescription helper (same file, pure scraping logic)

# Phase 3 + 4 unit tests:
T006 greenhouse.test.ts (US1 tests)
T009 greenhouse.test.ts (US2 tests — extend same file after T006)
```

---

## Notes

- Playwright browser launch happens inside `fillForm` — each job gets its own browser instance
- `processJob` stub in `index.ts` is replaced in T014; spec 003 answer injection is stubbed until that spec is implemented
- Integration testing against a real Greenhouse URL is manual (quickstart) — no automated E2E in v1
