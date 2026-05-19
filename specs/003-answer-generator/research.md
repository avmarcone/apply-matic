# Research: Answer Generator

**Date**: 2026-05-19
**Branch**: `003-answer-generator`

## Decision 1: Claude Model

**Decision**: `claude-sonnet-4-5`

**Rationale**: The constitution specifies Claude API (Sonnet). Sonnet provides the
contextual reasoning quality needed to reference specific resume and job description
details without generic filler. It is significantly faster and cheaper than Opus
for this task, and higher quality than Haiku for nuanced application questions.

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
