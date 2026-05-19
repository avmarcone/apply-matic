# Quickstart: Answer Generator

**How to verify this feature works end-to-end.**

## Prerequisites

- Specs 001 and 002 implemented and passing (`npm test`)
- `.env` contains a valid `ANTHROPIC_API_KEY` (production) OR Ollama running locally (lower env)
- A Greenhouse job URL that has at least one open-ended question

## Step 1: Verify provider configuration

**Claude (production)**:
```bash
echo $ANTHROPIC_API_KEY   # should start with sk-ant-
```

**Ollama (lower environment)**:
```bash
AI_PROVIDER=ollama OLLAMA_MODEL=llama3 npm run dev
# Confirm Ollama is running: curl http://localhost:11434/api/tags
```

## Step 2: Run against a Greenhouse URL with open-ended questions

```bash
npm run dev
```

## Step 3: Verify narrative answer generation

- [ ] Terminal shows "Answering N open-ended question(s)..."
- [ ] Each narrative question is printed with its generated answer
- [ ] Answers are 2–4 sentences and reference job or resume specifics
- [ ] Answers are visible in the browser form fields after injection
- [ ] No answer fabricates experience not in the resume

## Step 4: Verify demographic question exclusion

Run against a Greenhouse posting that includes EEO / demographic questions.

- [ ] Demographic questions (race, gender, disability, veteran, etc.) are NOT answered by AI
- [ ] Terminal shows "⚠ skipped (demographic) — review manually" for each excluded question
- [ ] `InjectionSummary` shows correct `skipped` count
- [ ] Skipped fields are left blank in the browser for manual completion during review

## Step 5: Verify Ollama provider

```bash
AI_PROVIDER=ollama OLLAMA_MODEL=llama3 npm run dev
```
- [ ] Answers are generated via Ollama — no `ANTHROPIC_API_KEY` required
- [ ] Setting `OLLAMA_PORT=9999` (invalid) causes a clear connection error, not a silent fallback

## Step 6: Verify error handling

- [ ] Temporarily set `ANTHROPIC_API_KEY=invalid` and run — confirm the tool logs an
      error per question, marks the job `review-needed`, and does not crash

## Step 7: Verify human review still works

- [ ] After answer injection, the review prompt still appears
- [ ] Skipped demographic questions are listed for manual completion
- [ ] Responding `y` marks the job `applied` in jobs.csv
