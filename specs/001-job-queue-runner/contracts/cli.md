# CLI Contract: applymatic

**Date**: 2026-05-18
**Branch**: `001-job-queue-runner`

## Entry Point

```
applymatic
```

No required arguments in v1. The tool locates `jobs.csv` and `profile.json` in the
current working directory automatically.

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | All pending jobs processed (or queue was empty) |
| `1` | Fatal error — missing/invalid `jobs.csv` or `profile.json`; tool did not run |

---

## Standard Output (stdout)

Progress messages written during a run:

```
Loading profile... OK
Found 5 jobs (3 pending, 1 applied, 1 skipped)

[1/3] Acme Corp — Senior Engineer
  Opening application...
  Filling standard fields...
  Answering open-ended questions...
  ✓ Marked as applied

[2/3] Beta Inc — Staff Engineer
  Opening application...
  Filling standard fields...
  ✓ Marked as review-needed

[3/3] Gamma Ltd — Principal Engineer
  Opening application...
  ...

Run complete. Applied: 1 | Review needed: 1 | Errors: 0
```

---

## Standard Error (stderr)

Fatal errors are written to stderr before exit code 1:

```
Error: profile.json not found.
Create it at: /path/to/project/profile.json
Required fields: name, email, phone, linkedinUrl, workAuthorization,
                 yearsOfExperience, education, resumeText, resumeFilePath
```

```
Error: profile.json is invalid.
  - email: Invalid email format
  - yearsOfExperience: Expected number, received string
```

```
Error: jobs.csv not found.
Create it at: /path/to/project/jobs.csv
Required columns: url, company, role, status
```

---

## jobs.csv Format

```csv
url,company,role,status
https://boards.greenhouse.io/acme/jobs/123,Acme Corp,Senior Engineer,pending
https://boards.greenhouse.io/beta/jobs/456,Beta Inc,Staff Engineer,applied
https://boards.greenhouse.io/gamma/jobs/789,Gamma Ltd,Principal Engineer,skipped
```

**Column definitions**:
- `url` — Full URL to the Greenhouse application page
- `company` — Company name (used in progress output)
- `role` — Role title (used in progress output)
- `status` — One of: `pending`, `applied`, `skipped`, `review-needed`

---

## Review Prompt

After form filling is complete, the tool pauses and displays:

```
Review the application in the browser, then press:
  [y] to mark as applied
  [n] to mark as review-needed
  [q] to quit the run entirely

Your choice: _
```

- `y` → writes `applied` to `jobs.csv`, closes browser, moves to next job
- `n` → writes `review-needed` to `jobs.csv`, closes browser, moves to next job
- `q` → writes `review-needed` for the current job, exits the run
