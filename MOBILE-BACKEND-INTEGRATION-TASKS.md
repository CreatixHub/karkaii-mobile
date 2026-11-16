# Karkaii Mobile — Backend Integration Task Sheet

Generated 2026-11-16. Source material: `karkaii-mobile/README.md`, repo-root `ROADMAP.md` ("Mobile app" section
and "Connecting the mobile app to the DigitalOcean Postgres database"), `DEVELOPMENT_LOG.md`'s 2026-11-05 mobile
entries, and the current `backend/src/modules/auth/` code.

## 1. Where things stand today

- **Mobile app**: Expo + Expo Router + TypeScript + NativeWind scaffold. Drawer menu, Dashboard and Reports
  screens are built with real UI components but **static sample data** (`src/data/dashboard.ts`,
  `src/data/reports.ts`). People & Admission, Academic, HRM, Finance & Accounts, Campus Operations, and
  Administration are "coming soon" placeholder screens so the menu is fully navigable.
- **No auth on mobile yet.** The home screen only proves network connectivity to the backend (a connection-status
  pill). No login screen, no token storage.
- **Backend**: same Express + Drizzle + PostgreSQL API the web app uses, already deployed-capable. Auth endpoints
  (`backend/src/modules/auth/auth.routes.ts`): `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`,
  `POST /auth/logout`, `GET /auth/me`, `POST /auth/switch-organization`. Access tokens are short-lived JWTs sent
  as `Authorization: Bearer <token>`. The refresh token is currently sent **only** as an httpOnly cookie
  (`backend/src/modules/auth/session.ts`) — correct and secure for a browser, but mobile has no cookie jar to
  rely on the same way.

## 2. Architecture (non-negotiable)

```
Mobile app  →  HTTPS  →  backend/ (Express + Drizzle)  →  PostgreSQL (DigitalOcean)
Web app     →  HTTPS  →  backend/ (Express + Drizzle)  →  PostgreSQL (DigitalOcean)
```

The mobile app is just another REST client, exactly like the React frontend — it must **never** connect to
Postgres directly. That would mean shipping database credentials inside a mobile binary (trivially extractable)
and bypassing every permission check the backend already enforces (tenant isolation, roles, soft-delete, audit
logging). Same backend, same database, same business rules for both clients.

## 3. Task list

### Backend changes (block mobile auth until done)

| ID | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| B1 | Detect mobile clients on auth requests (e.g. a `X-Client: mobile` header the app sends) | High | Not started | `backend/src/modules/auth/session.ts` / `auth.routes.ts` |
| B2 | For mobile clients, also return the refresh token in the JSON response body (not only the `rt` cookie) | High | Not started | Change lives in `sendSession()`, `session.ts` lines ~115-131 — currently deliberately excludes `refreshToken` from the JSON body |
| B3 | Accept the refresh token from the mobile client on `POST /auth/refresh` (body or header), not only `req.cookies?.rt` | High | Not started | `auth.routes.ts` line 37 currently reads `req.cookies?.rt` only |
| B4 | Confirm existing role/permission model needs no backend change for mobile's planned scope (parent/student/teacher) | Medium | Not started | Likely just verification — the permissions system (`src/permissions.ts`) is already role-based and tenant-scoped |
| B5 | Confirm the deployed backend is reachable over HTTPS from a phone network, not just `localhost`/same-Wi-Fi dev setup | Medium | Not started | Needed before any real device testing beyond Expo Go on the same LAN |

### Mobile app changes (mostly blocked by the backend tasks above)

| ID | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| M1 | Finalize mobile scope: which roles/screens does v1 actually need? | High | Decision needed | Suggested: parents + students (attendance, fees, grades, notices), maybe teachers (mark attendance, quick grade) — **not** a full port of the ~400-page admin dashboard |
| M2 | Build the login screen, porting the auth flow already working in `karkaii-frontend` | High | Not started | Blocked by B1–B3 |
| M3 | Store access + refresh tokens in `expo-secure-store` (Keychain/Keystore-backed) | High | Not started | Blocked by B2 |
| M4 | Wire the Dashboard screen to real backend data | Medium | Not started | Replace `src/data/dashboard.ts`; needs M2/M3 first |
| M5 | Wire the Reports screen to real backend data | Medium | Not started | Replace `src/data/reports.ts` |
| M6 | Build out the Finance & Accounts screen (fees) — core parent use case | Medium | Placeholder only | Depends on M1's scope decision |
| M7 | Build out the Academic screen (grades/attendance) — core parent/student use case | Medium | Placeholder only | Depends on M1 |
| M8 | Build out People & Admission, HRM, Campus Operations, Administration screens | Low | Placeholder only | Likely out of scope if M1 lands on parent/student/teacher-only |
| M9 | Sign-up screen | Low | Optional for v1 | Lower priority than sign-in |
| M10 | EAS Build/Submit setup for an installable `.apk`/`.aab` | Medium | Not started | `npx eas-cli@latest build`; not needed for Expo Go testing |

## 4. Suggested order

1. **M1** (scope decision) — unblocks prioritizing M6–M9 correctly.
2. **B1 → B2 → B3** (backend auth changes, small and well-scoped, not a redesign).
3. **M2 → M3** (mobile login + secure token storage).
4. **M4 → M5** (wire existing screens to real data — fastest visible win once auth works).
5. **M6 / M7** (build out the screens that actually matter for the chosen scope).
6. **M10** (EAS build) once there's something real worth installing outside Expo Go.
