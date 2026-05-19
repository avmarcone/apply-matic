---
description: "Task list for 002-greenhouse-form-filler"
---

# Tasks: Greenhouse Form Filler

**Input**: Design documents from `specs/002-greenhouse-form-filler/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/greenhouse.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the greenhouse module skeleton so all story phases can work independently.

- [ ] T001 Create `src/greenhouse/` directory and empty module files: `types.ts`, `requiredChecker.ts`, `fieldDetector.ts`, `questionCollector.ts`, `fillForm.ts`
- [ ] T002 [P] Create `tests/unit/` directory with placeholder files: `requiredChecker.test.ts`, `fieldDetector.test.ts`, `questionCollector.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and Playwright browser setup that all user story phases depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Define `OpenEndedQuestion`, `JobContext`, and `FillResult` types in `src/greenhouse/types.ts` (per data-model.md)
- [ ] T004 Verify Playwright is installed and confirm `import { chromium } from 'playwright'` resolves without error in `src/greenhouse/fillForm.ts`

**Checkpoint**: Types defined, Playwright import resolves — user story phases can now begin.

---

## Phase 3: User Story 1 — Fill Required Greenhouse Fields (Priority: P1) 🎯 MVP

**Goal**: The tool opens a Greenhouse URL and fills all required standard fields (first
name, last name, email, phone, resume) from `profile.json` using a 5-strategy detection
cascade. Optional fields are left untouched.

**Independent Test**: Run `npm run dev` against the Garner Health URL. Confirm first name,
last name, email, phone, and resume are populated; confirm LinkedIn and optional fields
are left blank; confirm no crash when optional fields are absent.

### Implementation for User Story 1

- [ ] T005 [US1] Implement `isRequired(page, locator)` in `src/greenhouse/requiredChecker.ts` — checks HTML `required` attr, asterisk in associated label text, and required CSS class (`required`, `field--required`)
- [ ] T006 [P] [US1] Write unit tests for `requiredChecker` covering: element with `required` attr, label with `*`, label without `*`, CSS class present, all absent — in `tests/unit/requiredChecker.test.ts`
- [ ] T007 [US1] Implement `detectField(page, fieldDef)` in `src/greenhouse/fieldDetector.ts` — tries strategies in order: (1) `name` attr, (2) `aria-label`, (3) label text, (4) placeholder, (5) Greenhouse CSS; returns first matching `Locator` or `null` (use selector lists from research.md)
- [ ] T008 [P] [US1] Write unit tests for `fieldDetector` covering: field found on strategy 1, field found only on strategy 3, field not found on any strategy — in `tests/unit/fieldDetector.test.ts` (use `page.setContent` with mock HTML)
- [ ] T009 [US1] Implement `fillRequiredFields(page, profile)` in `src/greenhouse/fillForm.ts` — iterates required field definitions, runs `detectField` + `isRequired` per field, fills matched required fields from profile, appends undetected fields to `skippedFields[]`; uses `setInputFiles` for resume
- [ ] T010 [US1] Wire `fillRequiredFields` into the `fillForm(job, profile)` export in `src/greenhouse/fillForm.ts` — launches headed Chromium, navigates to `job.url`, calls `fillRequiredFields`, returns partial `FillResult`

**Checkpoint**: Required fields fill correctly; optional fields untouched; no crash on missing fields.

---

## Phase 4: User Story 2 — Identify Open-Ended Questions (Priority: P1)

**Goal**: After required fields are filled, the tool scans the form for open-ended textarea
and text inputs that are not standard fields, collects them with job context, and includes
them in `FillResult`.

**Independent Test**: Run against a Greenhouse posting with 1–2 open-ended questions.
Confirm each question appears in `FillResult.openEndedQuestions` with its full label text
and the correct `JobContext`. Confirm standard field labels are excluded.

### Implementation for User Story 2

- [ ] T011 [US2] Implement `collectOpenEndedQuestions(page, context)` in `src/greenhouse/questionCollector.ts` — finds all `<textarea>` and `<input type="text">` elements, resolves each associated label, excludes labels matching standard-field patterns (see research.md Decision 2), returns `OpenEndedQuestion[]`
- [ ] T012 [P] [US2] Write unit tests for `questionCollector` covering: textarea with open-ended label collected, textarea with standard-field label excluded, multiple questions returned, no textareas returns empty array — in `tests/unit/questionCollector.test.ts`
- [ ] T013 [US2] Implement `scrapeJobDescription(page)` in `src/greenhouse/fillForm.ts` — tries selectors `#content`, `.job-description`, `[data-job-description]` in order; returns text content or empty string on failure
- [ ] T014 [US2] Integrate `collectOpenEndedQuestions` and `scrapeJobDescription` into `fillForm(job, profile)` — call after required fields are filled; populate `FillResult.openEndedQuestions` with full `JobContext`

**Checkpoint**: Open-ended questions collected with context; standard fields excluded; no crash on zero questions.

---

## Phase 5: User Story 3 — Human Review Pause (Priority: P1)

**Goal**: After all fields are filled and questions collected, the browser stays open and
the terminal prompts the user to review. Confirming marks the job `applied`; declining
marks it `review-needed`. The form is never auto-submitted.

**Independent Test**: Run end-to-end on a Greenhouse posting. Confirm the browser window
remains interactive after filling. Confirm terminal shows the review prompt. Confirm `y`
updates `jobs.csv` to `applied`, `n` updates to `review-needed`, and the browser closes.

### Implementation for User Story 3

- [ ] T015 [US3] Add a `reviewAndConfirm(fillResult, job)` function in `src/index.ts` (or `src/cli/review.ts`) — prints filled fields and open-ended questions to terminal, prompts `[y]es / [n]o / [q]uit`, waits for user input; does NOT click submit under any condition
- [ ] T016 [US3] Implement `updateJobStatus(jobsPath, jobUrl, status)` in `src/jobs.ts` — writes `applied` or `review-needed` to the matching row in `jobs.csv`
- [ ] T017 [US3] Integrate review flow into main runner in `src/index.ts` — call `fillForm`, then `reviewAndConfirm`; on confirm write `applied`, on decline write `review-needed`; call `closeBrowser(page)` in both cases

**Checkpoint**: Full end-to-end flow works; browser never auto-submits; job status updated correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 [P] Add JSDoc to all exported functions in `src/greenhouse/` (fillForm, detectField, isRequired, collectOpenEndedQuestions, closeBrowser) per constitution Principle II
- [ ] T019 [P] Add error handling in `fillForm.ts` for page load timeout (>30s): catch error, call `closeBrowser`, return error to caller so orchestrator marks job `review-needed`
- [ ] T020 Run quickstart.md verification checklist manually against the Garner Health Greenhouse URL — confirm all checkboxes pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — can begin as soon as types + Playwright verified
- **US2 (Phase 4)**: Depends on Phase 3 (`fillForm` skeleton must exist)
- **US3 (Phase 5)**: Depends on Phase 4 (`FillResult` must be complete)
- **Polish (Phase 6)**: Depends on Phase 5

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends on US1 completion — needs `fillForm` skeleton and `FillResult` type
- **US3 (P1)**: Depends on US2 completion — needs complete `FillResult` with questions

### Parallel Opportunities

- T002 can run in parallel with T001
- T006 (requiredChecker tests) and T007 (fieldDetector impl) can run in parallel after T005
- T008 (fieldDetector tests) can run in parallel with T009 (fillRequiredFields impl) after T007
- T012 (questionCollector tests) and T013 (scrapeJobDescription) can run in parallel after T011
- T018 and T019 can run in parallel

---

## Parallel Example: User Story 1

```bash
# After T005 is complete, launch in parallel:
Task T006: "Unit tests for requiredChecker in tests/unit/requiredChecker.test.ts"
Task T007: "Implement detectField in src/greenhouse/fieldDetector.ts"
```

---

## Implementation Strategy

### MVP (all three US are P1 — sequential end-to-end flow)

All three user stories are P1 and form a single end-to-end flow; none delivers
standalone value without the others. Complete in priority order:

1. Complete Phase 1 + Phase 2: Setup and types
2. Complete Phase 3 (US1): Required field filling
3. Complete Phase 4 (US2): Question collection
4. Complete Phase 5 (US3): Review pause
5. **VALIDATE**: Run quickstart.md against a real Greenhouse URL
6. Complete Phase 6: Polish

---

## Notes

- [P] tasks = different files, no blocking dependencies within the phase
- All story tasks map to spec.md user stories for full traceability
- Constitution Principle V is enforced at T015 — no submit path exists in the codebase
- Tests in Phase 3/4 use `page.setContent()` with mock HTML — no live browser needed
