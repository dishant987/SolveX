import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

export const linkAccountSchema = z.object({
  provider: z.enum(["GOOGLE"]),
});

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

export const TestCaseSchema = z.object({
  input: z.string().min(1, "Test case input is required"),
  output: z.string().min(1, "Test case output is required"),
});

export const ExampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().optional(),
});

export const CodeSnippetSchema = z.record(
  z.string(), // language key (e.g. "python", "javascript")
  z.string().min(1, "Code snippet cannot be empty")
);

export const ReferenceSolutionSchema = z.record(
  z.string(), // language key
  z.string().min(1)
);

export const CreateProblemSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  difficulty: DifficultyEnum,
  tags: z.array(z.string().min(1)).min(1),
  examples: z.array(ExampleSchema).min(1),
  constraints: z.string().min(5),
  hints: z.string().optional(),
  editorial: z.string().optional(),

  testCases: z.array(TestCaseSchema).min(1),
  codeSnippets: CodeSnippetSchema,
  referenceSolution: ReferenceSolutionSchema,
});

export type CreateProblemInput = z.infer<typeof CreateProblemSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LinkAccountInput = z.infer<typeof linkAccountSchema>;
