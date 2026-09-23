# Reflection

## What I built

I built a "FIFA World Cup Player Performance Explorer" using Astro for the frontend, Express API for the backend, and PostgreSQL for database management. I also used Postman to test the CRUD operations.

The application has three main pages that represent different data functions.

### Matches Page

The Matches page contains all match cards and allows users to navigate to add a new match or view match details. From the match details page, users can add and edit player performances.

The user needs to create a match first before adding players and their performances.

### Performances Page

The Performances page displays a table of player performances. Users can search for players, sort columns, and use pagination to view different sets of data.

### Rankings Page

The Rankings page displays player rankings based on their overall performance. Users can filter and sort ranking results.

---

# How the data is normalized and why

To display information on the pages, I started by creating `server.js` and `db.js` to connect my application with PostgreSQL using pgAdmin4 for database management. I organized the backend using controllers and routes.

The database contains three main tables:

### Players

Contains information about each player.

- `player_id` is used as the primary key.

### Matches

Contains information about each match.

- `match_id` is used as the primary key.

### Performances

Connects players and matches to store player performance data.

Instead of storing repeated information, I use SQL JOIN queries between tables to display one row per player per match.

Each page represents different data purposes.

---

## Performances Page

The Performances page displays one row per player per match.

This page includes pagination with options to display:

- 10 rows
- 25 rows
- 50 rows
- 100 rows

Pagination was created using SQL `LIMIT` and `OFFSET`.

The column sorting feature was created using SQL `ORDER BY`.

---

## Rankings Page

The Rankings page displays each player's total performance across multiple matches.

To create the ranking, I use aggregate functions such as `SUM()` with `GROUP BY` to calculate total statistics and sort players based on their performance.

---

## Matches Page

The Matches page was created because adding player performance requires a match first.

After creating a match, users can add players and their performance information related to that match.

---

# CRUD Features

Users are able to:

## CREATE

- Add a new match
- Add a player and player performance using `player_id`

## READ

- View match details
- View player details and their performances

## UPDATE

- Edit match information
- Edit player performance information

## DELETE

- Delete a match
- Delete a player

---

# Challenges and What I Would Improve

## Pagination

When the browser URL changed to page 2, the displayed information did not change.

I learned that the frontend and backend needed to be properly connected. The frontend must send pagination parameters to the API, and the backend needs to use those parameters to fetch the correct data from the database.

This helped me understand how data flows between the frontend, API, and database.

---

## Matches Page

Creating the Matches page was one of my biggest challenges.

The original dataset only stored `team` and `opponent_team` inside the performance records. However, these values changed depending on the player's perspective, even though they represented the same match.

Because of this design, I had difficulty adding new matches because there was no dedicated place to store match-level information such as both teams and the final score.

To solve this problem, I added new columns to the `matches` table:

- `team_a`
- `team_b`
- `goals_a`
- `goals_b`

These columns allow match information to be stored once at the match level instead of being repeated in every player's performance record.

Through this challenge, I learned more about database normalization, how to organize data properly, and how database design affects application functionality.

I still want to improve my understanding of database relationships, constraints, and better ways to structure data in future projects.