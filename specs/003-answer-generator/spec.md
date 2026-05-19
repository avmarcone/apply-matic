# Feature Specification: Answer Generator

**Feature Branch**: `003-answer-generator`

**Created**: 2026-05-18

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Generate contextual answers to open-ended narrative questions (Priority: P1)

When the form filler identifies a free-text field requiring a narrative response (e.g.,
"Why Figma?", "What is an achievement you are most proud of?", "Describe your experience
with X"), it passes the question text, the job description, and the user's resume to the
answer generator. The answer generator returns a 2–4 sentence response specific to the
role and company — not generic filler. The response is inserted into the form field.

Only **open-ended textbox questions** — those expecting a written narrative answer in a
text input or textarea — trigger the answer generator. Questions that are demographic,
EEO, or ask the user to self-identify (race, gender, disability status, veteran status,
etc.) are **never** passed to the AI and are left for the user to complete manually
during the review pause.

**Why this priority**: Narrative open-ended questions are the primary remaining blocker
to fast bulk applying. Demographic questions must never be auto-answered — they require
honest self-identification by the user, and mishandling them carries legal and ethical
risk.

**Independent Test**: Call the answer generator with a sample narrative question ("Why
do you want to work at Acme?"), a sample job description, and a sample resume. Confirm
the response is 2–4 sentences, references specific details from the job or resume, and
reads naturally. Also confirm that passing a demographic question (e.g., "What is your
gender identity?") causes the answer generator to reject it rather than return a
response.

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

3. **Given** a demographic or EEO question (e.g., "What is your race/ethnicity?",
   "Do you identify as having a disability?"),
   **When** the form filler encounters it,
   **Then** the question is NOT passed to the answer generator and is flagged for
   manual completion during the user review pause.

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

### User Story 3 — Use a local model in lower environments (Priority: P2)

When running the tool in a non-production environment (e.g., local development, testing),
the user can configure it to use a locally-running Ollama model instead of the cloud AI
provider. This eliminates API costs during iterative testing and allows development
without network access to the cloud provider.

**Why this priority**: Repeatedly calling a paid cloud API during development and testing
wastes money and adds latency. A free local fallback makes iteration fast and cost-free.

**Independent Test**: Set the environment to a lower environment configuration and run
the answer generator with a sample question. Confirm the response is generated via
Ollama (locally) and no cloud API calls are made.

**Acceptance Scenarios**:

1. **Given** the tool is configured to use Ollama (lower environment),
   **When** the answer generator is called,
   **Then** the response is generated by the local Ollama instance and no cloud API
   request is made.

2. **Given** the tool is configured to use the cloud AI provider (production),
   **When** the answer generator is called,
   **Then** the response is generated via the cloud API, not Ollama.

3. **Given** Ollama is configured but not running,
   **When** the answer generator is called,
   **Then** a clear error is returned identifying the Ollama connection failure — the
   tool does not silently fall back to the cloud provider.

---

### Edge Cases

- What if the AI returns a response longer than the form field's character limit?
- What if the API call fails or times out mid-application?
- What if a question is ambiguous or has no reasonable answer (e.g., a required field
  asking for a specific certification the user doesn't have)?
- What if a question is borderline — open-ended in form but demographic in intent
  (e.g., "Tell us about your background and identity")? Flag for manual review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The answer generator MUST only process open-ended narrative questions —
  free-text inputs or textareas where the expected response is a written explanation,
  motivation, or opinion. It MUST reject any other question type.
- **FR-002**: The answer generator MUST detect and reject demographic and EEO questions.
  Demographic questions include (but are not limited to): race/ethnicity, gender
  identity, disability status, veteran status, and similar self-identification prompts.
  Detection uses keyword matching against the question text and label (e.g., "race",
  "gender", "disability", "veteran", "ethnicity", "identify", "EEO", "diversity").
  Rejected questions are returned to the caller with a `skipped: demographic` status
  and are NOT answered.
- **FR-003**: Responses MUST be 2–4 sentences in length by default.
- **FR-004**: Responses MUST reference specific details from the job description or
  resume — not generic statements.
- **FR-005**: The answer generator MUST NOT fabricate experience, credentials, or
  achievements not present in the user's resume.
- **FR-006**: If the AI provider call fails, the answer generator MUST return a clear
  error so the form filler can flag the field for manual completion rather than leaving
  it blank silently.
- **FR-007**: The answer generator MUST support two AI provider modes: a cloud provider
  (default, production) and Ollama (local, lower environments). The active provider is
  selected via environment configuration — no code changes required to switch.
- **FR-008**: When using Ollama, the model name and endpoint URL MUST be configurable
  via environment variables. The tool MUST NOT silently fall back to the cloud provider
  if Ollama is configured but unreachable.
- **FR-009**: The answer generator MUST handle at least the following narrative question
  types: "why this company", "why this role", "describe your experience with X",
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
- **SC-004**: A failed provider call produces a handled error — never an unhandled
  crash or a silently blank form field.
- **SC-005**: Answers across multiple questions in the same application are non-repetitive
  (no phrase reused verbatim across answers for the same job).
- **SC-006**: Zero demographic or EEO questions result in a generated AI response;
  all such questions receive `skipped: demographic` status and appear in the user
  review list for manual completion.
- **SC-007**: Switching from the cloud provider to Ollama requires only an environment
  variable change — no code modification and no restart procedure beyond re-running
  the tool.

## Assumptions

- The user's resume text in `profile.json` is sufficient context for the AI to generate
  relevant answers. No additional document parsing is in scope for v1.
- The job description is available as plain text — no parsing of PDFs or complex
  layouts is required.
- Answer length defaults to 2–4 sentences; no per-question length configuration is
  needed in v1.
- The AI provider (cloud or Ollama) and its credentials/endpoint are configured via
  environment variables before the tool is run.
- In production, the cloud AI provider is used by default. In lower environments
  (development, testing), Ollama is the expected provider to avoid cloud API costs.
- Ollama is assumed to be running locally and reachable on a configured port when
  selected as the provider; installation and startup are outside the tool's scope.
- Response quality is the user's responsibility to review during the human review pause
  — the tool does not grade or self-evaluate its own outputs.
- Borderline questions that are open-ended in form but demographic in intent are
  treated as demographic and flagged for manual review.
