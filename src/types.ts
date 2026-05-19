/** Valid status values for a job row in jobs.csv. */
export type JobStatus = 'pending' | 'applied' | 'skipped' | 'review-needed';

/** A single row in jobs.csv representing one job application. */
export interface Job {
  url: string;
  company: string;
  role: string;
  status: JobStatus;
}

/** Personal profile loaded from profile.json. */
export interface Profile {
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  workAuthorization: string;
  yearsOfExperience: number;
  education: string;
  resumeText: string;
  resumeFilePath: string;
}

/** The outcome of processing a single job. */
export interface RunResult {
  job: Job;
  outcome: 'applied' | 'review-needed' | 'error';
  error?: string;
}

/** Contextual information about a job, passed to the answer generator. */
export interface JobContext {
  company: string;
  role: string;
  jobDescription: string;
}

/** A free-text question on a Greenhouse form that requires an AI-generated answer. */
export interface OpenEndedQuestion {
  questionText: string;
  fieldSelector: string;
  context: JobContext;
}

/** The result returned by fillForm after processing a Greenhouse application page. */
export interface FillResult {
  openEndedQuestions: OpenEndedQuestion[];
  filledFields: string[];
  skippedFields: string[];
  page: import('playwright').Page;
}

/** The outcome of generating an AI answer for a single open-ended question. */
export interface AnswerResult {
  questionText: string;
  answer: string;
  fieldSelector: string;
  error?: string;
}

/** Returned by injectAnswers after processing all open-ended questions. */
export interface InjectionSummary {
  answered: number;
  failed: number;
  results: AnswerResult[];
}
