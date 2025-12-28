import type { Difficulty } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

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
}
