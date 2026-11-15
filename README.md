# cs5610-arcade-api

Hono api for cs5610 arcade project

## Setup

copy .env.example to .env, set env variables

```bash
npm install
npm run dev
```

## Auth

Server creates the sessionId when user logins and adds it in JSON response.
Web server takes the sessionId and stores in cookie.
Requests afterwards have `Authorization: Bearer <sessionId>`.
Session lasts 7 days, logout deletes the session


### Endpoints

A `user` object is `{ "id": string, "email": string, "username": string }`.

| Method | Path | Auth | Request body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/health` | — | — | `200 { "ok": true }` | — |
| POST | `/api/auth/signup` | — | `{ "email", "username", "password" }` | `201 { "user" }` | `400` invalid JSON, wrong types, missing fields, bad email/username format, password < 6 · `409` duplicate email or username |
| POST | `/api/auth/login` | — | `{ "email", "password" }` | `200 { "sessionId", "user" }` | `400` invalid JSON, wrong types, missing fields · `401` invalid credentials |
| POST | `/api/auth/logout` | Bearer | — | `200 { "message": "Logged out successfully" }` | `401` not logged in / session invalid or expired |
| GET | `/api/auth/me` | Bearer | — | `200 { "user" }` | `401` not logged in / session invalid or expired |
| POST | `/api/games` | Bearer | — | `201 { "id" }` + `Location: /api/games/:id` | `401` not logged in |
| GET | `/api/games` | Bearer | — | `200 { "waiting": [summary], "mine": [summary] }` | `401` not logged in |
| GET | `/api/games/:id` | Optional | — | `200 view` | `400` invalid id · `401` game not finished and not logged in · `403` game not finished and not a player · `404` game not found |
| POST | `/api/games/:id/players` | Bearer | — | `200 { "id" }` | `400` invalid id · `401` not logged in · `404` game not found · `409` game not waiting, own game, or seat already taken |
| POST | `/api/games/:id/shots` | Bearer | `{ "x", "y" }` (integers 0–9) | `201 { "hit", "sunk", "gameOver" }` | `400` invalid id, invalid JSON, bad coordinates · `401` not logged in · `403` not a player · `404` game not found · `409` game not active, not your turn, cell already fired at, or turn changed during the request |

A `summary` is `{ "id", "status", "players": [username, username | null], "createdAt" }`. `status` is `waiting`, `active` or `finished`.

A `view` is `{ "id", "status", "players": [{ "username", "isYou", "board" }], "turn", "winner", "createdAt" }`:
- `board` is `{ "ships", "shots" }`. The opponent's ships are hidden until sunk; shots are always shown.
- `turn` is `true` when it is the viewer's turn. `winner` is a username or `null`.
- Finished games can be viewed by anyone, with both boards in full and no `isYou`/`turn`.

`sunk` is the name of the ship sunk by this shot, or `null`.

### Rules

Password length should be no less than 6, username is case-sensitive.
Error format: `{ "error": "message"}`

The game creator fires first. Joining and firing re-check their conditions in the database update itself, so two requests at the same moment can't both succeed; the second one gets `409`.
A logged-in user who is not a player gets `403` (not `404`) on an unfinished game: waiting games are listed in the lobby, so a game's existence isn't secret.
