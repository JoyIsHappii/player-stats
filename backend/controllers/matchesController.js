import pool from "../db.js";

function orNull(value) {
    return value === "" || value === undefined ? null : value;
}

// GET ALL MATCHES (paginated — exactly `limit` matches per page)
export async function getMatches(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT *
             FROM matches
             WHERE team_a ILIKE $1 OR team_b ILIKE $1
                OR stadium ILIKE $1 OR city ILIKE $1
             ORDER BY match_date DESC
             LIMIT $2 OFFSET $3`,
            [`%${search}%`, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*)
             FROM matches
             WHERE team_a ILIKE $1 OR team_b ILIKE $1
                OR stadium ILIKE $1 OR city ILIKE $1`,
            [`%${search}%`]
        );

        res.json({
            page, limit,
            total: Number(countResult.rows[0].count),
            matches: result.rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// GET ONE MATCH
export async function getMatch(req, res) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM matches WHERE match_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Match not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// CREATE MATCH
export async function createMatch(req, res) {
    try {
        const { match_id, match_date, stadium, city, tournament_stage,
            team_a, team_b, goals_a, goals_b } = req.body;


        let id = match_id;
        if (!id) {
            const maxResult = await pool.query(
                "SELECT MAX(match_id) AS max_id FROM matches"
            );
            const maxId = maxResult.rows[0].max_id || "M00000";
            const nextNumber = Number(maxId.slice(1)) + 1;
            id = "M" + String(nextNumber).padStart(5, "0");
        }

        const result = await pool.query(
            `INSERT INTO matches (match_id, match_date, stadium, city, tournament_stage,
                                  team_a, team_b, goals_a, goals_b)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, match_date, stadium, city, tournament_stage,
                orNull(team_a), orNull(team_b), orNull(goals_a), orNull(goals_b)]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // 23505 = unique violation (that match_id already exists)
        if (error.code === "23505") {
            return res.status(409).json({ error: "A match with that ID already exists" });
        }
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// UPDATE MATCH
export async function updateMatch(req, res) {
    try {
        const { id } = req.params;
        const { match_date, stadium, city, tournament_stage,
            team_a, team_b, goals_a, goals_b, orig_team_a } = req.body;

        const result = await pool.query(
            `UPDATE matches
             SET match_date = $1, stadium = $2, city = $3, tournament_stage = $4,
                 team_a = $5, team_b = $6, goals_a = $7, goals_b = $8
             WHERE match_id = $9
             RETURNING *`,
            [match_date, stadium, city, tournament_stage,
                orNull(team_a), orNull(team_b), orNull(goals_a), orNull(goals_b), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Match not found" });
        }

        //TEAM A, TEAM B, GOALS A, GOALS B are stored in the matches table, so we can update the performances rows for this match to reflect the new values. We use orig_team_a to determine which team is "side A" (the team that was originally team_a) and which is "side B" (the other team). This way, we can update the goals_team, goals_opponent, and match_result fields in performances correctly.
        const sideTeam = orig_team_a || team_a;
        const a = Number(goals_a);
        const b = Number(goals_b);

        if (sideTeam && !Number.isNaN(a) && !Number.isNaN(b)) {
            // work out win / lose / draw in plain JavaScript
            let resultA = "D";
            let resultB = "D";
            if (a > b) { resultA = "W"; resultB = "L"; }
            if (a < b) { resultA = "L"; resultB = "W"; }

            // side A = players whose team is sideTeam
            await pool.query(
                `UPDATE performances
                 SET goals_team = $1, goals_opponent = $2, match_result = $3
                 WHERE match_id = $4
                   AND player_id IN (SELECT player_id FROM players WHERE team = $5)`,
                [a, b, resultA, id, sideTeam]
            );

            // side B = every other player in this match
            await pool.query(
                `UPDATE performances
                 SET goals_team = $1, goals_opponent = $2, match_result = $3
                 WHERE match_id = $4
                   AND player_id NOT IN (SELECT player_id FROM players WHERE team = $5)`,
                [b, a, resultB, id, sideTeam]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// DELETE MATCH 
export async function deleteMatch(req, res) {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM performances WHERE match_id = $1", [id]);

        const result = await pool.query(
            "DELETE FROM matches WHERE match_id = $1 RETURNING match_id",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Match not found" });
        }
        res.json({ message: `Match ${id} deleted successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// GET PLAYERS OF ONE MATCH (paginated — exactly `limit` players per page)
export async function getMatchPlayers(req, res) {
    try {
        const { id } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT pf.id, p.player_name, p.team, p.position, p.jersey_number,
                    pf.opponent_team, pf.goals_team, pf.goals_opponent,
                    pf.minutes_played, pf.goals, pf.assists, pf.shots,
                    pf.pass_accuracy, pf.player_rating
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
             WHERE pf.match_id = $1 AND p.player_name ILIKE $2
             ORDER BY p.team, p.position
             LIMIT $3 OFFSET $4`,
            [id, `%${search}%`, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*)
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
             WHERE pf.match_id = $1 AND p.player_name ILIKE $2`,
            [id, `%${search}%`]
        );

        res.json({
            page, limit,
            total: Number(countResult.rows[0].count),
            players: result.rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}
