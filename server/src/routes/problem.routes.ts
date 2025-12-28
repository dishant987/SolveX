import { Router } from "express";
import { ProblemsController } from "../controllers/problems.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const problemController = new ProblemsController();

router.post(
  "/problems",
  authenticate,
  problemController.createProblem.bind(problemController)
);

export default router;
