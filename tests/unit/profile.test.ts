import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadProfile } from '../../src/profile.js';

const VALID_PROFILE = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-867-5309',
  linkedinUrl: 'https://linkedin.com/in/janesmith',
  workAuthorization: 'US Citizen',
  yearsOfExperience: 6,
  education: 'BS Computer Science, State University',
  resumeText: 'Jane Smith is a software engineer...',
  resumeFilePath: '',  // set per-test
};

let tmpDir: string;
let profilePath: string;
let resumePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'applymatic-test-'));
  profilePath = path.join(tmpDir, 'profile.json');
  resumePath = path.join(tmpDir, 'resume.pdf');
  fs.writeFileSync(resumePath, 'fake pdf content');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadProfile', () => {
  it('loads a valid profile successfully', () => {
    const profile = { ...VALID_PROFILE, resumeFilePath: resumePath };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    const result = loadProfile(profilePath);
    expect(result.name).toBe('Jane Smith');
    expect(result.email).toBe('jane@example.com');
    expect(result.yearsOfExperience).toBe(6);
  });

  it('throws when profile.json is missing', () => {
    expect(() => loadProfile('/nonexistent/profile.json')).toThrow('profile.json not found');
  });

  it('throws with a field-level error for an invalid email', () => {
    const profile = { ...VALID_PROFILE, email: 'not-an-email', resumeFilePath: resumePath };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    expect(() => loadProfile(profilePath)).toThrow('email');
  });

  it('throws with a field-level error for a missing required field', () => {
    const { name: _omit, ...profile } = { ...VALID_PROFILE, resumeFilePath: resumePath };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    expect(() => loadProfile(profilePath)).toThrow('name');
  });

  it('throws when resumeFilePath points to a non-existent file', () => {
    const profile = { ...VALID_PROFILE, resumeFilePath: '/nonexistent/resume.pdf' };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    expect(() => loadProfile(profilePath)).toThrow('resumeFilePath');
  });

  it('throws for non-numeric yearsOfExperience', () => {
    const profile = { ...VALID_PROFILE, yearsOfExperience: 'six', resumeFilePath: resumePath };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    expect(() => loadProfile(profilePath)).toThrow('yearsOfExperience');
  });

  it('throws for negative yearsOfExperience', () => {
    const profile = { ...VALID_PROFILE, yearsOfExperience: -1, resumeFilePath: resumePath };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    expect(() => loadProfile(profilePath)).toThrow('yearsOfExperience');
  });

  it('throws when profile.json contains invalid JSON syntax', () => {
    fs.writeFileSync(profilePath, '{ not valid json }');
    expect(() => loadProfile(profilePath)).toThrow('not valid JSON');
  });
});
