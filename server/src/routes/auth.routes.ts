import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import passport from "passport";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../lib/upload.js";

const router = Router();
const authController = new AuthController();

// Local auth routes
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.post("/refresh", authController.refreshToken.bind(authController));

// Password reset routes
router.post(
  "/password/reset-request",
  authController.requestPasswordReset.bind(authController)
);
router.post(
  "/password/reset",
  authController.resetPassword.bind(authController)
);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/error`,
  }),
  authController.googleCallback.bind(authController)
);

// Protected routes
router.get("/me", authenticate, authController.getMe.bind(authController));
router.get(
  "/profile",
  authenticate,
  authController.getProfile.bind(authController)
);
router.put(
  "/profile",
  authenticate,
  authController.updateProfile.bind(authController)
);
router.patch(
  "/profile/image",
  upload.single("file"),
  authenticate,
  authController.updateImage.bind(authController)
);
router.post(
  "/link-account",
  authenticate,
  authController.linkAccount.bind(authController)
);
router.post(
  "/unlink-account",
  authenticate,
  authController.unlinkAccount.bind(authController)
);

export default router;
