# Data Model: Answer Generator

**Date**: 2026-05-19
**Branch**: `003-answer-generator`

## Entity: AnswerRequest

Input to `generateAnswer`. Assembled from an `OpenEndedQuestion` (spec 002) and the
user's `Profile` (spec 001).

| Field | Type | Source |
|---|---|---|
| `questionText` | string | `OpenEndedQuestion.questionText` |
| `context` | JobContext | `OpenEndedQuestion.context` |
| `resumeText` | string | `Profile.resumeText` |

---

## Entity: AnswerResult

Output of `generateAnswer`. Contains the generated text and outcome status.

| Field | Type | Description |
|---|---|---|
| `questionText` | string | The original question |
| `answer` | string | The 2–4 sentence AI-generated response (empty string when skipped or failed) |
| `fieldSelector` | string | Selector for injecting the answer into the form |
| `status` | `'answered' \| 'skipped' \| 'failed'` | Outcome of this question |
| `skipReason` | `'demographic' \| undefined` | Why the question was skipped (only set when `status === 'skipped'`) |
| `error` | `string \| undefined` | Error message (only set when `status === 'failed'`) |

---

## Entity: InjectionSummary

Returned by `injectAnswers` after processing all open-ended questions.

| Field | Type | Description |
|---|---|---|
| `answered` | number | Count of questions successfully answered and injected |
| `skipped` | number | Count of questions skipped (e.g., demographic) — queued for manual review |
| `failed` | number | Count of questions where generation or injection failed |
| `results` | AnswerResult[] | Per-question outcome for logging and review display |

---

## Entity: AIProvider (interface)

Abstraction over the AI backend, allowing Claude API and Ollama to be swapped
via environment configuration.

| Method | Signature | Description |
|---|---|---|
| `generate` | `(systemPrompt: string, userMessages: string[]) => Promise<string>` | Send a prompt and return the text response |
