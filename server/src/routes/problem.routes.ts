import { Router } from "express";
import { ProblemsController } from "../controllers/problems.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const problemController = new ProblemsController();

// static routes
router.get(
  "/problems/submissions",
  authenticate,
  problemController.getSubmissions.bind(problemController)
);

router.post(
  "/problems",
  authenticate,
  problemController.createProblem.bind(problemController)
);

router.post(
  "/problems/:id/execute",
  authenticate,
  problemController.executeCode.bind(problemController)
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

router.post(
  "/problems/:id/submit",
  authenticate,
  problemController.submitExecuteCode.bind(problemController)
);

router.get(
  "/problems/submissions/:submissionId",
  authenticate,
  problemController.getSubmissionById.bind(problemController)
);

// public routes
router.get(
  "/problems",
  problemController.getAllProblems.bind(problemController)
);

export default router;
