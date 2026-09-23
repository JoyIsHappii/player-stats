import express from "express";
import {
  getPerformances,
  getPerformance,
  getRankings,
  addPerformance,
  updatePerformance,
  deletePerformance,
} from "../controllers/performanceController.js";

const router = express.Router();

router.get("/", getPerformances);
router.get("/rankings", getRankings);
router.get("/:id", getPerformance);

router.post("/", addPerformance);
router.put("/:id", updatePerformance);
router.delete("/:id", deletePerformance);

export default router;