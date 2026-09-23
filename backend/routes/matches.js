import express from "express";
import {
    getMatches,
    getMatch,
    getMatchPlayers,
    createMatch,
    updateMatch,
    deleteMatch
} from "../controllers/matchesController.js";

const router = express.Router();

router.get("/", getMatches);
router.post("/", createMatch);

// specific routes BEFORE the generic /:id
router.get("/:id/players", getMatchPlayers);

router.get("/:id", getMatch);
router.put("/:id", updateMatch);
router.delete("/:id", deleteMatch);

export default router;
