# PJMatch

## Structure

- `client/` — frontend (React + TypeScript + Vite)
- `server/` — backend (Go + Gin), database setup and seed data

## Running locally

Backend (starts the database and the Go server):

```bash
make run
```

Frontend:

```bash
make client
```

The same commands are also available inside `server/` and `client/`
if you prefer to work from those directories directly.
