import { chromium, type Page } from 'playwright';
import type { Job, Profile, FillResult, OpenEndedQuestion, JobContext } from './types.js';
import { STANDARD_FIELD_SELECTORS, OPEN_ENDED_LABEL_EXCLUSIONS } from './selectors.js';

const PAGE_LOAD_TIMEOUT = 30_000;

/**
 * Returns true if the given label text does not match any known standard field pattern,
 * meaning the field should be treated as an open-ended question for the answer generator.
 *
 * @param labelText - The visible label text of a form field.
 * @returns True if the field is open-ended; false if it is a known standard field.
 */
export function isOpenEndedQuestion(labelText: string): boolean {
  const lower = labelText.toLowerCase().trim();
  if (!lower) return false;
  return !OPEN_ENDED_LABEL_EXCLUSIONS.some(pattern => lower.includes(pattern));
}

/**
 * Attempts to scrape the job description text from a Greenhouse application page.
 * Tries known selectors in order; returns an empty string if none are found.
 *
 * @param page - The live Playwright page for the job application.
 * @returns The job description text, or an empty string if not found.
 */
export async function extractJobDescription(page: Page): Promise<string> {
  const selectors = ['#content', '.job-description', '[data-job-description]'];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      return (await el.textContent() ?? '').trim();
    }
  }
  return '';
}

/**
 * Tries to fill a single standard field using an ordered list of CSS selectors.
 * Returns the selector that succeeded, or null if none matched.
 *
 * @param page - The live Playwright page.
 * @param selectors - Ordered list of CSS selectors to try.
 * @param value - The string value to fill into the field.
 */
async function tryFillField(page: Page, selectors: string[], value: string): Promise<string | null> {
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      await el.fill(value);
      return selector;
    }
  }
  return null;
}

/**
 * Fills a Greenhouse job application form using the user's profile data.
 * Detects open-ended questions and returns them alongside the live page for review.
 * The browser stays open after this function returns — call closeBrowser() when done.
 *
 * @param job - The job being applied to (provides URL and context).
 * @param profile - The user's validated profile data.
 * @returns FillResult containing open-ended questions, filled/skipped fields, and the live page.
 * @throws Error if the page fails to load within 30 seconds.
 */
export async function fillForm(job: Job, profile: Profile): Promise<FillResult> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the job URL
  await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: PAGE_LOAD_TIMEOUT });

  const filledFields: string[] = [];
  const skippedFields: string[] = [];

  // --- Fill standard fields via CSS selectors ---
  const nameParts = profile.name.trim().split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const standardFields: Array<{ name: string; selectors: string[]; value: string }> = [
    { name: 'firstName', selectors: STANDARD_FIELD_SELECTORS.firstName, value: firstName },
    { name: 'lastName', selectors: STANDARD_FIELD_SELECTORS.lastName, value: lastName },
    { name: 'email', selectors: STANDARD_FIELD_SELECTORS.email, value: profile.email },
    { name: 'phone', selectors: STANDARD_FIELD_SELECTORS.phone, value: profile.phone },
    { name: 'linkedin', selectors: STANDARD_FIELD_SELECTORS.linkedin, value: profile.linkedinUrl },
  ];

  for (const field of standardFields) {
    const matched = await tryFillField(page, field.selectors, field.value);
    if (matched) {
      filledFields.push(field.name);
    } else {
      skippedFields.push(field.name);
    }
  }

  // --- Resume upload ---
  const resumeInput = page.locator(STANDARD_FIELD_SELECTORS.resume.join(', ')).first();
  if (await resumeInput.count() > 0) {
    await resumeInput.setInputFiles(profile.resumeFilePath);
    filledFields.push('resume');
  } else {
    skippedFields.push('resume');
  }

  // --- Label-text fallback for work auth, education, experience ---
  const labelFallbacks: Array<{ name: string; pattern: string; value: string }> = [
    { name: 'workAuthorization', pattern: 'work auth', value: profile.workAuthorization },
    { name: 'education', pattern: 'education', value: profile.education },
    { name: 'yearsOfExperience', pattern: 'experience', value: String(profile.yearsOfExperience) },
  ];

  for (const fallback of labelFallbacks) {
    const labels = await page.locator('label').all();
    let filled = false;
    for (const label of labels) {
      const text = (await label.textContent() ?? '').toLowerCase();
      if (text.includes(fallback.pattern)) {
        const forAttr = await label.getAttribute('for');
        if (forAttr) {
          const input = page.locator(`#${forAttr}, select#${forAttr}`).first();
          if (await input.count() > 0) {
            const tagName = await input.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
              await input.selectOption({ label: fallback.value }).catch(() => {});
            } else {
              await input.fill(fallback.value);
            }
            filledFields.push(fallback.name);
            filled = true;
            break;
          }
        }
      }
    }
    if (!filled) skippedFields.push(fallback.name);
  }

  // --- Detect open-ended questions ---
  const jobDescription = await extractJobDescription(page);
  const jobContext: JobContext = {
    company: job.company,
    role: job.role,
    jobDescription,
  };

  const openEndedQuestions: OpenEndedQuestion[] = [];
  const textInputs = await page.locator('textarea, input[type="text"]').all();

  for (let i = 0; i < textInputs.length; i++) {
    const input = textInputs[i];
    let labelText = '';

    // Try aria-label
    labelText = (await input.getAttribute('aria-label') ?? '').trim();

    // Try associated <label> via id
    if (!labelText) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`).first();
        if (await label.count() > 0) {
          labelText = (await label.textContent() ?? '').trim();
        }
      }
    }

    // Try placeholder as last resort
    if (!labelText) {
      labelText = (await input.getAttribute('placeholder') ?? '').trim();
    }

    if (labelText && isOpenEndedQuestion(labelText)) {
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const inputId = await input.getAttribute('id') ?? '';
      const fieldSelector = inputId
        ? `${tagName}#${inputId}`
        : `${tagName}:nth-of-type(${i + 1})`;

      openEndedQuestions.push({ questionText: labelText, fieldSelector, context: jobContext });
    }
  }

  return { openEndedQuestions, filledFields, skippedFields, page };
}

/**
 * Closes the Playwright browser session associated with the given page.
 *
 * @param page - The live Playwright page returned by fillForm.
 */
export async function closeBrowser(page: Page): Promise<void> {
  try {
    await page.context().browser()?.close();
  } catch {
    // Already closed — swallow silently
  }
}
