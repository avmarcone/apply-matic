# Data Model: Greenhouse Form Filler

**Date**: 2026-05-18
**Branch**: `002-greenhouse-form-filler`

## Entity: OpenEndedQuestion

Represents a text question on a Greenhouse form that cannot be filled from `profile.json`.
Collected by the form filler and passed to the answer generator.

| Field | Type | Description |
|---|---|---|
| `questionText` | string | The label or prompt text of the form field |
| `fieldSelector` | string | CSS selector to locate the input for later fill-in |
| `context` | JobContext | Company name, role, and job description for AI context |

---

## Entity: JobContext

Contextual information about the job, passed alongside open-ended questions to the
answer generator.

| Field | Type | Description |
|---|---|---|
| `company` | string | Company name from `jobs.csv` |
| `role` | string | Role title from `jobs.csv` |
| `jobDescription` | string | Full text scraped from the Greenhouse page (may be empty) |

---

## Entity: FillResult

The outcome returned by `fillForm` to the orchestrator.

| Field | Type | Description |
|---|---|---|
| `openEndedQuestions` | OpenEndedQuestion[] | Questions requiring AI-generated answers |
| `filledFields` | string[] | Names of standard fields successfully filled |
| `skippedFields` | string[] | Standard fields not found on the page |
| `page` | Page | Live Playwright page — kept open for review and answer injection |
