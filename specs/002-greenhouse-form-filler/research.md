# Research: Greenhouse Form Filler

**Date**: 2026-05-18
**Branch**: `002-greenhouse-form-filler`

## Decision 1: Field Detection Strategy

**Decision**: Five-strategy cascade in priority order, all strategies attempted before
declaring a field undetectable.

**Strategy order**:
1. `name` attribute match — most reliable on Greenhouse (e.g., `job_application[first_name]`)
2. `aria-label` / `aria-labelledby` attribute match
3. Associated `<label>` text match (case-insensitive substring)
4. `placeholder` text match (case-insensitive)
5. Greenhouse-specific CSS selectors (e.g., `[data-provides]`, `[class*="field"]`)

**Rationale**: The first-run test against Garner Health's Greenhouse form confirmed that
relying solely on `name` attributes misses fields rendered without standard name conventions.
Each additional strategy covers a different rendering variant. All five must be attempted
before giving up on a field — this is the primary fix for the missed-fields bug.

**Alternatives considered**:
- **Single-strategy (name-only)**: Fast but brittle — proven to miss many fields. Rejected.
- **Visual/AI-based detection**: Out of scope and unnecessary given Greenhouse's
  consistent structure.

---

## Decision 1b: Required-Field Detection

**Decision**: A field is treated as required if any of the following are true:
(a) the HTML element has the `required` attribute set, (b) the associated `<label>` text
contains a visible asterisk (`*`), or (c) the element has a Greenhouse-standard required
CSS class (e.g., `required`, `field--required`).

**Rationale**: The spec restricts auto-fill to required fields only — optional fields
(LinkedIn, cover letter, website) are left blank for the user to fill if desired. Required
detection must be multi-signal because Greenhouse themes vary: some use HTML `required`,
some rely on the asterisk convention, some use CSS classes.

**Required standard fields** (these are required on most Greenhouse postings):
`first name`, `last name`, `email`, `phone`, `resume`

**Optional standard fields** (skipped regardless of content in profile.json):
`linkedin`, `cover letter`, `work authorization`, `years of experience`, `education`,
`website`, `portfolio`

---

## Decision 2: Open-Ended Question Detection

**Decision**: Collect all `<textarea>` elements and `<input type="text">` elements whose
labels do not match any known standard-field pattern AND whose associated `<label>` text
does not match a demographic/EEO keyword list.

**Rationale**: Greenhouse renders custom questions (open-ended) as labeled textarea or
text input elements. After filling all known required standard fields, any remaining
unfilled textarea is treated as an open-ended question and passed to the answer generator.

**Standard field label patterns to exclude** (case-insensitive):
`first name`, `last name`, `email`, `phone`, `linkedin`, `resume`, `cover letter`,
`work authorization`, `years of experience`, `education`, `website`, `portfolio`

---

## Decision 3: Job Description Extraction

**Decision**: Scrape the page for the job description div; fall back to an empty string.

**Rationale**: Greenhouse job application pages (`boards.greenhouse.io/{company}/jobs/{id}`)
embed the job description in a `#content` or `.job-description` div above the application
form. Scraping this provides Claude with full context. If the selector fails (some
companies use custom Greenhouse themes), the answer generator degrades gracefully to
resume-only context.

**Greenhouse job description selectors** (try in order):
1. `#content`
2. `.job-description`
3. `[data-job-description]`

---

## Decision 4: Browser Mode

**Decision**: Headed (non-headless) Chromium

**Rationale**: The user must be able to review the filled form before confirming. A
headed browser is required by constitution Principle V (Human-in-the-Loop). Headless
mode is explicitly excluded for v1.

---

## Decision 5: Resume Upload

**Decision**: Playwright `setInputFiles()` API

**Rationale**: Playwright's `page.locator('input[type="file"]').setInputFiles(path)`
is the idiomatic way to handle file upload inputs. It works without triggering OS file
dialogs. The resume file path comes from `profile.resumeFilePath`, already validated
to exist on disk by `loadProfile` (spec 001).

## Required Standard Field Selectors (5-Strategy Cascade)

Each field below lists selectors in strategy priority order. All strategies are tried
before the field is considered undetectable.

```
First name:  [Strategy 1] input[name*="first_name"], input[name="first_name"]
             [Strategy 2] input[aria-label*="first name" i]
             [Strategy 3] label-text match "first name" → associated input
             [Strategy 4] input[placeholder*="first name" i]
             [Strategy 5] input.first-name, [data-field="first_name"]

Last name:   [Strategy 1] input[name*="last_name"]
             [Strategy 2] input[aria-label*="last name" i]
             [Strategy 3] label-text match "last name" → associated input
             [Strategy 4] input[placeholder*="last name" i]
             [Strategy 5] input.last-name, [data-field="last_name"]

Email:       [Strategy 1] input[name*="email"][type="email"], input[name="email"]
             [Strategy 2] input[aria-label*="email" i]
             [Strategy 3] label-text match "email" → associated input
             [Strategy 4] input[placeholder*="email" i]
             [Strategy 5] input[type="email"]

Phone:       [Strategy 1] input[name*="phone"], input[name*="cell"]
             [Strategy 2] input[aria-label*="phone" i]
             [Strategy 3] label-text match "phone" → associated input
             [Strategy 4] input[placeholder*="phone" i]
             [Strategy 5] input[type="tel"]

Resume:      [Strategy 1] input[name*="resume"]
             [Strategy 2] aria-label match "resume" → file input
             [Strategy 3] label-text match "resume" → input[type="file"]
             [Strategy 4] N/A (no placeholder on file inputs)
             [Strategy 5] input[type="file"]:first-of-type
```
