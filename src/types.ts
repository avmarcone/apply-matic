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
