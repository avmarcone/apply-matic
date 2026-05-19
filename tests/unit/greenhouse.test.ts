import { describe, it, expect } from 'vitest';
import { isOpenEndedQuestion } from '../../src/greenhouse.js';

describe('isOpenEndedQuestion', () => {
  // Standard field labels — should return false
  it.each([
    'Email',
    'email address',
    'Phone',
    'Phone Number',
    'LinkedIn',
    'LinkedIn Profile',
    'LinkedIn URL',
    'Resume',
    'Upload Resume',
    'Cover Letter',
    'Work Authorization',
    'Years of Experience',
    'Education',
    'Degree',
    'First Name',
    'Last Name',
    'Full Name',
    'Website',
    'Portfolio',
    'GitHub',
    'Salary',
    'Start Date',
    'Location',
  ])('returns false for standard field label "%s"', label => {
    expect(isOpenEndedQuestion(label)).toBe(false);
  });

  // Open-ended question labels — should return true
  it.each([
    'Why do you want to work here?',
    'Describe your experience with Kubernetes',
    'What makes you a good fit for this role?',
    'Tell us about yourself',
    'What are your career goals?',
    'How did you hear about us?',
    'Anything else you would like us to know?',
  ])('returns true for open-ended label "%s"', label => {
    expect(isOpenEndedQuestion(label)).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isOpenEndedQuestion('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isOpenEndedQuestion('   ')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isOpenEndedQuestion('EMAIL ADDRESS')).toBe(false);
    expect(isOpenEndedQuestion('LINKEDIN URL')).toBe(false);
  });
});
