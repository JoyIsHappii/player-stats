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


const port = Number(process.env.PORT) || 3000;

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});