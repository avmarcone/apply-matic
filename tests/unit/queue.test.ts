import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readQueue, writeQueue, filterPending } from '../../src/queue.js';

const VALID_CSV = `url,company,role,status
https://boards.greenhouse.io/acme/jobs/1,Acme Corp,Senior Engineer,pending
https://boards.greenhouse.io/beta/jobs/2,Beta Inc,Staff Engineer,applied
https://boards.greenhouse.io/gamma/jobs/3,Gamma Ltd,Principal Engineer,skipped
`;

let tmpDir: string;
let csvPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'applymatic-test-'));
  csvPath = path.join(tmpDir, 'jobs.csv');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readQueue', () => {
  it('parses a valid CSV into Job objects', () => {
    fs.writeFileSync(csvPath, VALID_CSV);
    const jobs = readQueue(csvPath);
    expect(jobs).toHaveLength(3);
    expect(jobs[0]).toEqual({
      url: 'https://boards.greenhouse.io/acme/jobs/1',
      company: 'Acme Corp',
      role: 'Senior Engineer',
      status: 'pending',
    });
  });

  it('throws an actionable error when the file is missing', () => {
    expect(() => readQueue('/nonexistent/jobs.csv')).toThrow('jobs.csv not found');
  });

  it('throws when required columns are missing', () => {
    fs.writeFileSync(csvPath, 'url,company\nhttps://example.com,Acme\n');
    expect(() => readQueue(csvPath)).toThrow('missing required columns');
  });

  it('throws when a row has an invalid status', () => {
    const bad = `url,company,role,status\nhttps://example.com,Acme,Engineer,unknown\n`;
    fs.writeFileSync(csvPath, bad);
    expect(() => readQueue(csvPath)).toThrow('invalid status');
  });
});

describe('filterPending', () => {
  it('returns only pending jobs', () => {
    fs.writeFileSync(csvPath, VALID_CSV);
    const jobs = readQueue(csvPath);
    const pending = filterPending(jobs);
    expect(pending).toHaveLength(1);
    expect(pending[0].company).toBe('Acme Corp');
  });

  it('returns empty array when no jobs are pending', () => {
    const csv = `url,company,role,status\nhttps://example.com,Acme,Engineer,applied\n`;
    fs.writeFileSync(csvPath, csv);
    const jobs = readQueue(csvPath);
    expect(filterPending(jobs)).toHaveLength(0);
  });

  it('ignores applied, skipped, and review-needed rows', () => {
    const csv = [
      'url,company,role,status',
      'https://a.com,A,Eng,applied',
      'https://b.com,B,Eng,skipped',
      'https://c.com,C,Eng,review-needed',
    ].join('\n') + '\n';
    fs.writeFileSync(csvPath, csv);
    expect(filterPending(readQueue(csvPath))).toHaveLength(0);
  });
});

describe('writeQueue', () => {
  it('writes updated statuses back to the CSV', () => {
    fs.writeFileSync(csvPath, VALID_CSV);
    const jobs = readQueue(csvPath);
    jobs[0].status = 'applied';
    writeQueue(csvPath, jobs);
    const updated = readQueue(csvPath);
    expect(updated[0].status).toBe('applied');
    expect(updated[1].status).toBe('applied');
    expect(updated[2].status).toBe('skipped');
  });
});
