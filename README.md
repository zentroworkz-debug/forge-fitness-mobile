# FORGE FITNESS — mobile app (Expo / React Native)

Native Android + iOS app that talks to the **same Supabase project** as the website (same accounts, roles, RLS, Edge Functions). The website is untouched.

## Get the APK (3 steps, about 15 minutes, free Expo account)

```bash
npm install
npx expo install --fix          # aligns every package to the Expo SDK (package.json uses "*" on purpose)
npx tsc --noEmit                # fix any type error it reports before building
npm i -g eas-cli && eas login && eas init
eas build -p android --profile preview    # prints a download link to the .apk
```

`preview` produces an installable `.apk`; `production` produces a Play Store `.aab`.
Local build instead of EAS: `npx expo prebuild -p android && cd android && ./gradlew assembleRelease` (needs JDK 17 + Android SDK).
iOS: `eas build -p ios --profile production` (needs an Apple Developer account, $99/yr; EAS handles signing).

## Update 2 (this revision)

- **Menu redirect bug fixed.** Four route groups had the same URLs (`/home`, `/more`, `/notifications`), so links fell back to Home. Areas now have unique paths: `/guest/*` (public), `/member/*`, `/coach/*`, `/manage/*`.
- **Scanner** now follows the website's scanner: full-screen camera, dimmed surround with corner-bracket viewfinder and moving scan line, hint text, round torch / switch-camera / choose-photo buttons, zoom bar, and the same Starting / Checking / Success / Could-not-scan screens.
- **Top-right icons** (separate round buttons) on every portal screen: scanner (members) and notifications with an unread badge (all roles).
- **Login** centred; show/hide eye on login and on both password fields in Apply to join. Forgot-password has no password field (it only asks for email; the new password is set on the website reset page).
- **Home page** redesigned (hero, stats band, quick links, programs and coaches carousels, trial CTA). Member home got quick-action buttons.
- **Attendance** redesigned: status card, visits/time this month, 14-day strip, history cards with a date badge, green IN pill, outlined OUT pill, duration, and colour-coded edge (green done / amber inside / red missed).
- **Diet and Workout** now have a date strip (past, today, upcoming) and an **Add food / Add workout** sheet that saves to the database. Trainer-assigned plan items still show for the chosen date.

### One required step: run the new migration

`supabase/migrations/0006_client_self_logging.sql` creates `client_food_entries` and `client_workout_entries` (RLS: a member sees only their own rows; their trainer and admins can read them). Run it in the Supabase SQL editor **before** using Add food / Add workout, otherwise those saves will fail with "relation does not exist". It is additive and does not touch the website. It has not been executed anywhere yet (no Postgres in my sandbox), so run it once on a staging copy or read it through first.

Rules enforced by the database, not the app: dates within one year; future entries can only be "planned"; a food picked from the food database has its nutrition computed server-side (per-100 g value x grams / 100); typed-in foods are stored as "entered by you", never as verified.

## What is in the app

| Area | Status |
|---|---|
| Public: Home, About, Programs (+detail), Facilities (viewer), Trainers (+detail), Plans (monthly/quarterly/annual toggle), Schedule (day filter), Gallery (viewer + prev/next), Testimonials, Calculator, FAQ, Contact, Free trial | Built. Content and images extracted from the ZIP's `index.html`; calculator uses the same formulas and limits |
| Contact / trial forms | Insert into `contact_enquiries` (same as the website). Success is shown only if the insert succeeds |
| Auth: login, apply (client/trainer), 6-digit email verification, forgot password, pending/rejected screen, session in SecureStore | Built. New accounts stay pending until an admin approves; role comes only from `user_roles` |
| Client: home, workout (log sets/reps/kg), diet (mark eaten, totals from the DB nutrition view), QR check-in/out, trackers (water, steps, weight, sleep + 7-day charts), membership/payments, trainer browse/request/cancel, notifications | Built |
| Trainer: home, assigned clients, accept/decline requests, check-in/check-out QR display | Built |
| Admin: overview + trainer activity, approve/reject (with reason), people list/search, enquiries | Built |

## NOT built yet (be aware before you ship)

- Trainer: workout builder, nutrition planner, handover submit/acknowledge, calendar, client reports. Use the website portal.
- Admin: CRUD for plans, memberships, exercises, foods, assignments, QR invalidation, CSV/PDF exports, settings, audit log. Use the website portal.
- Client: exercise images/videos, planned-vs-consumed charts beyond the totals bar, calendar view, report downloads, trainer-transfer request, profile editing.
- Push notifications (needs a `user_devices` table + Firebase `google-services.json` + a sender in `notify-dispatch`), WhatsApp/email already run server-side from the website's Edge Functions.
- Online payments (the website has none either). Health Connect / Apple Health step sync.
- Password reset uses the website's reset page (link opens in the browser); the new password then works in the app.

## Verification status (honest)

Done in the sandbox: all 75 TS/TSX files parse (Babel parser); every `@/` and relative import resolves; every navigation target maps to a route file; 14 unit tests pass (`npm test`: calculator, validators, attendance durations/status, nutrition scaling, date helpers).
**Not done** (the scanner overlay, bottom sheets and date strip have never been seen on a screen; sandbox had no internet / Android SDK / Supabase): `npm install`, `tsc` type-check, Metro bundle, running on a device or emulator, any call against the real database, RLS tests, QR camera test, APK/AAB/iOS build. Column names in queries were read from the website's migrations; the first run may still reveal a mismatch. Treat first launch as a bring-up session: log in with each role and open every tab.

## Supabase checklist

- Auth > Email: *Confirm email* on, and the confirm template includes `{{ .Token }}` (the app uses the code, not a deep link).
- Edge Functions `qr-token`, `scan-attendance` deployed with `QR_SIGNING_SECRET` set (the app falls back to the `issue_qr_token` / `client_scan_attendance` RPCs if they are unreachable).
- Only the public URL + anon/publishable key are in the app (`.env`, `eas.json`). Never add the service-role key or `DATABASE_URL`.

## Security notes about the uploaded ZIP (please act on these)

1. `forge-fitness/.env` contains your **Postgres password in `DATABASE_URL`**, and the ZIP also contains a `.git` folder. Rotate the database password now (Supabase > Settings > Database) and never share that file again. I did not copy it into the app.
2. `src/lib/qrAttendance.js` falls back to a **hard-coded default QR signing secret** when none is configured, and signs tokens in the browser. Anyone who reads the website bundle can forge that fallback. The mobile app does not use it (it only sends scanned codes to the server). Remove that fallback on the website and rely on the Edge Function.
3. Demo prices, address, phone and reviews are placeholders on the website; the app shows them labelled as such.

## Layout

```
app/guest member coach manage + (auth)   unique route areas, role-gated in components/PortalTabs.tsx
app/program/[slug].tsx  app/trainer/[slug].tsx   detail screens
components/  ui.tsx (design system) QrScanner DateStrip Sheet HeaderActions BarChart PortalTabs PortalMore
lib/         supabase.ts (SecureStore session)  content.ts (website data)  calc.ts  attendance.ts  enquiry.ts
theme/       colours #111210 #1a1b18 #2c2e29 #f4efe6 #a9a499 #c6ff3d, Montserrat + Barlow
assets/      icon.png adaptive-icon.png splash-icon.png (from your uploaded icon), images/site/* (from the website)
```
