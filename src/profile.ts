import fs from 'fs';
import { z } from 'zod';
import type { Profile } from './types.js';

/** Zod schema for validating profile.json contents. */
const ProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  linkedinUrl: z.string().url(),
  workAuthorization: z.string().min(1),
  yearsOfExperience: z.number().int().nonnegative(),
  education: z.string().min(1),
  resumeText: z.string().min(1),
  resumeFilePath: z.string().min(1),
});

/**
 * Loads and validates the user profile from a JSON file.
 *
 * @param path - Absolute or relative path to profile.json.
 * @returns The validated Profile object.
 * @throws Error with field-level messages if the file is missing, unparseable, or invalid.
 */
export function loadProfile(path: string): Profile {
  if (!fs.existsSync(path)) {
    throw new Error(
      `profile.json not found.\n` +
      `Create it at: ${path}\n` +
      `Required fields: name, email, phone, linkedinUrl, workAuthorization,\n` +
      `                 yearsOfExperience, education, resumeText, resumeFilePath`
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path, 'utf-8'));
  } catch {
    throw new Error(`profile.json is not valid JSON. Check the file for syntax errors.`);
  }

  const result = ProfileSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const lines = Object.entries(fieldErrors)
      .map(([field, errors]) => `  - ${field}: ${(errors ?? []).join(', ')}`)
      .join('\n');
    throw new Error(`profile.json is invalid.\n${lines}`);
  }

  const profile = result.data;

  if (!fs.existsSync(profile.resumeFilePath)) {
    throw new Error(
      `profile.json is invalid.\n  - resumeFilePath: File not found at "${profile.resumeFilePath}"`
    );
  }

  return profile;
}
