import bcrypt from "bcrypt";

import crypto from "crypto";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/validator.js";
import { AppError } from "../lib/errorhandlers.js";
import { prisma } from "../lib/prisma.js";
import { generateTokens, verifyRefreshToken } from "../lib/jwt.js";
import { uploadToCloudinary } from "../lib/uploadToCloudinary.js";

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword ?? undefined,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        accounts: {
          create: {
            provider: "LOCAL",
            providerId: data.email,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.password) {
      throw new AppError("Please login with your social account", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: "If the email exists, a reset link has been sent" };
    }

    if (!user.password) {
      throw new AppError(
        "Cannot reset password for social login accounts",
        400
      );
    }

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email with reset link
    // For now, return token (remove this in production)
    return {
      message: "If the email exists, a reset link has been sent",
      token: process.env.NODE_ENV === "development" ? token : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new AppError("Reset token has expired", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return { message: "Password reset successful" };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  updateUserImage = async (userId: string, file: Express.Multer.File) => {
    const imageUrl = await uploadToCloudinary(file);

    await prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
    });

    return { id: userId, imageUrl };
  };

  async linkAccount(userId: string, provider: "GOOGLE", providerId: string) {
    // Check if account is already linked to another user
    const existingAccount = await prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });

    if (existingAccount) {
      if (existingAccount.userId === userId) {
        throw new AppError("Account already linked to your profile", 400);
      }
      throw new AppError("Account already linked to another user", 400);
    }

    // Check if user already has this provider linked
    const userAccount = await prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (userAccount) {
      throw new AppError(`${provider} account already linked`, 400);
    }

    await prisma.authAccount.create({
      data: {
        provider,
        providerId,
        userId,
      },
    });

    return { message: "Account linked successfully" };
  }

  async unlinkAccount(userId: string, provider: "GOOGLE" | "LOCAL") {
    const userAccounts = await prisma.authAccount.findMany({
      where: { userId },
    });

    if (userAccounts.length <= 1) {
      throw new AppError("Cannot unlink your only authentication method", 400);
    }

    const account = await prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!account) {
      throw new AppError("Account not found", 404);
    }

    await prisma.authAccount.delete({
      where: { id: account.id },
    });

    if (provider === "LOCAL") {
      await prisma.user.update({
        where: { id: userId },
        data: { password: null },
      });
    }

    return { message: "Account unlinked successfully" };
  }
}
