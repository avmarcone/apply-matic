# Quickstart: Answer Generator

**How to verify this feature works end-to-end.**

## Prerequisites

- Specs 001 and 002 implemented and passing (`npm test`)
- `.env` contains a valid `ANTHROPIC_API_KEY`
- A Greenhouse job URL that has at least one open-ended question

## Step 1: Verify API key is set

```bash
echo $ANTHROPIC_API_KEY   # should start with sk-ant-
```

## Step 2: Run against a Greenhouse URL with open-ended questions

```bash
npm run dev
```

## Step 3: Verify answer generation

- [ ] Terminal shows "Answering N open-ended question(s)..."
- [ ] Each question is printed with its generated answer
- [ ] Answers are 2–4 sentences and reference job or resume specifics
- [ ] Answers are visible in the browser form fields after injection
- [ ] No answer fabricates experience not in the resume

## Step 4: Verify error handling

- [ ] Temporarily set `ANTHROPIC_API_KEY=invalid` and run — confirm the tool logs an
      error per question, marks the job `review-needed`, and does not crash

## Step 5: Verify human review still works

- [ ] After answer injection, the review prompt still appears
- [ ] Responding `y` marks the job `applied` in jobs.csv
