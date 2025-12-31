import type { Response } from "express";

import { AuthService } from "../services/auth.service.js";

import {
  setTokenCookies,
  clearTokenCookies,
  generateTokens,
} from "../lib/jwt.js";
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/validator.js";
import type { AuthRequest } from "../types/type.js";
import { handleError } from "../lib/errorhandlers.js";

const authService = new AuthService();

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, tokens } = await authService.register(validatedData);

      setTokenCookies(res, tokens);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: { user },
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, tokens } = await authService.login(validatedData);

      setTokenCookies(res, tokens);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user },
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async googleCallback(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
      }

      const tokens = generateTokens({
        userId: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      });

      setTokenCookies(res, tokens);

      res.redirect(`${process.env.CLIENT_URL}/login?success=google`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        `${process.env.CLIENT_URL}/login?error=Authentication%20failed`
      );
    }
  }

  async refreshToken(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      setTokenCookies(res, tokens);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      clearTokenCookies(res);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async requestPasswordReset(req: AuthRequest, res: Response) {
    try {
      const { email } = resetPasswordRequestSchema.parse(req.body);
      await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getProfile(req.user!.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await authService.updateProfile(req.user!.id, validatedData);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  updateImage = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file required" });
      }

      const user = await authService.updateUserImage(req.user!.id, req.file);

      res.json({
        message: "Image updated successfully",
        imageUrl: user.imageUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Image update failed" });
    }
  };

  async linkAccount(req: AuthRequest, res: Response) {
    try {
      // This would be called after Google OAuth flow
      // The providerId would come from the OAuth callback
      const { provider, providerId } = req.body;

      const result = await authService.linkAccount(
        req.user!.id,
        provider,
        providerId
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async unlinkAccount(req: AuthRequest, res: Response) {
    try {
      const { provider } = req.body;

      const result = await authService.unlinkAccount(req.user!.id, provider);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      handleError(error, res);
    }
  }
}
