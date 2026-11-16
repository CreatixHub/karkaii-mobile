# Karkaii Mobile

A starting point for the Karkaii mobile app — Expo + Expo Router + TypeScript + NativeWind (Tailwind CSS for React
Native). Not a port of the admin dashboard — see `ROADMAP.md` (repo root) for why this should stay scoped to a
smaller, mostly-read surface (attendance, fees, grades, notices) rather than mirroring the ~400-page web app.

## Run it and check it on your phone

1. Install the **Expo Go** app on your Android phone (Play Store).
2. Make sure your phone and this computer are on the **same Wi-Fi network**.
3. Set where the backend is reachable from your phone — **not `localhost`**, that means the phone itself:
   ```bash
   cp .env.example .env.local
   # edit .env.local — see the comments in it for which IP to use on this WSL2 setup
   ```
4. Start the backend too, if it isn't already running (from the repo root): `./demo.sh up`
5. From this folder:
   ```bash
   npm install
   npx expo start
   ```
6. Scan the QR code it prints with the **Expo Go** app (Android: use Expo Go's own scanner, not the camera app).

The Dashboard screen's welcome banner has a small connection-status pill — tap it to re-check; if it goes green,
your phone can reach the real Karkaii backend over the network, the same way the web app does.

## Why NativeWind, and how it's wired

NativeWind lets you write Tailwind utility classes (`className="flex-1 bg-white px-4"`) on React Native components —
same mental model as the web app's Tailwind-ish utility classes, compiled to native styles at build time (not a
runtime CSS engine). Config: `tailwind.config.js` (content paths, the `brand` color), `src/global.css` (the
`@tailwind` directives), `babel.config.js` + `metro.config.js` (wire NativeWind into the build). Add new screens'
file paths to `tailwind.config.js`'s `content` array if NativeWind ever stops picking up your classes.

## Project layout

Routing uses **Expo Router**: every file under `src/app/` is a screen, `_layout.tsx` files define navigators. The
root layout is a **Drawer** (`expo-router/drawer`, bundled in SDK 58 — no extra package needed), matching
`karkaii-frontend`'s sidebar menu one level deep: Dashboard, People & Admission, Academic, HRM, Finance & Accounts,
Campus Operations, Reports, Administration. Everything else (components, data, config) goes under `src/` but
**outside** `src/app/`.

```
src/
  app/
    _layout.tsx        — root layout: the Drawer navigator + custom DrawerContent
    index.tsx          — Dashboard (stat cards, enrollment trend, attendance breakdown, activity)
    reports.tsx         — Reports (the 8 report types from the web sidebar's "Reports & Analytics")
    people.tsx, academic.tsx, hrm.tsx, finance.tsx, campus.tsx, administration.tsx
                        — placeholder screens ("not built yet") so the menu is fully navigable
  components/
    DrawerContent.tsx, StatCard.tsx, SectionCard.tsx, EnrollmentTrendChart.tsx,
    AttendanceBreakdown.tsx, ActivityTimeline.tsx, PlaceholderScreen.tsx
  data/
    menu.ts, dashboard.ts, reports.ts — static/sample data; swap for real API calls later
  config/
    env.ts        — EXPO_PUBLIC_API_URL, read the same way the web app reads VITE_* vars
  global.css       — the three @tailwind directives NativeWind needs
```

Only Dashboard and Reports have real content right now — the other menu items are intentionally placeholders
(see `ROADMAP.md`'s mobile section for what's built vs. pending).

## Commands

```bash
npx expo start        # dev server — scan the QR with Expo Go
npx tsc --noEmit       # typecheck
npx eslint .           # lint
npx expo-doctor        # diagnose dependency/config issues
npx expo install <pkg> # add a package — ALWAYS use this instead of npm install, it resolves SDK-compatible versions
```

## Not done yet — this is a starting point, not a finished app

- **No auth.** The home screen only proves network connectivity to the backend; there's no login screen, no token
  storage, nothing from `karkaii-frontend`'s auth work ported over yet.
- **The backend's refresh-token flow needs a mobile-specific change first** — right now the refresh token is sent
  only as an httpOnly cookie, which doesn't work the same way on mobile. See "Connecting the mobile app to the
  DigitalOcean Postgres database" in `ROADMAP.md` (repo root) for the specific backend change needed
  (`backend/src/modules/auth/session.ts`) before building a real login screen here.
- **No EAS setup yet** (needed for an installable `.apk`/`.aab`, not just Expo Go). `npx eas-cli@latest build` once
  you're ready — see https://docs.expo.dev/eas/index.md.
- **Scope decision still needed:** which screens does this app actually need? (see the suggestion in `ROADMAP.md`)
# karkaii-mobile
