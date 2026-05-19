# Quickstart: Job Queue Runner

**How to verify this feature works end-to-end.**

## Prerequisites

- `npm install` has been run
- `.env` exists with `ANTHROPIC_API_KEY` set
- A resume PDF exists locally

## Step 1: Create profile.json

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-867-5309",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "workAuthorization": "US Citizen",
  "yearsOfExperience": 6,
  "education": "BS Computer Science, State University",
  "resumeText": "Jane Smith is a software engineer with 6 years of experience...",
  "resumeFilePath": "./resume.pdf"
}
```

## Step 2: Create jobs.csv

```csv
url,company,role,status
https://boards.greenhouse.io/example/jobs/1,Example Corp,Senior Engineer,pending
https://boards.greenhouse.io/example/jobs/2,Already Applied Co,Staff Engineer,applied
```

## Step 3: Run the tool

```bash
npm run dev
```

## Step 4: Verify

- [ ] Tool prints "Loading profile... OK"
- [ ] Tool identifies 1 pending job and skips the applied one
- [ ] Tool opens the Greenhouse URL in a browser
- [ ] After processing, a review prompt appears in the terminal
- [ ] After responding `y`, `jobs.csv` shows `applied` for job 1
- [ ] After responding `n`, `jobs.csv` shows `review-needed` for job 1

## Step 5: Error cases

Run with `profile.json` deleted — confirm error message names all required fields.
Run with an empty `jobs.csv` — confirm "no pending jobs" message and clean exit.
