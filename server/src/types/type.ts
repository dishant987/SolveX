import type { Request } from "express";

export interface AuthRequest extends Request {
  user?: any;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}


export const Judge0LanguageMap = {
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  typescript: { id: 74, name: "TypeScript (3.7.4)" },
} as const;
