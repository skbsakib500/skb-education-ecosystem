import { z } from "zod";

/* ---------- Auth ---------- */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name is required")
      .max(80, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

/* ---------- Institution ---------- */

export const institutionSchema = z.object({
  name: z
    .string()
    .min(2, "Institution name is required")
    .max(120, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(60, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  type: z.string().min(1, "Select institution type"),
  division: z.string().min(1, "Select division"),
  city: z.string().optional(),
  education_board: z.string().optional(),
  contact_email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().optional(),
});

export type InstitutionInput = z.infer<typeof institutionSchema>;

/* ---------- Profile ---------- */

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(80),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio is too long").optional(),
  address: z.string().max(200).optional(),
  username: z
    .string()
    .regex(/^[a-z0-9_]*$/, "Only lowercase, numbers, underscore")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
