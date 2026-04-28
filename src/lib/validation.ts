import { z } from "zod";

export const ALLOWED_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.edu$/i;

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255)
  .regex(ALLOWED_EMAIL_REGEX, "Only .edu email addresses are allowed");

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
