import express from "express";
import cors from "cors";
import playersRouter from "./routes/players.js";
import performancesRouter from "./routes/performances.js";
import matchesRouter from "./routes/matches.js";


const app = express();


app.use(cors());
app.use(express.json());



//Performances routes
app.use("/performances", performancesRouter);




// Players routes
app.use("/players", playersRouter);

// Matches routes
app.use("/matches", matchesRouter);


app.get("/", (req,res)=>{
    res.send("Player Performance API is running");
});


app.listen(3000,()=>{
    console.log("Server running on port 3000");
});