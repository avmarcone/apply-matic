import 'dotenv/config';
import readline from 'readline';
import { loadProfile } from './profile.js';
import { readQueue, writeQueue, filterPending } from './queue.js';
import { fillForm, closeBrowser } from './greenhouse.js';
import type { Job, Profile, RunResult } from './types.js';

const JOBS_PATH = './jobs.csv';
const PROFILE_PATH = './profile.json';

/**
 * Prompts the user to review the application in the browser and returns their decision.
 *
 * @param job - The job currently under review.
 * @returns 'applied' if the user confirms, 'review-needed' if they decline.
 *          Exits the process entirely if the user presses 'q'.
 */
async function promptReview(job: Job): Promise<'applied' | 'review-needed'> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    console.log(`\nReview the application in the browser, then press:`);
    console.log(`  [y] to mark as applied`);
    console.log(`  [n] to mark as review-needed`);
    console.log(`  [q] to quit the run entirely`);

    rl.question('\nYour choice: ', answer => {
      rl.close();
      const choice = answer.trim().toLowerCase();
      if (choice === 'y') {
        resolve('applied');
      } else if (choice === 'q') {
        console.log(`\nQuitting run. "${job.company} — ${job.role}" marked as review-needed.`);
        process.exit(0);
      } else {
        resolve('review-needed');
      }
    });
  });
}

/**
 * Processes a single job: fills the Greenhouse form, injects AI answers for
 * open-ended questions (stub until spec 003), prompts for human review, then
 * closes the browser.
 *
 * @param job - The pending job to process.
 * @param profile - The user's validated profile.
 * @returns A RunResult indicating the final outcome.
 */
async function processJob(job: Job, profile: Profile): Promise<RunResult> {
  console.log(`  Opening application...`);
  const fillResult = await fillForm(job, profile);

  console.log(`  Filled: ${fillResult.filledFields.join(', ')}`);
  if (fillResult.skippedFields.length > 0) {
    console.log(`  Skipped (not found): ${fillResult.skippedFields.join(', ')}`);
  }

  if (fillResult.openEndedQuestions.length > 0) {
    console.log(`  Answering ${fillResult.openEndedQuestions.length} open-ended question(s)...`);
    // TODO: spec 003 — call answer generator and inject answers into fillResult.page
    console.log(`  [stub] Answer generation not yet implemented — see spec 003`);
  }

  const outcome = await promptReview(job);
  await closeBrowser(fillResult.page);
  return { job, outcome };
}

/**
 * Main CLI entry point. Loads profile and job queue, processes all pending jobs
 * sequentially, and writes the result status back to jobs.csv after each job.
 */
async function main(): Promise<void> {
  // --- Startup: load profile and queue ---
  let profile: Profile;
  try {
    process.stdout.write('Loading profile... ');
    profile = loadProfile(PROFILE_PATH);
    console.log('OK');
  } catch (err) {
    process.stderr.write(`\nError: ${(err as Error).message}\n`);
    process.exit(1);
  }

  let jobs;
  try {
    jobs = readQueue(JOBS_PATH);
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
  }

  const pending = filterPending(jobs);
  const appliedCount = jobs.filter(j => j.status === 'applied').length;
  const skippedCount = jobs.filter(j => j.status === 'skipped').length;

  console.log(
    `Found ${jobs.length} jobs (${pending.length} pending, ${appliedCount} applied, ${skippedCount} skipped)\n`
  );

  if (pending.length === 0) {
    console.log('No pending jobs. Done.');
    return;
  }

  // --- Process each pending job sequentially ---
  let applied = 0;
  let reviewNeeded = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const job = pending[i];
    console.log(`[${i + 1}/${pending.length}] ${job.company} — ${job.role}`);

    let result: RunResult;
    try {
      result = await processJob(job, profile);
    } catch (err) {
      // FR-009: unexpected error → review-needed, log to stderr, continue
      const message = (err as Error).message;
      process.stderr.write(`  Error processing job: ${message}\n`);
      result = { job, outcome: 'error', error: message };
    }

    // Write updated status back to jobs.csv after every job
    const finalStatus = result.outcome === 'error' ? 'review-needed' : result.outcome;
    const idx = jobs.findIndex(j => j.url === job.url && j.status === 'pending');
    if (idx !== -1) {
      jobs[idx].status = finalStatus;
      writeQueue(JOBS_PATH, jobs);
    }

    if (finalStatus === 'applied') {
      applied++;
      console.log(`  ✓ Marked as applied\n`);
    } else {
      if (result.outcome === 'error') errors++;
      reviewNeeded++;
      console.log(`  ✓ Marked as review-needed\n`);
    }
  }

  console.log(`Run complete. Applied: ${applied} | Review needed: ${reviewNeeded} | Errors: ${errors}`);
}

main();
