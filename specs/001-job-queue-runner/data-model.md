# Data Model: Job Queue Runner

**Date**: 2026-05-18
**Branch**: `001-job-queue-runner`

## Entity: Job

Represents a single row in `jobs.csv`.

| Field | Type | Required | Values |
|---|---|---|---|
| `url` | string | ✅ | Full URL to the job application page |
| `company` | string | ✅ | Company name (display only) |
| `role` | string | ✅ | Role title (display only) |
| `status` | JobStatus | ✅ | `pending` \| `applied` \| `skipped` \| `review-needed` |

**State transitions**:

```
pending → applied         (user confirms submission)
pending → review-needed   (user declines, or error during processing)
pending → skipped         (manually set by user before run; tool never sets this)
```

The tool reads all statuses on startup but only processes `pending` rows. It writes
`applied` or `review-needed` back to the row after processing. It never writes `skipped`.

---

## Entity: Profile

Represents the contents of `profile.json`. Loaded once at startup, validated before
any browser session opens.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Full legal name |
| `email` | string | ✅ | Primary email address |
| `phone` | string | ✅ | Phone number (any format) |
| `linkedinUrl` | string | ✅ | Full LinkedIn profile URL |
| `workAuthorization` | string | ✅ | e.g. "US Citizen", "Requires Sponsorship" |
| `yearsOfExperience` | number | ✅ | Integer; total years of professional experience |
| `education` | string | ✅ | Highest degree + institution, e.g. "BS Computer Science, MIT" |
| `resumeText` | string | ✅ | Plain-text resume content for AI answer context |
| `resumeFilePath` | string | ✅ | Absolute or relative path to resume PDF for file upload |

**Validation rules**:
- All fields are required; no optional fields in v1
- `email` must be a valid email format
- `yearsOfExperience` must be a non-negative integer
- `resumeFilePath` must point to a file that exists on disk

---

## Entity: RunResult

Represents the outcome of processing a single job. Not persisted — used internally
to determine which status to write back to `jobs.csv`.

| Field | Type | Description |
|---|---|---|
| `job` | Job | The original job that was processed |
| `outcome` | `'applied'` \| `'review-needed'` \| `'error'` | Final outcome |
| `error` | string \| undefined | Error message if outcome is `'error'` |
