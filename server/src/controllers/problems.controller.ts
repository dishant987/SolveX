import type { Response } from "express";
import { handleError } from "../lib/errorhandlers.js";
import { Judge0LanguageMap, type AuthRequest } from "../types/type.js";
import {
  CreateProblemSchema,
  ExecuteCodeSchema,
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
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;

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
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { id } = GetProblemByIdSchema.parse(req.params);

      const problem = await problemService.getProblemById(id, user?.id);

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
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!user || user.role !== "ADMIN") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { id } = GetProblemByIdSchema.parse(req.params);
      const problem = await problemService.getProblemById(id);
      if (problem === null) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }
      if (problem?.userId !== user.id) {
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

  // Update the executeCode function to return proper test case status
  async executeCode(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id: problemId } = GetProblemByIdSchema.parse(req.params);
      const { code, language } = ExecuteCodeSchema.parse(req.body);

      // Fetch problem + test cases
      const problem = await problemService.getProblemForExecution(problemId);

      const languageInfo =
        Judge0LanguageMap[
          language.toLocaleLowerCase() as keyof typeof Judge0LanguageMap
        ];

      if (!languageInfo) {
        return res.status(400).json({
          success: false,
          message: "Unsupported language",
        });
      }

      // Wrap user code
      const wrappedCode = wrapCode(language, code);

      // Prepare Judge0 submissions
      const submissions = problem.testCases.map((tc) => ({
        source_code: wrappedCode,
        language_id: languageInfo.id,
        stdin: tc.input,
        expected_output: tc.output,
      }));

      // Submit & poll
      const submitResponses = await judge0Service.batchSubmit(submissions);
      const tokens = submitResponses.map((r) => r.token);

      const results = await judge0Service.pollBatchResults(tokens);

      // Normalize response with detailed status
      const testCaseResults = results.map((r: any, index: number) => {
        // Determine status based on Judge0 status IDs
        let status: string;
        let statusDescription: string;

        switch (r.status.id) {
          case 3: // Accepted
            status = "ACCEPTED";
            statusDescription = "Test case passed";
            break;
          case 4: // Wrong Answer
            status = "WRONG_ANSWER";
            statusDescription = "Wrong Answer";
            break;
          case 5: // Time Limit Exceeded
            status = "TIME_LIMIT_EXCEEDED";
            statusDescription = "Time Limit Exceeded";
            break;
          case 6: // Compilation Error
            status = "COMPILATION_ERROR";
            statusDescription = "Compilation Error";
            break;
          case 7: // Runtime Error
            status = "RUNTIME_ERROR";
            statusDescription = "Runtime Error";
            break;
          default:
            status = "UNKNOWN_ERROR";
            statusDescription = r.status.description || "Unknown Error";
        }

        return {
          status,
          statusDescription,
          passed: r.status.id === 3,
          input: problem.testCases[index].input,
          expectedOutput: problem.testCases[index].output,
          actualOutput: r.stdout?.trim() || null,
          error: r.stderr || r.compile_output || null,
          executionTime: r.time ? Number(r.time) * 1000 : 0, // Convert to milliseconds
          memory: r.memory ? Number(r.memory) : 0,
        };
      });

      const allPassed = testCaseResults.every((tc) => tc.passed);

      return res.status(200).json({
        success: allPassed,
        passed: allPassed,
        totalTestCases: testCaseResults.length,
        passedTestCases: testCaseResults.filter((tc) => tc.passed).length,
        submission: {
          testCases: testCaseResults,
        },
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

  async submitExecuteCode(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id: problemId } = GetProblemByIdSchema.parse(req.params);
      const { code, language } = ExecuteCodeSchema.parse(req.body);

      // Fetch problem + test cases
      const problem = await problemService.getProblemForExecution(problemId);

      const languageInfo =
        Judge0LanguageMap[
          language.toLocaleLowerCase() as keyof typeof Judge0LanguageMap
        ];

      if (!languageInfo) {
        return res.status(400).json({
          success: false,
          message: "Unsupported language",
        });
      }

      // Wrap user code
      const wrappedCode = wrapCode(language, code);

      // Prepare Judge0 submissions
      const submissions = problem.testCases.map((tc) => ({
        source_code: wrappedCode,
        language_id: languageInfo.id,
        stdin: tc.input,
        expected_output: tc.output,
      }));

      // Create submission record in database
      const submissionRecord = await problemService.createSubmission({
        userId: user.id,
        problemId,
        sourceCode: { code, language, wrappedCode },
        language,
        status: "PENDING",
      });

      // Submit & poll
      const submitResponses = await judge0Service.batchSubmit(submissions);
      const tokens = submitResponses.map((r) => r.token);

      const results = await judge0Service.pollBatchResults(tokens);

      // Process results
      const testCaseResults = [];
      let allPassed = true;
      let totalTime = 0;
      let totalMemory = 0;
      let finalStatus = "ACCEPTED";

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const testCase = problem.testCases[i];

        // Determine status
        let status: string;
        let passed = false;

        switch (r.status.id) {
          case 3: // Accepted
            status = "ACCEPTED";
            passed = true;
            break;
          case 4: // Wrong Answer
            status = "WRONG_ANSWER";
            finalStatus = "WRONG_ANSWER";
            allPassed = false;
            break;
          case 5: // Time Limit Exceeded
            status = "TIME_LIMIT_EXCEEDED";
            finalStatus = "TIME_LIMIT_EXCEEDED";
            allPassed = false;
            break;
          case 6: // Compilation Error
            status = "COMPILATION_ERROR";
            finalStatus = "COMPILATION_ERROR";
            allPassed = false;
            break;
          case 7: // Runtime Error
            status = "RUNTIME_ERROR";
            finalStatus = "RUNTIME_ERROR";
            allPassed = false;
            break;
          default:
            status = "UNKNOWN_ERROR";
            finalStatus = "UNKNOWN_ERROR";
            allPassed = false;
        }

        // Calculate averages
        if (r.time) {
          totalTime += Number(r.time);
        }
        if (r.memory) {
          totalMemory += Number(r.memory);
        }

        // Create test case result record
        const testCaseResult = await problemService.createTestCaseResult({
          submissionId: submissionRecord.id,
          testCaseId: `testcase-${i + 1}`,
          passed,
          stdout: r.stdout || null,
          stderr: r.stderr || null,
          expected: testCase.output,
          compileOutput: r.compile_output || null,
          status,
          memory: r.memory.toString() || "0",
          time: r.time.toString() || "0",
        });

        testCaseResults.push({
          ...testCaseResult,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: r.stdout?.trim() || null,
        });
      }

      // Update submission with final status and averages
      const avgTime = results.length > 0 ? totalTime / results.length : 0;
      const avgMemory = results.length > 0 ? totalMemory / results.length : 0;

      await problemService.updateSubmissionStatus(
        submissionRecord.id,
        finalStatus,
        avgMemory.toFixed(2),
        avgTime.toFixed(2)
      );

      // If all test cases passed, mark problem as solved for this user
      if (allPassed) {
        await problemService.markProblemAsSolved(user.id, problemId);
      }

      return res.status(200).json({
        success: allPassed,
        message: allPassed ? "Submission accepted!" : "Submission failed",
        data: {
          submissionId: submissionRecord.id,
          status: finalStatus,
          passed: allPassed,
          totalTestCases: testCaseResults.length,
          passedTestCases: testCaseResults.filter((tc) => tc.passed).length,
          executionTime: avgTime.toFixed(2),
          memoryUsage: avgMemory.toFixed(2),
          testCaseResults,
        },
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

  async getSubmissions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { problemId } = req.query;
      console.log(problemId);
      const submissions = await problemService.getUserSubmissions(
        user.id,
        problemId as string
      );

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getSubmissionById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { submissionId } = req.params;

      const submission = await problemService.getSubmissionById(
        submissionId,
        user.id
      );

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async createPlayList(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name  are required",
        });
      }

      const playlist = await problemService.createPlayList({
        description,
        name,
        userId: user.id,
      });

      return res.status(200).json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getPlayLists(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;

      const playLists = await problemService.getPlayLists(user.id);

      return res.status(200).json({
        success: true,
        data: playLists,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async addProblemToPlayList(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { playlistId, problemId } = req.body;

      if (!playlistId) {
        return res.status(400).json({
          success: false,
          message: "Playlist id is required",
        });
      }

      if (!problemId) {
        return res.status(400).json({
          success: false,
          message: "Problem id is required",
        });
      }

      const playList = await problemService.getPlayListById(playlistId);

      if (!playList) {
        return res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
      }

      const problem = await problemService.getProblemById(problemId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }

      const playlist = await problemService.addProblemToPlayList(
        playlistId,
        problemId
      );

      return res.status(200).json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async deletePlayList(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { playlistId } = req.params;

      if (!playlistId) {
        return res.status(400).json({
          success: false,
          message: "Playlist id is required",
        });
      }

      const playList = await problemService.getPlayListById(playlistId);

      if (!playList) {
        return res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
      }

      if (playList.userId !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this playlist",
        });
      }

      const playlist = await problemService.deletePlayList(playlistId);

      return res.status(200).json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async removeProblemFromPlayList(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      const { playlistId, problemId } = req.params;

      if (!playlistId) {
        return res.status(400).json({
          success: false,
          message: "Playlist id is required",
        });
      }

      if (!problemId) {
        return res.status(400).json({
          success: false,
          message: "Problem id is required",
        });
      }

      const playList = await problemService.getPlayListById(playlistId);

      if (!playList) {
        return res.status(404).json({
          success: false,
          message: "Playlist not found",
        });
      }

      const problem = await problemService.getProblemById(problemId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }

      const playlist = await problemService.removeProblemFromPlayList(
        playlistId,
        problemId
      );

      return res.status(200).json({
        success: true,
        data: playlist,
      });
    } catch (error) {
      handleError(error, res);
    }
  }
}
