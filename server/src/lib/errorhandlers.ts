import type { Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: unknown, res: Response) => {
  console.error("Error:", error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        res.status(409).json({
          success: false,
          message: "A record with this unique field already exists",
          code: "DUPLICATE_ENTRY",
          field: error.meta?.target,
        });
        return;

      case "P2003":
        res.status(400).json({
          success: false,
          message: "Foreign key constraint failed",
          code: "INVALID_REFERENCE",
          field: error.meta?.field_name,
        });
        return;

      case "P2025":
        res.status(404).json({
          success: false,
          message: "Record not found",
          code: "NOT_FOUND",
        });
        return;

      case "P2014":
        res.status(400).json({
          success: false,
          message: "Invalid relation",
          code: "INVALID_RELATION",
        });
        return;

      default:
        res.status(500).json({
          success: false,
          message: "Database error occurred",
          code: "DATABASE_ERROR",
        });
        return;
    }
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
