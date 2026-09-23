ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS team_a  TEXT,
  ADD COLUMN IF NOT EXISTS team_b  TEXT,
  ADD COLUMN IF NOT EXISTS goals_a INT,
  ADD COLUMN IF NOT EXISTS goals_b INT;

UPDATE matches m
SET team_a  = sub.team_a,
    team_b  = sub.team_b,
    goals_a = sub.goals_a,
    goals_b = sub.goals_b
FROM (
  SELECT DISTINCT ON (pf.match_id)
         pf.match_id,
         p.team            AS team_a,
         pf.opponent_team  AS team_b,
         pf.goals_team     AS goals_a,
         pf.goals_opponent AS goals_b
  FROM performances pf
  JOIN players p ON p.player_id = pf.player_id
  ORDER BY pf.match_id
) sub
WHERE m.match_id = sub.match_id
  AND m.team_a IS NULL;
