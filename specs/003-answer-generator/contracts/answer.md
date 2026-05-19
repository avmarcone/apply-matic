# Contract: answer.ts

**Date**: 2026-05-19
**Branch**: `003-answer-generator`

---

## `generateAnswer(question, resumeText, provider)`

Filters and, if eligible, generates a 2–4 sentence answer for a single open-ended
application question using the configured AI provider (Claude or Ollama).

### Signature

```typescript
generateAnswer(
  question: OpenEndedQuestion,
  resumeText: string,
  provider: AIProvider
): Promise<AnswerResult>
```

### Inputs

| Parameter | Type | Description |
|---|---|---|
| `question` | `OpenEndedQuestion` | Question text, field selector, and job context |
| `resumeText` | `string` | Plain-text resume from `profile.resumeText` |
| `provider` | `AIProvider` | The active AI provider (Claude or Ollama) |

### Output: `AnswerResult`

| Field | Type | Description |
|---|---|---|
| `questionText` | string | The original question |
| `answer` | string | 2–4 sentence response (empty when skipped or failed) |
| `fieldSelector` | string | Selector for form injection |
| `status` | `'answered' \| 'skipped' \| 'failed'` | Outcome |
| `skipReason` | `'demographic' \| undefined` | Set when `status === 'skipped'` |
| `error` | `string \| undefined` | Set when `status === 'failed'` |

### Behaviour

1. Run demographic filter: if `question.questionText` matches any keyword in the
   demographic list (see `research.md` Decision 6), return immediately with
   `{ status: 'skipped', skipReason: 'demographic', answer: '' }` — no AI call made
2. Construct prompt per `research.md` Decision 4
3. Call `provider.generate(systemPrompt, userMessages)`
4. On success: return `{ status: 'answered', answer: responseText }`
5. On provider error: return `{ status: 'failed', error: errorMessage, answer: '' }`
6. Never throws — all errors are captured and returned in `AnswerResult`

---

## `createAIProvider()`

Factory function. Reads `AI_PROVIDER` from the environment and returns the appropriate
`AIProvider` implementation.

### Signature

```typescript
createAIProvider(): AIProvider
```

### Behaviour

- If `AI_PROVIDER=claude` (or unset): returns `ClaudeProvider` using `ANTHROPIC_API_KEY`
- If `AI_PROVIDER=ollama`: returns `OllamaProvider` using `OLLAMA_MODEL` and `OLLAMA_PORT`
- If Ollama is configured but unreachable: throws a descriptive error — never falls back silently

---

## `injectAnswers(page, questions, resumeText, provider)`

Generates and injects answers for all open-ended questions into the live Playwright page.
Demographic questions are skipped and surfaced for manual review.

### Signature

```typescript
injectAnswers(
  page: Page,
  questions: OpenEndedQuestion[],
  resumeText: string,
  provider: AIProvider
): Promise<InjectionSummary>
```

### Inputs

| Parameter | Type | Description |
|---|---|---|
| `page` | `Page` | Live Playwright page returned by `fillForm` |
| `questions` | `OpenEndedQuestion[]` | All open-ended questions detected by form filler |
| `resumeText` | `string` | Plain-text resume from `profile.resumeText` |
| `provider` | `AIProvider` | The active AI provider (Claude or Ollama) |

### Output: `InjectionSummary`

| Field | Type | Description |
|---|---|---|
| `answered` | number | Questions successfully answered and injected |
| `skipped` | number | Questions filtered as demographic — shown to user for manual review |
| `failed` | number | Questions where generation or injection failed |
| `results` | `AnswerResult[]` | Per-question detail for logging and review display |

### Behaviour

1. Calls `generateAnswer(question, resumeText, provider)` for each question sequentially
2. On `status === 'answered'`: calls `page.locator(fieldSelector).fill(answer)`, increments `answered`
3. On `status === 'skipped'`: logs question to terminal as "⚠ skipped (demographic) — review manually", increments `skipped`
4. On `status === 'failed'`: logs error to stderr, increments `failed`, continues to next question
5. Returns `InjectionSummary` after all questions are processed
