# Research: Greenhouse Form Filler

**Date**: 2026-05-18
**Branch**: `002-greenhouse-form-filler`

## Decision 1: Field Detection Strategy

**Decision**: Selector-first with label-text fallback

**Rationale**: Greenhouse application forms use consistent `name` attributes on standard
fields (e.g., `job_application[first_name]`, `job_application[email]`). These are reliable
across Greenhouse-hosted postings. For fields that deviate (e.g., LinkedIn URL surfaced as
a custom question), a label-text pattern match (case-insensitive substring) serves as a
secondary detection layer.

**Alternatives considered**:
- **Label-text only**: Fragile — label text varies across companies ("LinkedIn" vs
  "LinkedIn URL" vs "LinkedIn Profile"). Rejected as primary strategy.
- **Visual/AI-based detection**: Out of scope and unnecessary given Greenhouse's
  consistent structure.

---

## Decision 2: Open-Ended Question Detection

**Decision**: Collect all `<textarea>` elements and `<input type="text">` elements whose
labels do not match any known standard-field pattern.

**Rationale**: Greenhouse renders custom questions (open-ended) as labeled textarea or
text input elements. After filling all known standard fields, any remaining unfilled
textarea is treated as an open-ended question. This approach has 100% recall with
acceptable false-positive risk (unknown standard fields would be passed to Claude, which
is safe).

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

## Greenhouse Standard Field Selectors

```
First name:  input[name*="first_name"], input#first_name
Last name:   input[name*="last_name"],  input#last_name
Email:       input[name*="email"][type="email"], input#email
Phone:       input[name*="phone"], input[type="tel"]
Resume:      input[type="file"]:first-of-type
LinkedIn:    input[id*="linkedin" i], input[placeholder*="linkedin" i]
             (fallback: label-text match "linkedin")
Work auth:   select or input whose label matches "work authorization" (case-insensitive)
Education:   input whose label matches "education" (case-insensitive)
Experience:  input whose label matches "experience" (case-insensitive)
```
