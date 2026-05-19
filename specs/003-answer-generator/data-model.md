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

Output of `generateAnswer`. Contains the generated text and metadata.

| Field | Type | Description |
|---|---|---|
| `questionText` | string | The original question |
| `answer` | string | The 2–4 sentence AI-generated response |
| `fieldSelector` | string | Selector for injecting the answer into the form |
| `error` | string \| undefined | Set if generation failed; answer will be empty string |

---

## Entity: InjectionSummary

Returned by `injectAnswers` after processing all open-ended questions.

| Field | Type | Description |
|---|---|---|
| `answered` | number | Count of questions successfully answered and injected |
| `failed` | number | Count of questions where generation or injection failed |
| `results` | AnswerResult[] | Per-question outcome for logging |
