import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.js';
import type { Page } from 'playwright';
import type { OpenEndedQuestion, AnswerResult, InjectionSummary } from './types.js';

const SYSTEM_PROMPT =
  'You are helping a job applicant fill out an online job application form. Your task is to write honest, contextual answers to open-ended questions. Rules:\n' +
  '- Answers MUST be 2–4 sentences.\n' +
  '- Answers MUST reference specific details from the job description or the applicant\'s resume.\n' +
  '- NEVER fabricate experience, credentials, or achievements not present in the resume.\n' +
  '- If the resume lacks relevant experience for a question, pivot to transferable skills or genuine interest — do not invent.\n' +
  '- Write in first person, professionally, without filler phrases like "I am passionate about".\n' +
  '- For salary questions, respond: "I\'m open to discussing compensation based on the full scope of the role and total package."';

/**
 * Constructs the Anthropic API message array with cached system prompt + resume
 * block and an uncached question block per research.md Decision 4.
 *
 * @param question - The open-ended question with text and job context.
 * @param resumeText - Plain-text resume from `profile.resumeText`.
 * @returns Array of MessageParam ready for the Anthropic messages.create call.
 */
export function buildMessages(question: OpenEndedQuestion, resumeText: string): MessageParam[] {
  const { company, role, jobDescription } = question.context;
  return [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Applicant resume:\n${resumeText}`,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `Company: ${company}\nRole: ${role}\nJob description: ${jobDescription}\n\nQuestion: ${question.questionText}\n\nAnswer in 2–4 sentences.`,
        },
      ],
    },
  ];
}

/**
 * Generates a 2–4 sentence contextual answer for a single open-ended application
 * question by calling the Claude API with prompt caching on the system prompt and
 * resume block.
 *
 * @param question - The open-ended question with text, selector, and job context.
 * @param resumeText - Plain-text resume from `profile.resumeText`.
 * @returns An AnswerResult with the generated answer, or an error field on failure.
 *          Never throws — errors are captured and returned.
 */
export async function generateAnswer(
  question: OpenEndedQuestion,
  resumeText: string
): Promise<AnswerResult> {
  const base: Omit<AnswerResult, 'answer'> = {
    questionText: question.questionText,
    fieldSelector: question.fieldSelector,
  };
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: buildMessages(question, resumeText),
    });
    const textBlock = response.content.find(b => b.type === 'text');
    const answer = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
    return { ...base, answer };
  } catch (err) {
    return { ...base, answer: '', error: (err as Error).message };
  }
}

/**
 * Generates and injects answers for all open-ended questions into the live
 * Playwright page sequentially. Failures per-question are logged to stderr and
 * counted, but do not stop processing of remaining questions.
 *
 * @param page - Live Playwright page returned by `fillForm`.
 * @param questions - All open-ended questions detected by the form filler.
 * @param resumeText - Plain-text resume from `profile.resumeText`.
 * @returns An InjectionSummary with counts and per-question results.
 */
export async function injectAnswers(
  page: Page,
  questions: OpenEndedQuestion[],
  resumeText: string
): Promise<InjectionSummary> {
  let answered = 0;
  let failed = 0;
  const results: AnswerResult[] = [];

  for (const question of questions) {
    const result = await generateAnswer(question, resumeText);
    results.push(result);

    if (result.error) {
      process.stderr.write(`  Answer generation failed for "${question.questionText}": ${result.error}\n`);
      failed++;
      continue;
    }

    try {
      await page.locator(question.fieldSelector).fill(result.answer);
      answered++;
    } catch (err) {
      process.stderr.write(`  Answer injection failed for "${question.questionText}": ${(err as Error).message}\n`);
      failed++;
    }
  }

  return { answered, failed, results };
}
