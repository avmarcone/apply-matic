# Feature Specification: Greenhouse Form Filler

**Feature Branch**: `002-greenhouse-form-filler`

**Created**: 2026-05-18

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Automatically fill standard Greenhouse fields from profile (Priority: P1)

Given a Greenhouse job application URL, the tool opens the page in a browser and
automatically fills all standard fields — name, email, phone, LinkedIn URL, work
authorization, years of experience, education, and resume upload — using values from
the user's `profile.json`. The user does not need to touch the keyboard or mouse
during this phase.

**Why this priority**: Filling standard fields is the primary time-saving value of the
tool. It eliminates the repetitive data entry that makes bulk applying tedious.

**Independent Test**: Point the tool at a Greenhouse job URL with a valid `profile.json`.
Confirm all standard fields are populated correctly without any manual input. Verify
against 2–3 different Greenhouse job postings to confirm field detection is reliable.

**Acceptance Scenarios**:

1. **Given** a Greenhouse job posting with all standard fields present,
   **When** the form filler runs,
   **Then** name, email, phone, LinkedIn URL, work authorization, years of experience,
   education, and resume are all populated from `profile.json` without errors.

2. **Given** a Greenhouse posting where some optional fields are absent,
   **When** the form filler runs,
   **Then** only present fields are filled; missing fields are skipped without error.

3. **Given** a field the tool cannot confidently map,
   **When** the form filler encounters it,
   **Then** it flags the field as an open-ended question and passes it to the answer
   generator rather than leaving it blank or guessing incorrectly.

---

### User Story 2 — Identify and surface open-ended text questions (Priority: P1)

After filling standard fields, the tool scans the form for open-ended text inputs
(e.g., "Why do you want to work here?", "Describe your experience with X") that
cannot be filled from `profile.json`. It collects each question and the surrounding
context (job title, company name, job description) and passes them to the answer
generator.

**Why this priority**: Open-ended questions are the second half of what makes applying
slow. Without handling them, many Greenhouse applications cannot be completed.

**Independent Test**: Run the form filler against a Greenhouse posting known to have
open-ended questions. Confirm the tool correctly identifies them and surfaces them with
their full question text — without attempting to fill them itself.

**Acceptance Scenarios**:

1. **Given** a Greenhouse form with 2 open-ended text questions,
   **When** the form filler runs,
   **Then** both questions are identified and passed to the answer generator with their
   full question text and job context.

2. **Given** a Greenhouse form with no open-ended questions,
   **When** the form filler runs,
   **Then** it completes without invoking the answer generator.

---

### User Story 3 — Pause for human review before submission (Priority: P1)

After all fields are filled (standard and open-ended), the tool pauses with the
browser window visible and prompts the user to review the completed form. The user
can make manual corrections, then either confirm to mark the job `applied` or decline
to mark it `review-needed`. The tool never submits the form automatically.

**Why this priority**: This is a non-negotiable safety constraint from the constitution.
Auto-submission is out of scope for v1.

**Independent Test**: Run the tool end-to-end on a Greenhouse posting. Confirm the
browser window remains open and interactive after filling, and the tool waits for
explicit terminal confirmation before updating `jobs.csv`.

**Acceptance Scenarios**:

1. **Given** all fields have been filled,
   **When** the form filler completes,
   **Then** the browser window stays visible and a terminal prompt asks the user to
   review and confirm.

2. **Given** the user confirms submission,
   **When** they respond to the prompt,
   **Then** the job status is updated to `applied` in `jobs.csv`.

3. **Given** the user declines,
   **When** they respond to the prompt,
   **Then** the job status is updated to `review-needed` and the browser closes.

---

### Edge Cases

- What if the Greenhouse page fails to load or returns an error?
- What if a required field (e.g., resume upload) cannot be located on the page?
- What if the form has CAPTCHA or bot-detection that blocks automation?
- What if the job posting has already closed?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST open the provided job URL in a Chromium browser session.
- **FR-002**: The tool MUST detect and fill standard Greenhouse fields: name, email,
  phone, LinkedIn URL, work authorization, years of experience, education, and resume.
- **FR-003**: The tool MUST map each standard field to the corresponding value in
  `profile.json`.
- **FR-004**: The tool MUST detect open-ended free-text questions and pass them — with
  job context — to the answer generator rather than leaving them blank.
- **FR-005**: The tool MUST pause after filling all fields and wait for explicit user
  confirmation before any further action.
- **FR-006**: The tool MUST NOT click the submit button automatically under any
  circumstance.
- **FR-007**: The tool MUST handle missing optional fields gracefully (skip, no error).
- **FR-008**: If a page fails to load or a required field cannot be found, the tool
  MUST surface a clear error and mark the job `review-needed` rather than crashing.

### Key Entities

- **StandardField**: A Greenhouse form field that maps directly to a `profile.json`
  value (e.g., email input → `profile.email`).
- **OpenEndedQuestion**: A free-text input or textarea on the form that cannot be
  mapped to `profile.json` and requires AI-generated content.
- **JobContext**: The data passed alongside each open-ended question — includes company
  name, role title, and job description text.

## Success Criteria *(mandatory)*

- **SC-001**: Standard fields are filled correctly on at least 3 distinct Greenhouse
  job postings without manual intervention.
- **SC-002**: Open-ended questions are identified and surfaced with 100% recall — no
  question is silently skipped.
- **SC-003**: The browser is never auto-submitted; the tool always pauses and waits
  for user input.
- **SC-004**: A failed page load or missing field results in a `review-needed` status
  update, never an unhandled crash.
- **SC-005**: The form filling phase (standard fields only) completes in under
  30 seconds per job posting.

## Assumptions

- All target job postings in v1 use the Greenhouse ATS platform. Non-Greenhouse URLs
  are out of scope.
- Resume upload is handled as a file upload input pointing to a local file path stored
  in `profile.json`.
- The tool runs on a machine with a display available for Chromium (no headless-only
  environments in v1, since the user must review the form).
- CAPTCHA and active bot-detection bypassing are out of scope for v1.
- The job description text is available on the same page as the application form, or
  passed in via `jobs.csv`.
