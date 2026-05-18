---
description: "Task list for 001-job-queue-runner"
---

# Tasks: Job Queue Runner

**Input**: Design documents from `specs/001-job-queue-runner/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/cli.md ✅

**Tests**: Unit tests included per constitution Principle III (happy path + one edge case per module).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

**Purpose**: Install missing dependencies and establish test infrastructure.

- [ ] T001 Install missing runtime dependencies: `npm install zod csv-stringify`
- [ ] T002 Install missing dev dependencies: `npm install --save-dev vitest @vitest/coverage-v8`
- [ ] T003 Add `test` and `coverage` scripts to `package.json`: `"test": "vitest run", "coverage": "vitest run --coverage"`
- [ ] T004 Create `src/types.ts` with `Job`, `JobStatus`, `Profile`, and `RunResult` TypeScript types per `data-model.md`

---

## Phase 2: Foundational

**Purpose**: Core shared infrastructure required before any user story can be implemented.

⚠️ **CRITICAL**: No user story work begins until this phase is complete.

- [ ] T005 [P] Create `src/profile.ts` — export `loadProfile(path: string): Profile` that reads and JSON-parses the file, then validates with the Zod `ProfileSchema`; throw with field-level error messages on failure; add JSDoc
- [ ] T006 [P] Create `src/queue.ts` — export `readQueue(path: string): Job[]` that reads and parses `jobs.csv` using `csv-parse/sync`; throw with a clear error if file is missing or columns are wrong; add JSDoc
- [ ] T007 Add `writeQueue(path: string, jobs: Job[]): void` to `src/queue.ts` — serialises updated job array back to `jobs.csv` using `csv-stringify/sync`; overwrites file in place; add JSDoc
- [ ] T008 Add `filterPending(jobs: Job[]): Job[]` to `src/queue.ts` — returns only jobs with status `pending`; add JSDoc

**Checkpoint**: `loadProfile`, `readQueue`, `writeQueue`, and `filterPending` are implemented and individually callable.

---

## Phase 3: User Story 1 — Run the job queue and process pending jobs (P1) 🎯 MVP

**Goal**: `applymatic` reads `jobs.csv`, skips non-pending rows, processes each pending job
sequentially, shows progress, and writes the final status back to `jobs.csv`.

**Independent Test**: Run `npm run dev` with a seeded `jobs.csv` (1 pending, 1 applied, 1 skipped)
and a valid `profile.json`. Confirm only the pending job is processed and its status is updated.

### Unit Tests for User Story 1

- [ ] T009 [P] [US1] Create `tests/unit/queue.test.ts` — test `readQueue` happy path with a valid CSV string; test that a missing file throws with an actionable message; test that `filterPending` returns only `pending` rows and ignores `applied`/`skipped`/`review-needed`
- [ ] T010 [P] [US1] Create `tests/unit/profile.test.ts` — test `loadProfile` happy path with a valid profile object; test that a missing file throws; test that an invalid email throws with a field-level error; test that a missing required field throws naming that field

### Implementation for User Story 1

- [ ] T011 [US1] Create `src/index.ts` — load `.env` via `dotenv/config`; call `loadProfile('./profile.json')` and print "Loading profile... OK"; call `readQueue('./jobs.csv')` and print pending/applied/skipped counts; iterate `filterPending(jobs)` sequentially, delegating each to a stub `processJob` function; add JSDoc to all exports
- [ ] T012 [US1] Add `processJob(job: Job, profile: Profile): Promise<RunResult>` stub to `src/index.ts` — for now, print the job company and role, then call `promptReview()` and return the result; this will be replaced by real form filling in spec 002
- [ ] T013 [US1] Add `promptReview(job: Job): Promise<'applied' | 'review-needed'>` to `src/index.ts` — uses `readline` to display the review prompt from `contracts/cli.md`; accepts `y`, `n`, or `q`; `q` writes `review-needed` and exits the process; add JSDoc
- [ ] T014 [US1] Add status write-back to the orchestration loop in `src/index.ts` — after `processJob` resolves, call `writeQueue` with the updated job status; print progress per `contracts/cli.md` stdout format
- [ ] T015 [US1] Add run summary to `src/index.ts` — after all jobs are processed, print "Run complete. Applied: N | Review needed: N | Errors: N"

**Checkpoint**: `npm run dev` processes a pending job end-to-end (stub form fill → review prompt → status written to CSV).

---

## Phase 4: User Story 2 — Load and validate personal profile (P1)

**Goal**: Missing or invalid `profile.json` halts the tool before any browser opens, with
a specific, actionable error message.

**Independent Test**: Run with `profile.json` deleted — confirm error names required fields and
exits cleanly. Run with an invalid email — confirm field-level error message. Confirm no
browser window opens in either case.

### Unit Tests for User Story 2

- [ ] T016 [P] [US2] Extend `tests/unit/profile.test.ts` — test that a profile with missing `resumeFilePath` throws naming that field; test that a non-numeric `yearsOfExperience` throws a type error; test that a non-existent `resumeFilePath` throws a file-not-found error

### Implementation for User Story 2

- [ ] T017 [US2] Add `resumeFilePath` existence check to `loadProfile` in `src/profile.ts` — after Zod validation passes, verify the file at `resumeFilePath` exists on disk using `fs.existsSync`; throw with a clear message if not found
- [ ] T018 [US2] Add startup error handling to `src/index.ts` — wrap `loadProfile` and `readQueue` calls in a try/catch; print errors to stderr in the format from `contracts/cli.md`; exit with code 1 on any startup failure before processing begins
- [ ] T019 [US2] Add per-job error handling to the orchestration loop in `src/index.ts` — wrap each `processJob` call in a try/catch; on unexpected error write `review-needed` via `writeQueue`, print the error to stderr, and continue to the next pending job (FR-009); include error count in the run summary

**Checkpoint**: `applymatic` exits with code 1 and a specific error on any profile or queue problem — no browser opens. Unexpected mid-run errors write `review-needed` and continue rather than crashing.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T020 [P] Verify all exported functions in `src/types.ts`, `src/queue.ts`, `src/profile.ts`, and `src/index.ts` have complete JSDoc comments (purpose, `@param`, `@returns`)
- [ ] T021 [P] Run `npm run build` — resolve all TypeScript strict-mode errors; confirm `dist/index.js` is produced
- [ ] T022 Run `npm test` — confirm all unit tests pass; fix any failures
- [ ] T023 Run the quickstart validation steps in `specs/001-job-queue-runner/quickstart.md` end-to-end; confirm all checkboxes pass
- [ ] T024 [P] Remove any unused imports, dead code, or commented-out blocks from all `src/` files per constitution Principle I

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — can start once foundational is complete
- **User Story 2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 after T005
- **Polish (Phase 5)**: Depends on all story phases being complete

### Within Each Phase

- T005 and T006–T008 can run in parallel (different files)
- T009 and T010 can run in parallel (different test files)
- T011–T015 must run in order (each builds on the previous)
- T016 can run in parallel with T011–T015 (different test file)
- T017–T018 can run after T005 and T011 respectively

### Parallel Opportunities

```bash
# Phase 2 — run in parallel:
Task T005: Create src/profile.ts
Task T006–T008: Create src/queue.ts (all in one file)

# Phase 3 unit tests — run in parallel:
Task T009: tests/unit/queue.test.ts
Task T010: tests/unit/profile.test.ts

# Phase 4 — run in parallel with Phase 3 after T005:
Task T016: Extend tests/unit/profile.test.ts
Task T017: Add file check to src/profile.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (T009–T015)
4. **STOP and VALIDATE**: run `npm run dev` with a seeded CSV; confirm status write-back
5. Then continue to Phase 4

### Incremental Delivery

1. Phase 1 + 2 → foundational modules ready
2. Phase 3 → `applymatic` runs end-to-end with stub form fill
3. Phase 4 → startup validation hardened
4. Phase 5 → polish before merging to `apply-matic-v1`

---

## Notes

- `processJob` is intentionally a stub in this spec — the real implementation comes from spec `002-greenhouse-form-filler`
- `[P]` tasks touch different files and have no shared in-progress dependencies
- Write tests first for T009, T010, T016 — confirm they fail before implementing the modules they test
- Commit after each phase checkpoint
