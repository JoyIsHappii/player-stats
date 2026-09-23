import express from "express";
import {
    getPlayers,
    getPlayer,
    addPlayer,
    editPlayer,
    deletePlayer
} from "../controllers/playersController.js";

const router = express.Router();


router.get("/", getPlayers);

//Get PLAYER by ID
router.get("/:id", getPlayer);

//Add PLAYER
router.post("/", addPlayer);

//Edit PLAYER
router.put("/:id", editPlayer);

//Delete PLAYER
router.delete("/:id", deletePlayer);


export default router;