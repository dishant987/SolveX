import type { Response } from "express";
import { handleError } from "../lib/errorhandlers.js";
import { Judge0LanguageMap, type AuthRequest } from "../types/type.js";
import {
  CreateProblemSchema,
  GetProblemByIdSchema,
  GetProblemsQuerySchema,
} from "../validators/validator.js";
import { Judge0Service } from "../services/judge0.service.js";
import { ProblemService } from "../services/problem.service.js";
import { wrapCode } from "../lib/wrapReferenceSolution.js";

const judge0Service = new Judge0Service();
const problemService = new ProblemService();

export class ProblemsController {
  async createProblem(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;

      if (user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have permission to create problems.",
        });
      }

      // ✅ Zod validation
      const validatedData = CreateProblemSchema.parse(req.body);

      // ✅ Validate reference solutions against test cases
      for (const [languageKey, code] of Object.entries(
        validatedData.referenceSolution
      )) {
        const languageInfo =
          Judge0LanguageMap[languageKey as keyof typeof Judge0LanguageMap];

        if (!languageInfo) {
          return res.status(400).json({
            success: false,
            message: `Unsupported language: ${languageKey}`,
          });
        }
        const wrappedCode = wrapCode(languageKey as any, code);
        const submissions = validatedData.testCases.map((tc) => ({
          source_code: wrappedCode,
          language_id: languageInfo.id,
          stdin: tc.input,
          expected_output: tc.output,
        }));

        const submitResponses = await judge0Service.batchSubmit(submissions);
        const tokens = submitResponses.map((r) => r.token);

        const results = await judge0Service.pollBatchResults(tokens);

        for (let i = 0; i < results.length; i++) {
          const r = results[i];

          // ❌ Anything other than ACCEPTED
          if (r.status.id !== 3) {
            return res.status(400).json({
              success: false,
              message: `Reference solution failed for ${languageInfo.name}`,
              testCase: {
                input: submissions[i].stdin,
                expectedOutput: submissions[i].expected_output,
                actualOutput: r.stdout?.trim(),
                error: r.stderr || r.compile_output,
              },
              judge0Status: r.status,
            });
          }
        }
      }

      // ✅ PASS userId explicitly
      const problem = await problemService.createProblem({
        ...validatedData,
        userId: user.id,
      });

      return res.status(201).json({
        success: true,
        message: "Problem created successfully",
        data: problem,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getAllProblems(req: AuthRequest, res: Response) {
    try {
      const query = GetProblemsQuerySchema.parse(req.query);

      const result = await problemService.getAllProblems(query);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getProblemById(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { id } = GetProblemByIdSchema.parse(req.params);

      const problem = await problemService.getProblemById(id,user?.id);

      return res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error: any) {
      if (error.message === "PROBLEM_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }
      handleError(error, res);
    }
  }

  async deleteProblem(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;
      if (!user || user.role !== "ADMIN") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { id } = GetProblemByIdSchema.parse(req.params);
      console.log(id);
      const problem = await problemService.getProblemById(id);
      if (problem === null) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }
      if (problem?.userId !== user.
        id) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You do not have permission to delete this problem.",
        });
      }
      const deletedProblem = await problemService.deleteProblem(id);
      if (deletedProblem === null) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error: any) {
      handleError(error, res);
    }
  }
}
