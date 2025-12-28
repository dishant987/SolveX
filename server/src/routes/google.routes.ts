import "dotenv/config";
import { Router } from "express";

import { generateTokens, setTokenCookies } from "../lib/jwt.js";
import passport from "../lib/passport.js";

const router = Router();

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as any;
    const token = generateTokens({ id: user.id, role: user.role });
    setTokenCookies(res, token);
    res.redirect(process.env.CLIENT_URL!);
  }
);

export default router;
