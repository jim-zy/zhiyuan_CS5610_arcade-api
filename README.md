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

### Rules

Password length should be no less than 6, usename is case-sensitive.
Error format: `{ "error": "message"}`
