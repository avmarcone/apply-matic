# Research: Answer Generator

**Date**: 2026-05-19
**Branch**: `003-answer-generator`

## Decision 1: AI Provider Strategy

**Decision**: Pluggable provider — Claude API (production), Ollama (lower environments)

**Rationale**: The constitution specifies Claude API (Sonnet) for production. However,
repeatedly calling a paid cloud API during development and testing burns money and adds
network latency. Ollama runs locally for free. A factory function (`createAIProvider()`)
reads `AI_PROVIDER=claude|ollama` from the environment and returns a provider that
satisfies the same `AIProvider` interface — no code changes required to switch.

**Claude (production)**: `claude-sonnet-4-6` — contextual reasoning quality, prompt caching support.

**Ollama (lower environments)**: HTTP POST to `http://localhost:{OLLAMA_PORT}/api/generate`.
Model name is configurable via `OLLAMA_MODEL` env var (e.g., `llama3`, `mistral`).
If Ollama is configured but unreachable, the tool fails with a clear error — no silent
fallback to Claude.

**Environment variables**:
```
AI_PROVIDER=claude        # 'claude' (default) or 'ollama'
ANTHROPIC_API_KEY=...     # Required when AI_PROVIDER=claude
OLLAMA_MODEL=llama3       # Required when AI_PROVIDER=ollama
OLLAMA_PORT=11434         # Optional, defaults to 11434
```

**Alternatives considered**:
- Hard-coded Claude API: Rejected — too expensive for iterative testing.
- Feature flag in code: Rejected — environment variable approach avoids code drift.

---

## Decision 2: API Call Strategy — Per-Question vs Batched

**Decision**: Per-question API calls

**Rationale**: Each question is answered in an independent API call. This allows:
- Independent error handling per question (one failure doesn't block the others)
- Clear per-question logging for the user
- Simpler prompt construction with no question-ordering complexity

Batching would reduce latency but adds prompt complexity with no meaningful benefit
at the volume of 2–5 questions per application.

---

## Decision 3: Prompt Caching

**Decision**: Cache the system prompt + resume text block

**Rationale**: The system prompt and resume text are identical for every question in
a run. Using Anthropic's prompt caching (`cache_control: { type: "ephemeral" }`) on
these blocks eliminates redundant token processing for multi-question applications.
Cache TTL is 5 minutes — sufficient for a single application session.

**Cache structure**:
```
[SYSTEM — cached]  Role instructions + no-fabrication rules
[USER — cached]    Resume text block
[USER — not cached] Question-specific content (company, role, JD, question)
```

---

## Decision 4: Prompt Design

**System prompt** (cached):
> You are helping a job applicant fill out an online job application form. Your task is
> to write honest, contextual answers to open-ended questions. Rules:
> - Answers MUST be 2–4 sentences.
> - Answers MUST reference specific details from the job description or the applicant's resume.
> - NEVER fabricate experience, credentials, or achievements not present in the resume.
> - If the resume lacks relevant experience for a question, pivot to transferable skills
>   or genuine interest — do not invent.
> - Write in first person, professionally, without filler phrases like "I am passionate about".
> - For salary questions, respond: "I'm open to discussing compensation based on the full
>   scope of the role and total package."

**User message — resume block** (cached):
```
Applicant resume:
{resumeText}
```

**User message — question block** (not cached):
```
Company: {company}
Role: {role}
Job description: {jobDescription}

Question: {questionText}

Answer in 2–4 sentences.
```

---

## Decision 5: Answer Injection

**Decision**: Playwright `page.locator(fieldSelector).fill(answer)`

**Rationale**: `OpenEndedQuestion.fieldSelector` is set by `fillForm()` in spec 002.
Reusing it for injection keeps the contract clean — the form filler owns field
discovery; the answer generator owns content.

---

## Decision 6: Narrative Question Filtering

**Decision**: Questions are filtered at the `generateAnswer` boundary. Only
open-ended textbox questions expecting a written narrative answer are processed.
Two filter layers run before any AI call:

1. **Demographic filter** (highest priority): If the question text or label matches
   any keyword in the demographic keyword list, return `{ status: 'skipped', skipReason: 'demographic' }` immediately. No AI call is made.

2. **Type filter**: The `OpenEndedQuestion` type already constrains questions to
   `<textarea>` and `<input type="text">` elements (set upstream in spec 002).
   Dropdowns, radio buttons, and checkboxes never reach the answer generator.

**Demographic keyword list** (case-insensitive, substring match):
```
race, ethnicity, gender, sex, disability, veteran, military, nationality,
religion, age, marital, pronouns, identify, eeo, eeoc, diversity, inclusion,
self-identify, self-identification, protected, accommodation
```

**Borderline questions** (e.g., "Tell us about your background and identity"):
If the label contains `identity` or `identify`, treat as demographic and skip.
The user reviews all skipped questions during the human review pause.

**Rationale**: Demographic questions must never receive AI-generated answers.
They require honest self-identification by the user and carry legal/ethical risk.
Over-filtering (false positives flagged as demographic) is safer than under-filtering.

---

## Decision 7: Question Status Model

**Decision**: `AnswerResult.status` field with values `'answered' | 'skipped' | 'failed'`

**Rationale**: Three distinct outcomes must be tracked and surfaced to the user:
- `answered`: AI generated and injected a response
- `skipped`: Question was filtered (demographic); queued for manual review
- `failed`: AI call or injection failed; queued for manual review

`InjectionSummary` adds a `skipped` count field alongside the existing `answered`
and `failed` counts so the terminal output gives the user a clear tally.
