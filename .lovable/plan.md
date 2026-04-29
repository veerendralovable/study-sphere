## Current state (already built)

A large portion of the master breakdown is already implemented in your project:

- Auth (signup, login, logout, .edu validation, session, profile auto-creation via trigger)
- Routing root + `/auth` + `/room/:id` + `*` 404 + `ProtectedRoute` guard
- Dashboard (stats, your/joined/discover rooms, search, create modal, join-by-code)
- Rooms (create, join public, join private via SECURITY DEFINER RPC, leave, member list)
- Realtime members + shared timer with sync math
- Study sessions (auto start on join, auto end on leave/unmount)
- Stats (today, total, streak, session count, badges)
- Moderation (creator removes member, "removed" status enforced server-side)
- RLS hardening for `rooms`, `room_members`, `profiles`, helper functions, removed-member block
- Toasts, ErrorBoundary, try/catch on services, validation via zod

So the plan focuses only on what is genuinely missing or weak — including the live security findings on screen.

---

## What this plan will deliver

### 1. Fix the open security findings (priority)

Database migration:

- **Tighten `timers` SELECT policy** — replace `USING (true)` with `USING (is_room_member(auth.uid(), room_id))` so timer activity for private rooms no longer leaks to all authenticated users.
- **Hide `room_code` from non-members** — drop the broad `rooms` SELECT policy and replace with two policies (or a view) so that:
  - Public rooms: visible to all authenticated users, but `room_code` returned as `NULL` for non-members.
  - Implementation: create a SQL view `public.rooms_public` exposing all columns except `room_code`, used by Dashboard listing; keep direct `rooms` SELECT restricted to members + creator only. Update `roomService.listAll` / `search` / `findByCode` to use the view; `getById` keeps using the table (members only).
- **Lock down SECURITY DEFINER functions** — `REVOKE EXECUTE ... FROM PUBLIC, anon` on `join_private_room`, `join_room_by_code`, `shares_active_room`, `is_room_member`, `is_room_creator`, `generate_room_code`, `handle_new_user`; `GRANT EXECUTE` only to `authenticated` for the two join RPCs. Resolves both Supabase linter warnings.
- **Leaked-password protection** — cannot be toggled via migration; surface a one-line note pointing to the Auth → Policies dashboard toggle (manual user step).

After the migration, mark the four addressable findings as fixed and update `mem://security` accordingly.

### 2. Routing polish

- Add explicit `/login`, `/signup`, `/dashboard` routes (currently consolidated under `/auth` and `/`). Keep `/auth` as redirect to `/login` for back-compat.
- `/404` already covered by `*` route — keep.
- **Return URL handling**: when `ProtectedRoute` redirects to `/login`, attach `?returnTo=<path>`; on successful login, navigate to `returnTo` if present and same-origin.
- **MemberGuard**: extract Room's gating logic into a reusable guard component so `/room/:id` cleanly separates "load + check membership" from page rendering.

### 3. Password reset (currently missing)

- "Forgot password?" link on `/login`.
- New `/forgot-password` page → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
- New public `/reset-password` page → reads recovery token from URL hash, calls `supabase.auth.updateUser({ password })`.

### 4. Exam Mode (item 9 in your breakdown — not yet built)

Migration: add `rooms.exam_mode boolean not null default false`.

UI/logic in `Room.tsx`:
- Creator-only toggle in the room header.
- Realtime subscription on the `rooms` row → all members see the change instantly.
- When `exam_mode = true`: full-width banner; non-creators cannot start/stop the timer or leave (Leave disabled with tooltip "Exam in progress"); creator retains all controls.

Service: `roomService.setExamMode(roomId, value)` (RLS already restricts UPDATE to creator).

### 5. Small UX gaps

- Empty stats default to `0` instead of `—` when `stats` is loaded (you already have this for loaded; only show `—` while loading).
- "Room not found" already handled; add explicit toast + redirect for "you were removed" already present — verify and standardize copy.
- Session expiry: `onAuthStateChange` already handles SIGNED_OUT; add a global toast "Session expired — please sign in again" when a previously-authenticated user's session disappears.

---

## Out of scope (and why)

- **Realtime Authorization for channels**: requires Supabase dashboard config (cannot be done from migrations).
- **Leaked-password protection toggle**: dashboard-only.
- Most items in your master list (auth, dashboard, room, realtime, sessions, stats, moderation, error handling) — already implemented; re-implementing would be churn.

---

## Technical change list

Files to create:
- `supabase/migrations/<ts>_security_and_exam_mode.sql`
- `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`
- `src/components/MemberGuard.tsx`

Files to edit:
- `src/App.tsx` — new routes, redirect `/auth` → `/login`
- `src/components/ProtectedRoute.tsx` — append `?returnTo`
- `src/pages/Auth.tsx` — split into Login/Signup; honor `returnTo`
- `src/pages/Room.tsx` — exam mode UI + guard usage
- `src/services/roomService.ts` — use `rooms_public` view for listings; add `setExamMode`
- `src/context/AuthContext.tsx` — session-expired toast
- `mem://index.md` + `mem://security/*` — refresh

Then: call `security--manage_security_finding` to mark the four addressable findings fixed and `security--update_memory` to record the new posture.

---

## Suggested order of execution

1. Security migration + linter cleanup (highest value).
2. Routing split + return URL + password reset (auth completeness).
3. Exam Mode (new feature).
4. UX polish + memory updates.

This is a lot — happy to ship it in phases. Approve and I'll start with phase 1 (security), or tell me to combine/reorder.