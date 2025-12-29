import type { Difficulty } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import type { GetAllProblemsParams } from "../types/type.js";

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
}
