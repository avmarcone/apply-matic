import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { Job, JobStatus } from './types.js';

const REQUIRED_COLUMNS = ['url', 'company', 'role', 'status'];
const VALID_STATUSES: JobStatus[] = ['pending', 'applied', 'skipped', 'review-needed'];

/**
 * Reads and parses jobs.csv into an array of Job objects.
 *
 * @param path - Absolute or relative path to jobs.csv.
 * @returns Array of all Job rows in file order.
 * @throws Error if the file is missing or required columns are absent.
 */
export function readQueue(path: string): Job[] {
  if (!fs.existsSync(path)) {
    throw new Error(
      `jobs.csv not found.\n` +
      `Create it at: ${path}\n` +
      `Required columns: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }

  const raw = fs.readFileSync(path, 'utf-8');
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const missing = REQUIRED_COLUMNS.filter(col => !Object.keys(records[0] ?? {}).includes(col));
  if (missing.length > 0) {
    throw new Error(`jobs.csv is missing required columns: ${missing.join(', ')}`);
  }

  return records.map((r, i) => {
    if (!VALID_STATUSES.includes(r.status as JobStatus)) {
      throw new Error(
        `jobs.csv row ${i + 2}: invalid status "${r.status}". ` +
        `Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }
    return {
      url: r.url,
      company: r.company,
      role: r.role,
      status: r.status as JobStatus,
    };
  });
}

/**
 * Writes the full jobs array back to jobs.csv, overwriting the file.
 *
 * @param path - Absolute or relative path to jobs.csv.
 * @param jobs - Updated array of all Job rows.
 */
export function writeQueue(path: string, jobs: Job[]): void {
  const output = stringify(jobs, { header: true, columns: REQUIRED_COLUMNS });
  fs.writeFileSync(path, output, 'utf-8');
}

/**
 * Filters a job array to only those with status `pending`.
 *
 * @param jobs - Full list of jobs from readQueue.
 * @returns Jobs with status `pending`, in original file order.
 */
export function filterPending(jobs: Job[]): Job[] {
  return jobs.filter(j => j.status === 'pending');
}
