# Feature Specification: Answer Generator

**Feature Branch**: `003-answer-generator`

**Created**: 2026-05-18

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Generate contextual answers to open-ended application questions (Priority: P1)

When the form filler identifies an open-ended question it cannot fill from `profile.json`,
it passes the question text, the job description, and the user's resume to the answer
generator. The answer generator returns a 2–4 sentence response that is specific to the
role and company — not generic filler. The response is inserted into the form field
automatically.

**Why this priority**: Open-ended questions are the primary remaining blocker to fast bulk
applying. Generic answers hurt candidacy; contextual answers add real value.

**Independent Test**: Call the answer generator with a sample question ("Why do you want
to work at Acme?"), a sample job description, and a sample resume. Confirm the response
is 2–4 sentences, references specific details from the job description or resume, and
reads naturally.

**Acceptance Scenarios**:

1. **Given** the question "Why do you want to work here?", a job description mentioning
   the company's focus on ML infrastructure, and a resume with relevant ML experience,
   **When** the answer generator is called,
   **Then** the response references the company's ML focus and connects it to the
   user's background — not a generic enthusiasm statement.

2. **Given** the question "Describe your experience with Kubernetes",
   **When** the answer generator is called with a resume that includes Kubernetes
   experience,
   **Then** the response draws specific details from the resume rather than fabricating
   experience.

3. **Given** the question "What are your salary expectations?",
   **When** the answer generator is called,
   **Then** the response provides a reasonable, non-committal answer appropriate for
   an application form (e.g., "I'm open to discussing compensation based on the full
   scope of the role").

4. **Given** the resume does not mention experience relevant to a question,
   **When** the answer generator is called,
   **Then** the response is honest and does not fabricate experience — it pivots to
   transferable skills or genuine interest instead.

---

### User Story 2 — Handle multiple open-ended questions in a single application (Priority: P2)

A single Greenhouse application may contain 2–5 open-ended questions. The answer
generator handles each question independently, ensuring answers are distinct and not
repetitive across fields within the same application.

**Why this priority**: Multiple questions per application are common. Repetitive answers
across fields would be obvious and damaging to the application.

**Independent Test**: Call the answer generator with 3 different questions from the same
job posting. Confirm each answer is unique, contextually appropriate, and does not
recycle phrasing from the other answers.

**Acceptance Scenarios**:

1. **Given** 3 open-ended questions from the same application,
   **When** the answer generator processes all three,
   **Then** each answer is distinct in phrasing and substance.

2. **Given** two questions that are thematically similar (e.g., "Why this company?" and
   "What excites you about this role?"),
   **When** the answer generator processes both,
   **Then** the answers approach the topic from different angles rather than restating
   the same points.

---

### Edge Cases

- What if the AI returns a response longer than the form field's character limit?
- What if the API call fails or times out mid-application?
- What if a question is ambiguous or has no reasonable answer (e.g., a required field
  asking for a specific certification the user doesn't have)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The answer generator MUST accept a question, a job description, and a
  resume as inputs and return a written response.
- **FR-002**: Responses MUST be 2–4 sentences in length by default.
- **FR-003**: Responses MUST reference specific details from the job description or
  resume — not generic statements.
- **FR-004**: The answer generator MUST NOT fabricate experience, credentials, or
  achievements not present in the user's resume.
- **FR-005**: If the API call fails, the answer generator MUST return a clear error
  so the form filler can flag the field for manual completion rather than leaving
  it blank silently.
- **FR-006**: The answer generator MUST handle at least the following question types:
  "why this company", "why this role", "describe your experience with X",
  "salary expectations", and general motivation questions.

### Key Entities

- **Question**: The full text of an open-ended form field label or prompt.
- **JobContext**: Company name, role title, and full job description text.
- **ResumeText**: The plain-text resume from `profile.json`.
- **GeneratedAnswer**: The 2–4 sentence response returned for insertion into the form.

## Success Criteria *(mandatory)*

- **SC-001**: 9 out of 10 generated answers reference at least one specific detail
  from the job description or resume (verifiable by manual spot-check).
- **SC-002**: Zero generated answers fabricate experience, credentials, or achievements
  not present in the resume.
- **SC-003**: Each answer is generated and returned within 10 seconds under normal
  network conditions.
- **SC-004**: A failed API call produces a handled error — never an unhandled crash or
  a silently blank form field.
- **SC-005**: Answers across multiple questions in the same application are non-repetitive
  (no phrase reused verbatim across answers for the same job).

## Assumptions

- The user's resume text in `profile.json` is sufficient context for the AI to generate
  relevant answers. No additional document parsing is in scope for v1.
- The job description is available as plain text — no parsing of PDFs or complex
  layouts is required.
- Answer length defaults to 2–4 sentences; no per-question length configuration is
  needed in v1.
- The AI model and API credentials are configured via environment variables before
  the tool is run.
- Response quality is the user's responsibility to review during the human review pause
  — the tool does not grade or self-evaluate its own outputs.
