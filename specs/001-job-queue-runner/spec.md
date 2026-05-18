# Feature Specification: Job Queue Runner

**Feature Branch**: `001-job-queue-runner`

**Created**: 2026-05-18

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Run the job queue and apply to pending jobs (Priority: P1)

A user has a `jobs.csv` file containing a list of job postings with their URL, company,
role, and current status. They run `applymatic` from the command line. The tool reads the
CSV top-to-bottom, skips jobs already marked `applied` or `skipped`, and processes each
`pending` job sequentially — opening the URL, passing control to the form filler, and
updating the row's status when done.

**Why this priority**: This is the core orchestration loop. Nothing else in the tool works
without it.

**Independent Test**: A user can run `applymatic` with a seeded `jobs.csv` and confirm the
tool reads the file, identifies pending jobs, and updates statuses — even with stub
implementations of the form filler and answer generator.

**Acceptance Scenarios**:

1. **Given** a `jobs.csv` with 3 rows (1 pending, 1 applied, 1 skipped),
   **When** the user runs `applymatic`,
   **Then** only the pending job is processed; the other two are skipped silently.

2. **Given** a pending job is processed successfully,
   **When** the user reviews the job,
   **Then** its status in `jobs.csv` is updated to `applied`.

3. **Given** a pending job requires human review,
   **When** the user declines to submit,
   **Then** its status in `jobs.csv` is updated to `review-needed`.

4. **Given** `jobs.csv` does not exist or is empty,
   **When** the user runs `applymatic`,
   **Then** a clear, actionable error message is displayed and the tool exits cleanly.

---

### User Story 2 — Load and validate personal profile (Priority: P1)

Before processing any job, the tool loads `profile.json` — a local file containing the
user's personal info (name, email, phone, LinkedIn URL, work authorization, years of
experience, education, and resume text). If the file is missing or malformed, the tool
halts with a clear error before opening any browser.

**Why this priority**: Profile data underpins form filling. A missing or invalid profile
should fail fast — not mid-application.

**Independent Test**: Run `applymatic` with a valid `profile.json` and confirm it loads
without error. Run again with a missing file and confirm a clear error message is shown
before any browser opens.

**Acceptance Scenarios**:

1. **Given** a valid `profile.json` exists,
   **When** the tool starts,
   **Then** profile data is loaded and available to the form filler without error.

2. **Given** `profile.json` is missing,
   **When** the user runs `applymatic`,
   **Then** an error message tells them exactly where to create the file and what
   fields are required; no browser is opened.

3. **Given** `profile.json` exists but is missing required fields,
   **When** the tool starts,
   **Then** it lists the missing fields and exits before processing any job.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST read `jobs.csv` from the project root and process rows
  sequentially top-to-bottom.
- **FR-002**: The tool MUST skip rows with status `applied` or `skipped` without processing them.
- **FR-003**: The tool MUST process rows with status `pending` in order.
- **FR-004**: After each job is processed, the tool MUST update the row's status in
  `jobs.csv` to either `applied` or `review-needed`.
- **FR-005**: The tool MUST load `profile.json` before opening any browser session and
  halt with a clear error if the file is missing or invalid.
- **FR-006**: The tool MUST expose a single CLI entry point (`applymatic`) that can be
  run from the terminal with no required arguments.
- **FR-007**: The tool MUST process jobs sequentially — no parallel browser sessions in v1.
- **FR-008**: The tool MUST display progress to the user as each job is processed (e.g.,
  "Processing job 2 of 5: Acme Corp — Senior Engineer").
- **FR-009**: If an unexpected error occurs during job processing (e.g., browser crash,
  network timeout), the tool MUST write `review-needed` to that job's status, log the
  error message to stderr, and continue processing the next pending job.

### Key Entities

- **Job**: A row in `jobs.csv`. Fields: `url`, `company`, `role`,
  `status` (`pending` | `applied` | `skipped` | `review-needed`).
- **Profile**: Contents of `profile.json`. Fields: `name`, `email`, `phone`,
  `linkedinUrl`, `workAuthorization`, `yearsOfExperience`, `education`, `resumeText`.

## Success Criteria *(mandatory)*

- **SC-001**: A user can run `applymatic` against a queue of 10 jobs without the tool
  crashing or hanging.
- **SC-002**: All pending jobs in `jobs.csv` are attempted in order; no pending job is
  silently skipped.
- **SC-003**: `jobs.csv` reflects the correct final status for every processed job after
  the run completes.
- **SC-004**: A missing or invalid `profile.json` produces an error message specific
  enough for the user to fix the problem without reading documentation.
- **SC-005**: The tool starts and reaches the first job within 3 seconds of the user
  running `applymatic`.

## Clarifications

### Session 2026-05-18

- Q: What should happen to a job's status when an unexpected error occurs mid-processing? → A: Write `review-needed`, log the error to stderr, continue to next job.
- Q: Should the tool write a debug log file for troubleshooting? → A: stdout/stderr only — no log file in v1.
- Q: Should the tool deduplicate jobs by URL before processing? → A: No deduplication — process every `pending` row regardless of URL.

## Assumptions

- `jobs.csv` and `profile.json` live in the working directory where the user runs
  `applymatic`.
- The user has already populated `profile.json` manually before running the tool.
- Internet connectivity is assumed to be available.
- A single user runs the tool on their local machine; no multi-user or concurrent
  execution scenarios are in scope for v1.
- No log file is written in v1 — all output goes to stdout (progress) and stderr
  (errors) only.
- No deduplication of job URLs — every `pending` row is processed as-is. Duplicate
  rows are the user's responsibility to manage.
- The form filler and answer generator are treated as injected dependencies by this
  orchestrator — their internal behavior is out of scope for this spec.
