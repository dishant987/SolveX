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

// public routes
router.get(
  "/problems",
  problemController.getAllProblems.bind(problemController)
);

router.get(
  "/problems/:id",
  authenticate,
  problemController.getProblemById.bind(problemController)
);
router.delete(
  "/problems/:id",
  authenticate,
  problemController.deleteProblem.bind(problemController)
);

export default router;
