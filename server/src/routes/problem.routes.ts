import { Router } from "express";
import { ProblemsController } from "../controllers/problems.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const problemController = new ProblemsController();

/* ======================
   STATIC & NESTED ROUTES
   ====================== */

router.get(
  "/problems/submissions",
  authenticate,
  problemController.getSubmissions.bind(problemController)
);

router.get(
  "/problems/submissions/:submissionId",
  authenticate,
  problemController.getSubmissionById.bind(problemController)
);

router.post(
  "/problems/playlists",
  authenticate,
  problemController.createPlayList.bind(problemController)
);

router.get(
  "/problems/playlists",
  authenticate,
  problemController.getPlayLists.bind(problemController)
);

router.post(
  "/problems/playlists/add-problem",
  authenticate,
  problemController.addProblemToPlayList.bind(problemController)
);

router.delete(
  "/problems/playlists/:playlistId",
  authenticate,
  problemController.deletePlayList.bind(problemController)
);
router.delete(
  "/problems/playlists/remove-problem/:playlistId/:problemId",
  authenticate,
  problemController.removeProblemFromPlayList.bind(problemController)
);

/* ======================
   PROBLEM CRUD & ACTIONS
   ====================== */

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

router.post(
  "/problems/:id/submit",
  authenticate,
  problemController.submitExecuteCode.bind(problemController)
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

/* ======================
   PUBLIC ROUTES
   ====================== */

router.get(
  "/problems",
  problemController.getAllProblems.bind(problemController)
);

export default router;
