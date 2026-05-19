# Quickstart: Greenhouse Form Filler

**How to verify this feature works end-to-end.**

## Prerequisites

- Spec 001 implemented and passing (`npm test`)
- Valid `profile.json` with a real `resumeFilePath`
- A real Greenhouse job application URL

## Step 1: Add a Greenhouse URL to jobs.csv

```csv
url,company,role,status
https://boards.greenhouse.io/example/jobs/123,Example Corp,Senior Engineer,pending
```

## Step 2: Run the tool

```bash
npm run dev
```

## Step 3: Verify standard fields

- [ ] Browser window opens and navigates to the Greenhouse URL
- [ ] First name, last name, email, phone are filled from profile.json
- [ ] Resume is uploaded (file input shows the filename)
- [ ] LinkedIn URL is filled if the field is present
- [ ] Any field not found on the page is silently skipped (no crash)

## Step 4: Verify open-ended question detection

- [ ] Any textarea not matching standard field patterns is listed in the terminal
      as an open-ended question to be answered by Claude
- [ ] Questions are passed with the company name, role, and job description

## Step 5: Verify human review pause

- [ ] Browser stays open and interactive after filling
- [ ] Terminal shows the review prompt (y/n/q)
- [ ] Responding `n` closes the browser and marks the job `review-needed`

## Step 6: Error case

Run with an invalid Greenhouse URL — confirm the tool catches the page load error,
marks the job `review-needed`, and continues to the next job.
