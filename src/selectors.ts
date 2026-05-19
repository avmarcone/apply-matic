/**
 * CSS selector lists for each standard Greenhouse application field.
 * Selectors are tried in order; the first match wins.
 */
export const STANDARD_FIELD_SELECTORS: Record<string, string[]> = {
  firstName: [
    'input[name*="first_name"]',
    'input#first_name',
    'input[autocomplete="given-name"]',
  ],
  lastName: [
    'input[name*="last_name"]',
    'input#last_name',
    'input[autocomplete="family-name"]',
  ],
  email: [
    'input[name*="email"][type="email"]',
    'input#email',
    'input[type="email"]',
  ],
  phone: [
    'input[name*="phone"]',
    'input[type="tel"]',
    'input#phone',
  ],
  resume: [
    'input[type="file"][name*="resume"]',
    'input[type="file"]:first-of-type',
  ],
  linkedin: [
    'input[id*="linkedin" i]',
    'input[name*="linkedin" i]',
    'input[placeholder*="linkedin" i]',
  ],
};

/**
 * Label text substrings that identify standard (non-open-ended) fields.
 * Any textarea or text input whose label matches one of these patterns
 * (case-insensitive) is treated as a standard field, not an open-ended question.
 */
export const OPEN_ENDED_LABEL_EXCLUSIONS: string[] = [
  'first name',
  'last name',
  'full name',
  'name',
  'email',
  'phone',
  'mobile',
  'linkedin',
  'resume',
  'cv',
  'cover letter',
  'work authorization',
  'authorized to work',
  'sponsorship',
  'years of experience',
  'education',
  'degree',
  'school',
  'university',
  'website',
  'portfolio',
  'github',
  'twitter',
  'salary',
  'start date',
  'location',
  'city',
  'address',
];
