# MF Rides

Fresh, from-scratch project for:
- MF Rider — customer mobile app
- MF Partner — driver/partner mobile app (foundation only, unchanged since Phase 1)
- MF Backend — API server
- MF Admin — admin panel (planned, not started)

## Stack
- Mobile: Expo React Native + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM

## Status

**Phase 1 — Foundation:** Done. All four sub-projects install and start cleanly.

**Phase 2 — MF Rider Authentication & Database:** Code complete.
- `mf-backend`: Prisma `User` model (RIDER / PARTNER / ADMIN roles), JWT auth,
  bcrypt password hashing, zod request validation, `POST /api/auth/register`,
  `POST /api/auth/login`, `GET /api/auth/me`.
- `mf-rider`: Welcome, Register, Login, and Home screens, wired to the backend
  via a small API client and an AuthContext that persists the JWT with
  AsyncStorage.
- `mf-partner` / `mf-admin`: intentionally untouched.

**Phase 3 — Ride Request System:** Backend code complete (no Rider/Partner UI yet).
- `mf-backend`: `Ride` model + `RideStatus` enum
  (`REQUESTED → ACCEPTED → STARTED → COMPLETED`, or `→ CANCELLED` any time
  before `STARTED`), `isOnline` flag added to `User`.
- New endpoints: `POST /api/rides`, `GET /api/rides/available`, `GET /api/rides/mine`,
  `GET /api/rides/:id`, `POST /api/rides/:id/accept`, `POST /api/rides/:id/start`,
  `POST /api/rides/:id/complete`, `POST /api/rides/:id/cancel`,
  `PATCH /api/users/me/online-status`.
- Existing auth code (register/login/me/JWT) untouched.

## Local setup required before first run

The backend needs a real PostgreSQL database plus a generated Prisma client.
A version-controlled initial Prisma migration is included in `mf-backend/prisma/migrations/`.
The generated client is intentionally not included because it is machine-generated.

```powershell
cd mf-backend
npm install
# create a .env file based on .env.example, then:
npx prisma generate
npx prisma migrate deploy
npm run dev
```

For local development, `npx prisma migrate dev` may also be used after the database is configured.

`mf-rider` and `mf-partner` just need `npm install` then `npm start`.
For the Rider app, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` for your environment.

## Verification / testing

There is currently no automated test suite in the repository. Use `GET /api/health` as the backend smoke check, then exercise auth and ride endpoints with Postman or another API client after PostgreSQL is configured.
For static checks, run `npx tsc --noEmit` in each TypeScript project.

## Not built yet (by design)
Ride booking/matching UI in the Rider or Partner apps, maps, payments, offers,
bus tickets, recharge, and all other Partner-app features. These come in
later phases.
