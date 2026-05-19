import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OpenEndedQuestion } from '../../src/types.js';

// vi.hoisted ensures mockCreate is available inside vi.mock factory (which is hoisted)
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

import { buildMessages, generateAnswer, injectAnswers } from '../../src/answer.js';

const SAMPLE_QUESTION: OpenEndedQuestion = {
  questionText: 'Why do you want to work here?',
  fieldSelector: 'textarea[name="question_1"]',
  context: {
    company: 'Acme Corp',
    role: 'Senior Engineer',
    jobDescription: 'Build scalable distributed systems.',
  },
};

const SAMPLE_RESUME = 'Jane Doe. 5 years of backend engineering experience with Go and Kubernetes.';

describe('buildMessages', () => {
  it('returns a single user message', () => {
    const messages = buildMessages(SAMPLE_QUESTION, SAMPLE_RESUME);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('has a cached resume block as the first content item', () => {
    const messages = buildMessages(SAMPLE_QUESTION, SAMPLE_RESUME);
    const content = messages[0].content as Array<{ type: string; text: string; cache_control?: unknown }>;

    expect(content[0].type).toBe('text');
    expect(content[0].text).toContain(SAMPLE_RESUME);
    expect(content[0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('has an uncached question block as the second content item', () => {
    const messages = buildMessages(SAMPLE_QUESTION, SAMPLE_RESUME);
    const content = messages[0].content as Array<{ type: string; text: string; cache_control?: unknown }>;

    expect(content[1].type).toBe('text');
    expect(content[1].text).toContain('Acme Corp');
    expect(content[1].text).toContain('Senior Engineer');
    expect(content[1].text).toContain('Why do you want to work here?');
    expect(content[1].cache_control).toBeUndefined();
  });
});

describe('generateAnswer', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns correct AnswerResult on success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: "I admire Acme Corp's mission. My Go expertise aligns well." }],
    });

    const result = await generateAnswer(SAMPLE_QUESTION, SAMPLE_RESUME);

    expect(result.questionText).toBe('Why do you want to work here?');
    expect(result.answer).toBe("I admire Acme Corp's mission. My Go expertise aligns well.");
    expect(result.fieldSelector).toBe('textarea[name="question_1"]');
    expect(result.error).toBeUndefined();
  });

  it('returns error field and empty answer on API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API authentication failed'));

    const result = await generateAnswer(SAMPLE_QUESTION, SAMPLE_RESUME);

    expect(result.questionText).toBe('Why do you want to work here?');
    expect(result.answer).toBe('');
    expect(result.fieldSelector).toBe('textarea[name="question_1"]');
    expect(result.error).toContain('API authentication failed');
  });

  it('never throws — errors are always returned, not thrown', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network timeout'));
    await expect(generateAnswer(SAMPLE_QUESTION, SAMPLE_RESUME)).resolves.toBeDefined();
  });
});

describe('injectAnswers', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('calls generateAnswer once per question and injects each answer', async () => {
    const question2: OpenEndedQuestion = {
      ...SAMPLE_QUESTION,
      questionText: 'Describe your greatest achievement.',
      fieldSelector: 'textarea[name="question_2"]',
    };

    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Answer one.' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Answer two.' }] });

    const mockFill = vi.fn().mockResolvedValue(undefined);
    const mockLocator = vi.fn().mockReturnValue({ fill: mockFill });
    const mockPage = { locator: mockLocator } as unknown as import('playwright').Page;

    const summary = await injectAnswers(mockPage, [SAMPLE_QUESTION, question2], SAMPLE_RESUME);

    expect(summary.answered).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.results).toHaveLength(2);
    expect(mockLocator).toHaveBeenCalledWith('textarea[name="question_1"]');
    expect(mockLocator).toHaveBeenCalledWith('textarea[name="question_2"]');
    expect(mockFill).toHaveBeenCalledWith('Answer one.');
    expect(mockFill).toHaveBeenCalledWith('Answer two.');
  });

  it('increments failed and continues when generateAnswer returns an error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'));

    const mockPage = { locator: vi.fn() } as unknown as import('playwright').Page;
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const summary = await injectAnswers(mockPage, [SAMPLE_QUESTION], SAMPLE_RESUME);

    expect(summary.answered).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.results).toHaveLength(1);
    expect(summary.results[0].error).toBeDefined();
    stderrSpy.mockRestore();
  });

  it('increments failed and continues when page injection throws', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Good answer.' }],
    });

    const mockFill = vi.fn().mockRejectedValue(new Error('Element not found'));
    const mockLocator = vi.fn().mockReturnValue({ fill: mockFill });
    const mockPage = { locator: mockLocator } as unknown as import('playwright').Page;
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const summary = await injectAnswers(mockPage, [SAMPLE_QUESTION], SAMPLE_RESUME);

    expect(summary.answered).toBe(0);
    expect(summary.failed).toBe(1);
    stderrSpy.mockRestore();
  });
});
