import type { Difficulty } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateSubmissionData,
  GetAllProblemsParams,
  TestCaseResultData,
} from "../types/type.js";

interface ProblemData {
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  userId: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string;
  hints: string;
  editorial: string;
  testCases: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  codeSnippets: Record<string, string>;
  referenceSolution: Record<string, string>;
}

export class ProblemService {
  async createProblem(data: ProblemData) {
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        userId: data.userId,
        examples: data.examples,
        constraints: data.constraints,
        hints: data.hints,
        editorial: data.editorial,
        testCases: data.testCases,
        codeSnippets: data.codeSnippets,
        referenceSolution: data.referenceSolution,
      },
    });

    return problem;
  }

  async getAllProblems(params: GetAllProblemsParams) {
    const { page, limit, search, difficulty, tags, sortBy, order } = params;

    const where: any = {
      ...(difficulty && { difficulty }),
      ...(tags && {
        tags: {
          hasEvery: tags,
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.problem.count({ where }),
    ]);

    return {
      data: problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProblemById(id: string, userId?: string) {
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!problem) {
      return null;
    }

    return problem;
  }

  async deleteProblem(id: string) {
    const problem = await prisma.problem.delete({
      where: { id },
    });

    if (!problem) {
      return null;
    }
    return problem;
  }
  async getProblemForExecution(problemId: string) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        testCases: true,
      },
    });

    if (!problem) {
      throw new Error("PROBLEM_NOT_FOUND");
    }

    return problem;
  }

  async createSubmission(data: CreateSubmissionData) {
    const submission = await prisma.submission.create({
      data: {
        userId: data.userId,
        problemId: data.problemId,
        sourceCode: data.sourceCode,
        language: data.language,
        status: data.status || "PENDING",
        memory: data.memory || "0",
        time: data.time || "0",
      },
    });

    return submission;
  }

  async createTestCaseResult(data: TestCaseResultData) {
    console.log("createTestCaseResult : ",data);
    const testCaseResult = await prisma.testCaseResult.create({
      data,
    });

    return testCaseResult;
  }
  async updateSubmissionStatus(
    submissionId: string,
    status: string,
    memory?: string,
    time?: string
  ) {
    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        memory,
        time,
      },
    });

    return submission;
  }

  async getSubmissionById(id: string, userId?: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            tags: true,
          },
        },
        testCaseResults: true,
      },
    });

    // If userId is provided, ensure the user can only access their own submissions
    if (userId && submission && submission.userId !== userId) {
      return null;
    }

    return submission;
  }

  async getUserSubmissions(userId: string, problemId?: string) {
    const where: any = { userId };
    if (problemId) {
      where.problemId = problemId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return submissions;
  }

  async markProblemAsSolved(userId: string, problemId: string) {
    // Check if already marked as solved
    const existing = await prisma.problemSolved.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Mark as solved
    const problemSolved = await prisma.problemSolved.create({
      data: {
        userId,
        problemId,
      },
    });

    return problemSolved;
  }

  async getProblemSubmissions(problemId: string, userId?: string) {
    const where: any = { problemId };
    if (userId) {
      where.userId = userId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return submissions;
  }

  async getProblemSolutionStats(problemId: string) {
    const [totalSubmissions, acceptedSubmissions, uniqueSolvedUsers] =
      await Promise.all([
        prisma.submission.count({
          where: { problemId },
        }),
        prisma.submission.count({
          where: {
            problemId,
            status: "ACCEPTED",
          },
        }),
        prisma.problemSolved.count({
          where: { problemId },
        }),
      ]);

    return {
      totalSubmissions,
      acceptedSubmissions,
      uniqueSolvedUsers,
      acceptanceRate:
        totalSubmissions > 0
          ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
          : 0,
    };
  }
  
}
