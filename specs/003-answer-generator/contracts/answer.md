# Contract: answer.ts

**Date**: 2026-05-19
**Branch**: `003-answer-generator`

---

## `generateAnswer(question, resumeText)`

Calls the Claude API to produce a 2–4 sentence answer for a single open-ended
application question. Uses prompt caching on the system prompt and resume block.

### Signature

```typescript
generateAnswer(
  question: OpenEndedQuestion,
  resumeText: string
): Promise<AnswerResult>
```

### Inputs

| Parameter | Type | Description |
|---|---|---|
| `question` | `OpenEndedQuestion` | Question text, field selector, and job context |
| `resumeText` | `string` | Plain-text resume from `profile.resumeText` |

### Output: `AnswerResult`

| Field | Type | Description |
|---|---|---|
| `questionText` | string | The original question |
| `answer` | string | 2–4 sentence response (empty string on error) |
| `fieldSelector` | string | Selector for form injection |
| `error` | string \| undefined | Error message if generation failed |

### Behaviour

- Constructs a prompt per `research.md` Decision 4
- Applies `cache_control: { type: "ephemeral" }` to system prompt and resume block
- On API error: returns `AnswerResult` with empty `answer` and populated `error`
- Never throws — errors are captured and returned

---

## `injectAnswers(page, questions, resumeText)`

Generates and injects answers for all open-ended questions into the live Playwright page.

### Signature

```typescript
injectAnswers(
  page: Page,
  questions: OpenEndedQuestion[],
  resumeText: string
): Promise<InjectionSummary>
```

### Inputs

| Parameter | Type | Description |
|---|---|---|
| `page` | `Page` | Live Playwright page returned by `fillForm` |
| `questions` | `OpenEndedQuestion[]` | All open-ended questions detected by form filler |
| `resumeText` | `string` | Plain-text resume from `profile.resumeText` |

### Output: `InjectionSummary`

| Field | Type | Description |
|---|---|---|
| `answered` | number | Questions successfully answered and injected |
| `failed` | number | Questions where generation or injection failed |
| `results` | `AnswerResult[]` | Per-question detail for logging |

### Behaviour

- Calls `generateAnswer` for each question sequentially
- On successful generation: calls `page.locator(fieldSelector).fill(answer)`
- On failed generation or injection: logs to stderr, increments `failed`, continues
- Returns `InjectionSummary` after all questions are processed
