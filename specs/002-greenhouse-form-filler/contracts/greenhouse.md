# Contract: greenhouse.ts

**Date**: 2026-05-18
**Branch**: `002-greenhouse-form-filler`

## `fillForm(job, profile)`

Opens a Greenhouse application URL in a headed Chromium browser, fills all detectable
**required** standard fields from the user's profile, collects open-ended questions,
and returns the live page alongside results. Optional fields are left untouched. The
browser stays open for human review.

### Signature

```typescript
fillForm(job: Job, profile: Profile): Promise<FillResult>
```

### Inputs

| Parameter | Type | Description |
|---|---|---|
| `job` | `Job` | Job row from jobs.csv — provides url, company, role |
| `profile` | `Profile` | Validated profile — source of all field values |

### Output: `FillResult`

| Field | Type | Description |
|---|---|---|
| `openEndedQuestions` | `OpenEndedQuestion[]` | Questions to pass to the answer generator |
| `filledFields` | `string[]` | Names of standard fields successfully filled |
| `skippedFields` | `string[]` | Standard fields not found on the page |
| `page` | `Page` | Live Playwright Page — kept open for answer injection and review |

### Behaviour

1. Launches a headed Chromium browser via Playwright
2. Navigates to `job.url` and waits for the form to load
3. For each required standard field, applies the 5-strategy detection cascade:
   name attribute → aria-label → label text → placeholder → Greenhouse CSS selectors.
   Optional fields (LinkedIn, cover letter, website, etc.) are skipped entirely.
4. Fills detected required fields from `profile`; uploads resume via `setInputFiles`
5. Scans for unfilled textareas whose labels do not match standard field patterns →
   collects as `OpenEndedQuestion[]`
6. Extracts job description text from the page
7. Returns `FillResult` with the page still open

### Error handling

- Page load timeout (>30s): throws `Error` — caller writes `review-needed`
- Standard field not found: adds to `skippedFields`, does not throw
- Resume file missing: throws `Error` — should not occur (validated in spec 001)

---

## `closeBrowser(page)`

Closes the Playwright browser session associated with a page.

### Signature

```typescript
closeBrowser(page: Page): Promise<void>
```

Called by the orchestrator after the user has confirmed or declined the application.
