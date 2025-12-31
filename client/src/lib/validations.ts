import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must be at most 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name must be at most 50 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
});

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

export const ExampleSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  explanation: z.string().optional(),
});

export const TestCaseSchema = z.object({
  input: z.string().min(1, "Test case input is required"),
  output: z.string().min(1, "Test case output is required"),
});

// Supported languages validation
const supportedLanguages = ["javascript", "python", "java"] as const;

const CodeSnippetSchema = z.record(
  z.enum(supportedLanguages),
  z.string().min(1, "Code snippet cannot be empty")
);

const ReferenceSolutionSchema = z.record(
  z.enum(supportedLanguages),
  z.string().min(1, "Reference solution is required")
);

export const createProblemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must not exceed 150 characters")
    .regex(
      /^[a-zA-Z0-9\s\-]+$/,
      "Title can only contain letters, numbers, spaces, and hyphens"
    ),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),

  difficulty: DifficultyEnum,

  tags: z
    .array(
      z.object({
        value: z.string().min(1),
      })
    )
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed"),

  examples: z
    .array(ExampleSchema)
    .min(1, "At least one example is required")
    .max(10, "Maximum 10 examples allowed"),

  constraints: z
    .string()
    .min(5, "Constraints are required")
    .max(1000, "Constraints must not exceed 1000 characters"),

  hints: z.string().optional(),
  editorial: z.string().optional(),

  testCases: z
    .array(TestCaseSchema)
    .min(1, "At least one test case is required")
    .max(50, "Maximum 50 test cases allowed"),

  codeSnippets: CodeSnippetSchema.refine(
    (obj) => supportedLanguages.every((lang) => lang in obj),
    { message: "Code snippets required for all supported languages" }
  ),

  referenceSolution: ReferenceSolutionSchema.refine(
    (obj) => supportedLanguages.every((lang) => lang in obj),
    { message: "Reference solutions required for all supported languages" }
  ).refine(
    (obj) => Object.values(obj).every((code) => code.trim().length > 10),
    { message: "Reference solutions must be valid code" }
  ),
});

export const playlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreateProblemFormData = z.infer<typeof createProblemSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
