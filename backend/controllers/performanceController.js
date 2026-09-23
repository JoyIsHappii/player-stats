import pool from "../db.js";

// GET ALL PERFORMANCES (paginated list with JOIN)
export async function getPerformances(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const sortBy = req.query.sortBy || "id";
        const sortOrder = (req.query.sortOrder || "asc").toLowerCase();
        const validSortColumns = ["id", "player_name", "team", "position", "opponent_team",
            "match_date", "minutes_played", "goals", "assists", "shots", "pass_accuracy", "player_rating"];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({ error: "Invalid sortBy value" });
        }
        if (!["asc", "desc"].includes(sortOrder)) {
            return res.status(400).json({ error: "Invalid sortOrder value" });
        }

        const result = await pool.query(
            `SELECT pf.id, p.player_name, p.team, p.position, p.jersey_number,
                    m.match_date, pf.opponent_team,
                    pf.minutes_played, pf.goals, pf.assists, pf.shots,
                    pf.pass_accuracy, pf.player_rating
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
             JOIN matches m ON pf.match_id = m.match_id
             WHERE p.player_name ILIKE $1
             ORDER BY ${sortBy} ${sortOrder}
             LIMIT $2 OFFSET $3`,
            [`%${search}%`, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*)
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
             WHERE p.player_name ILIKE $1`,
            [`%${search}%`]
        );

        res.json({
            page, limit,
            total: Number(countResult.rows[0].count),
            performances: result.rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// GET ONE PERFORMANCE (detail view)
export async function getPerformance(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT pf.*,
                    p.player_name, p.team, p.position, p.jersey_number, p.nationality,
                    m.match_date, m.stadium, m.city, m.tournament_stage
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
             JOIN matches m ON pf.match_id = m.match_id
             WHERE pf.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Performance not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// ADD PERFORMANCE
export async function addPerformance(req, res) {
    try {
        const { player_id, match_id, minutes_played, goals, assists, shots, player_rating } = req.body;
        const result = await pool.query(
            `INSERT INTO performances (player_id, match_id, minutes_played, goals, assists, shots, player_rating)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [player_id, match_id, minutes_played, goals, assists, shots, player_rating]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // pg error codes: 23505 = unique violation, 23503 = foreign key violation
        if (error.code === "23505") {
            return res.status(409).json({ error: "That player already has a performance recorded for that match" });
        }
        if (error.code === "23503") {
            return res.status(400).json({ error: "Unknown player_id or match_id" });
        }
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// EDIT PERFORMANCE
export async function updatePerformance(req, res) {
    try {
        const { id } = req.params;
        const {
            minutes_played, goals, assists, shots, shots_on_target, key_passes,
            tackles, interceptions, blocks, clearances,
            fouls_committed, yellow_cards, red_cards, player_rating
        } = req.body;

        const result = await pool.query(
            `UPDATE performances SET
                minutes_played = $1, goals = $2, assists = $3, shots = $4,
                shots_on_target = $5, key_passes = $6, tackles = $7,
                interceptions = $8, blocks = $9, clearances = $10,
                fouls_committed = $11, yellow_cards = $12, red_cards = $13,
                player_rating = $14
             WHERE id = $15 RETURNING *`,
            [minutes_played, goals, assists, shots, shots_on_target, key_passes,
             tackles, interceptions, blocks, clearances,
             fouls_committed, yellow_cards, red_cards, player_rating, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Performance not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// DELETE PERFORMANCE
export async function deletePerformance(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "DELETE FROM performances WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Performance not found" });
        }
        res.json({ message: "Performance deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

// RANKINGS (JOIN + aggregate)
export async function getRankings(req, res) {
    try {
        const sortBy = req.query.sortBy || "total_goals";
        const validSortColumns = ["total_goals", "total_assists", "avg_rating", "matches_played"];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({ error: "Invalid sortBy value" });
        }

        const result = await pool.query(
              `SELECT p.player_id, p.player_name, p.team, p.jersey_number, p.position,
                    COUNT(*) AS matches_played,
                    SUM(pf.goals) AS total_goals,
                    SUM(pf.assists) AS total_assists,
                    ROUND(AVG(pf.player_rating), 2) AS avg_rating
             FROM performances pf
             JOIN players p ON pf.player_id = p.player_id
               GROUP BY p.player_id, p.player_name, p.team, p.jersey_number, p.position
             ORDER BY ${sortBy} DESC
             LIMIT 10`
        );
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}