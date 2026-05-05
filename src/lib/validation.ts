import { z } from "zod";

// Default allowed domain set; can be overridden at runtime by system_settings.
const DEFAULT_DOMAINS = ["edu"];
let runtimeDomains: string[] = DEFAULT_DOMAINS;

export function setAllowedEmailDomains(list: string[]) {
  runtimeDomains = list.length ? list : DEFAULT_DOMAINS;
}

export function getAllowedEmailDomains() {
  return runtimeDomains;
}

function emailMatchesAllowedDomain(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return runtimeDomains.some((d) => lower.endsWith("." + d.toLowerCase().replace(/^\./, "")));
}

export const ALLOWED_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255)
  .refine((v) => emailMatchesAllowedDomain(v), {
    message: "Email domain is not allowed",
  });

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const nameSchema = z.string().trim().min(1, "Name is required").max(80);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(128),
});

export const roomNameSchema = z.string().trim().min(2, "Name too short").max(60);
export const roomCodeSchema = z
  .string()
  .trim()
  .min(4, "Code too short")
  .max(12)
  .transform((v) => v.toUpperCase());
