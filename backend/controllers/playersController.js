import pool from "../db.js";


// GET ALL PLAYERS

export async function getPlayers(req, res) {

    try {

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const search = req.query.search || "";

        const position = req.query.position || "";

        const team = req.query.team || "";

        const sortBy = req.query.sortBy || req.query.sort || "player_id";
        const sortOrder = (req.query.sortOrder || req.query.order || "asc").toLowerCase();

        const validSortColumns = [
            "player_id",
            "player_name",
            "team",
            "position",
            "total_minutes_tournament",
            "total_goals_tournament",
            "total_assists_tournament",
            "tournament_rating"
        ];

        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({
                error: `Invalid sortBy value. Must be one of: ${validSortColumns.join(", ")}`
            });
        }

        if (!["asc", "desc"].includes(sortOrder)) {
            return res.status(400).json({
                error: `Invalid sortOrder value. Must be 'asc' or 'desc'`
            });
        }


        const offset = (page - 1) * limit;


        let query = `
        SELECT *
        FROM players
        WHERE player_name ILIKE $1
        AND position ILIKE $2
        AND team ILIKE $3
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $4
        OFFSET $5
        `;


        let values = [
            `%${search}%`,
            `%${position}%`,
            `%${team}%`,
            limit,
            offset
        ];


        const result = await pool.query(
            query,
            values
        );


        const countResult = await pool.query(
            `
            SELECT COUNT(*)
            FROM players
            WHERE player_name ILIKE $1
            AND position ILIKE $2
            AND team ILIKE $3
            `,
            [
                `%${search}%`,
                `%${position}%`,
                `%${team}%`
            ]
        );


        res.json({

            page,

            limit,

            total:
                Number(countResult.rows[0].count),

            players:
                result.rows

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Database error"
        });

    }

}

// GET ONE PLAYER
export async function getPlayer(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM players WHERE player_id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
}

//ADD PLAYER
export async function addPlayer(req, res) {

    try {

        const {
            player_id,
            player_name,
            team,
            position,
            total_minutes_tournament,
            total_goals_tournament,
            total_assists_tournament,
            tournament_rating

        } = req.body;

        const result = await pool.query(
            "INSERT INTO players (player_id, player_name, team, position, total_minutes_tournament, total_goals_tournament, total_assists_tournament, tournament_rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [player_id, player_name, team, position, total_minutes_tournament, total_goals_tournament, total_assists_tournament, tournament_rating]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Database error"
        });
    }
}

//EDIT PLAYER
export async function editPlayer(req, res) {
    try {
        const { id } = req.params;
        const {
            player_name,
            team,
            position,
            total_minutes_tournament,
            total_goals_tournament,
            total_assists_tournament,
            tournament_rating
        } = req.body;

        const result = await pool.query(
            "UPDATE players SET player_name = $1, team = $2, position = $3, total_minutes_tournament = $4, total_goals_tournament = $5, total_assists_tournament = $6, tournament_rating = $7 WHERE player_id = $8 RETURNING *",
            [player_name, team, position, total_minutes_tournament, total_goals_tournament, total_assists_tournament, tournament_rating, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Database error"
        });
    }
}

//DELETE PLAYER
export async function deletePlayer(req, res) {
    try {
        const { id } = req.params;

        // delete child rows first — performances.player_id REFERENCES players,
        // so Postgres blocks deleting a player who still has performances
        await pool.query("DELETE FROM performances WHERE player_id = $1", [id]);

        const result = await pool.query(
            "DELETE FROM players WHERE player_id = $1 RETURNING player_name",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Player not found"
            });
        }

        res.json({
            message: `Player ${result.rows[0].player_name} deleted successfully`
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Database error"
        });
    }
}