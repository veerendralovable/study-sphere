
# StudySphere — Full Gap Remediation Plan

This plan removes every mock/placeholder, fixes every broken or fake-functional UI element, fills DB gaps, and makes the right screens real-time. Grouped into clusters so each phase ships standalone without breaking the others.

---

## Cluster 0 — Audit findings (the "what is broken")

Concrete defects found in code right now:

**A. Admin panel — fake/broken bits**
1. `AdminUsers` role dropdown shows `Student/Admin` but DB enum is `admin/moderator/user` — every save throws under the hood (filter mismatch hides it).
2. `AdminUsers` deactivate hits `profiles.status='blocked'`, but no RLS allows non-admin self-block, no UI to reactivate, no audit log written.
3. `AdminUsers` row actions: only deactivate. Missing: reactivate, force sign-out, view sessions, ban with reason, edit name/email.
4. `AdminRooms` "Eye" button navigates to `/admin/rooms/:id` — that route does not exist (NotFound). Broken button.
5. `AdminRooms` missing: force-end timer, kick all members, lock/unlock, transfer creator, view members, exam-mode override.
6. `AdminLive` `active_rooms` mapping uses `room.room_id === "all"` placeholder string ("Multiple rooms") — dead branch. Polls every 5s instead of using realtime; duplicates rooms when multiple users have timers (no dedupe).
7. `AdminAnalytics` `peak_usage_time` is the literal string `"N/A"` from V1 service. Retention metric is "users with sessions in last 7 days", not real cohort retention. Inactive users uses `profiles.updated_at` which is not in the schema → query silently returns wrong data.
8. `advancedAnalyticsService.getMostActiveRooms` returns rooms ordered by `created_at`, not member count — misleading title.
9. `AdminReports` shows reporter/target as 8-char UUID stub; no resolve link to the actual user/room; no name resolution.
10. `AdminLogs` table renders only known action colors; many real actions (room_deleted, exam_mode_toggle, user_deactivated, member_removed) are never written to `audit_logs` at all → log page is permanently empty in practice.
11. `AdminSettings` reads/writes `system_settings`, but **the table is never seeded** — page loads empty, save does nothing. `getMaxRoomSize`, `isMaintenanceMode`, etc. are never enforced anywhere in the app.
12. No admin Room-Detail page (V2 promised), no impersonation, no announcements.

**B. End-user app — broken bits**
13. `AppHeader.logout()` navigates to `/auth` (legacy). Should be `/login`.
14. `Dashboard.statsService.getForUser` includes only sessions with `duration > 0`; the **current in-progress session** (no end_time) never counts toward "Today" — counter only updates after the user leaves the room. Should include live partial duration.
15. `Dashboard` "—" placeholder remains because `stats` is null on first paint; once loaded, zero values show as `0`. Inconsistent.
16. `DailyGoal` goal is hardcoded to 2 hours — no UI to change it, no per-user persistence. Promised feature.
17. `Room.tsx` Removed-from-room toast then `navigate("/")` works, but `roomMemberService.myMembership` is called even for non-members of private rooms, which then auto-joins public rooms silently — no consent UX.
18. `Room.tsx` study-session `start` runs on every mount; if the user reloads while timer is active, **a new session row is created and the previous one is left dangling** (no end_time forever). Stats become wrong.
19. `Room.tsx` session end on unmount uses `sessionRef` cleanup that fires before `await` resolves on fast navigate → orphan rows.
20. `Room.tsx` no "Report user/room" button despite Reports table existing.
21. `Room.tsx` no in-room chat/notes/whiteboard — common feature in study rooms; if not in scope mark explicitly out-of-scope (we will).
22. Members list never updates timer/online presence; "Active members" is just `status='active'` in DB, not actual online presence (a user who closed the tab still shows as active).
23. `RoomCard` `timerActive` only reflects timer row, not whether anyone is actually present.
24. Forgot/Reset password pages exist but `/reset-password` has no token check on mount → if user lands there directly they can blank-submit.
25. `Signup` does not block on email verification flow — user is told "check email" then app shows logged-out state, but `redirectTo` is `/`, which redirects to `/login`, losing context. (Need explicit "verification sent" page.)
26. `Index.tsx` redirects `/` → `/login` for logged-out, which is correct, but the public landing page (marketing) is gone — there is no real `/` for visitors.
27. `ProfileDialog` only edits `name`; cannot upload avatar, change password, delete account.
28. No `study_session_goals` per-user table; daily goal lives only as a constant.
29. No notifications system (toasts only). E.g. when a creator starts a timer, joiners get nothing visual besides the synced clock.
30. No room search by tag/subject/category — schema lacks these columns.
31. `roomMemberService.join` upserts even for `removed` rows — RLS blocks correctly, but UX swallows error. Should detect and route to "you were removed".
32. No way to leave a private room cleanly while exam-mode is on (intended); but no way for creator to disable exam mode if they themselves disconnect — orphan locked room.
33. `study_sessions` keeps `room_id` even after the room is deleted → "Most active rooms" stat is broken; need ON DELETE behavior.
34. `audit_logs.target_id` not FK; admin pages can't dereference it because there's no service to resolve names.
35. Multiple legacy `*.md` / `*.txt` status files at repo root mixing truth — risk: AI agents confuse old plans for current state. (Not user-visible but causes regressions.)

**C. Database gaps**
36. No `daily_goals` (per-user goal seconds) table.
37. No `tags`/`subjects`/`categories` columns on `rooms`.
38. No `presence` mechanism (Realtime presence, not row state).
39. `study_sessions.end_time` not auto-closed when row stale → need cron or trigger.
40. `system_settings` rows never seeded.
41. No trigger to insert `audit_logs` rows for: `room_deleted`, `member_removed`, `user_deactivated`, `role_changed`, `exam_mode_toggled`.
42. No `notifications` table for in-app announcements/admin pushes.
43. No `room_messages` or `room_notes` table (chat is missing — see decision in Cluster 6).
44. `profiles.email` is mutable on insert path; no NOT NULL; profile email can drift from auth email.
45. No `last_active_at` column on `profiles` → analytics for "inactive users" relies on a non-existent `updated_at`.

**D. Security findings still open** (from current scanner)
46. Realtime topic policy missing.
47. `profiles.email` writable column-level (need column trigger/constraint).
48. `room_members` removed-member reinstate: tighten with explicit policies.

---

## Cluster 1 — Database migration: missing tables, columns, triggers, seeds

One migration `xxxx_full_remediation.sql` containing:

**1.1 Schema additions**
- `profiles.last_active_at timestamptz` (default `now()`); update via trigger on `study_sessions` insert + `auth.users` sign-in (function called from edge).
- `rooms.subject text`, `rooms.tags text[] default '{}'`, `rooms.locked boolean default false` (admin lock).
- `rooms.deleted_at timestamptz` (soft delete) so analytics survive.
- `study_sessions.room_id` change `ON DELETE` → keep but add denormalized `room_name_snapshot text`.
- New table `daily_goals (user_id uuid pk, goal_seconds int not null default 7200, updated_at timestamptz)`.
- New table `notifications (id uuid pk, user_id uuid not null, kind text, title text, body text, read boolean default false, created_at timestamptz default now())`.
- New table `announcements (id, title, body, created_by, audience text check in ('all','admins'), created_at, expires_at)`.
- New table `room_messages (id, room_id, user_id, body text, created_at)` for in-room chat (Cluster 6 enables UI).
- New table `presence_pings (room_id, user_id, last_seen_at)` — minimal heartbeat fallback (we will primarily use Realtime presence channel, but DB row helps reconciliation).

**1.2 Triggers**
- `prevent_profile_email_change` already exists — keep, but also add `NOT NULL` + add column-level CHECK on insert to enforce `.edu`.
- New `audit_log_room_delete` AFTER DELETE on `rooms` → insert into `audit_logs`.
- New `audit_log_member_status_change` AFTER UPDATE on `room_members` when status moves to `removed` or `active` post-removal.
- New `audit_log_role_change` AFTER INSERT/DELETE on `user_roles`.
- New `audit_log_exam_mode` AFTER UPDATE on `rooms` when `exam_mode` changes.
- `auto_close_stale_sessions()` SQL function; called from a `pg_cron` job (or manually via edge fn `cron-housekeeping`) every 5 min: any `study_sessions` with no end_time and `start_time < now() - interval '6 hours'` gets auto-closed.

**1.3 RLS additions / fixes**
- `daily_goals`: user can read/write own; admins read all.
- `notifications`: user reads/updates own; admins insert.
- `announcements`: all authenticated read where `now() < expires_at OR expires_at is null`; admins write.
- `room_messages`: room members select/insert; creators+admins delete.
- Tighten `profiles` UPDATE policy: replace single policy with two — `name only` for self, `status/role` for admins. Use a trigger guard to revert disallowed column writes.
- `room_members` UPDATE: split into two explicit policies — "self leave" `WITH CHECK (status='left' AND auth.uid()=user_id)` and "creator moderate" `WITH CHECK (is_room_creator(...))`. Removes the OR-OR ambiguity flagged by scanner.

**1.4 Seeds**
Insert `system_settings` rows: `max_room_size=50`, `max_rooms_per_user=10`, `allowed_domains=["edu"]`, `maintenance_mode=false`, `timer_min_duration=60`, `timer_max_duration=14400`, `default_daily_goal_seconds=7200`, `feature_chat=true`, `feature_announcements=true`.

**1.5 Realtime authorization (manual + SQL where allowed)**
- Enable publication on `room_messages`, `notifications`, `announcements`, `daily_goals`.
- Add `realtime.messages` policy gated on `is_room_member(auth.uid(), <topic_room_id>)`. (User must toggle "Realtime Authorization" in dashboard once.)

---

## Cluster 2 — Core services: remove mocks, add what's missing

**2.1 `adminService` rewrite**
- `getAnalytics`: replace `peak_usage_time:"N/A"` with computed peak hour from `study_sessions`.
- `getLiveData`: dedupe by room_id, hydrate creator names, include member count, derive truly-active sessions (within last 60s by `presence_pings`).
- `getUserDetails.current_streak`: actually compute from sessions (reuse `statsService` logic server-side via SQL function `user_streak(uid)`).
- Add `reactivateUser`, `forceSignOut(userId)` (calls edge fn that uses service role to sign out), `getUserSessions(userId)`.
- All mutating methods write `audit_logs` via the new triggers (no client-side log writes).

**2.2 `adminV2Service` fixes**
- `getMostActiveRooms` → SQL view ordering by `count(distinct member)` over last 7 days.
- `getInactiveUsers` → use new `last_active_at`.
- Add `getRoomDetailsForAdmin(roomId)`: room + members + active timer + recent reports + audit trail.
- Add `announcementsService` (CRUD).
- Add `notificationsService` (list/markRead/markAllRead).

**2.3 New `roomChatService`** + `presenceService` (heartbeat every 20s; subscribes to a Supabase Realtime presence channel keyed `room:<id>`).

**2.4 `dailyGoalService`** — get/update per user with optimistic UI.

**2.5 `reportService`** for users (Room.tsx will expose a Report button).

**2.6 `statsService` fix** — include in-progress session partial duration (now − start_time) into `todaySeconds` and `totalSeconds`. Re-tick every 30s.

---

## Cluster 3 — Admin panel completion (every promised page real)

- `/admin/users`: fix role enum (`admin/moderator/user`), add Reactivate/Force-Sign-Out/View Sessions, and a side-drawer with full user details using `getUserDetails`. Add server-side search via `ilike` on name/email + role filter.
- `/admin/rooms`: add `/admin/rooms/:id` detail page (members, timers, reports, audit). Add Force-end timer, Lock room (`rooms.locked`), Unlock, Soft-delete, Toggle exam mode, Kick all.
- `/admin/live`: replace 5s poll with Realtime subscription to `timers` and `presence_pings`. Show per-room concurrency chart.
- `/admin/analytics`: real retention (cohort: users active in week N who returned in week N+1), real peak hour, real most-active rooms, top users leaderboard (opt-in flag).
- `/admin/reports`: resolve reporter_id → name, target_id → name/room. Add "Take action" menu (warn user, deactivate user, delete room).
- `/admin/logs`: server-side filter by action/actor/date; show actor name; verify rows actually appear (after Cluster 1 triggers).
- `/admin/settings`: working CRUD against seeded rows; enforce values app-wide:
  - `maintenance_mode=true` ⇒ all non-admin routes show maintenance screen.
  - `max_rooms_per_user` enforced in `roomService.create` via RPC count check.
  - `timer_min/max_duration` enforced in `timerService.start`.
  - `allowed_domains` replaces hardcoded `.edu` regex in `validation.ts`.
- New `/admin/announcements`: create/edit/expire announcements; broadcast over Realtime; rendered as a top banner for users.
- Add admin "Impersonate" via edge fn that issues a short-lived magic link (audit-logged).

---

## Cluster 4 — User app polish & real functionality

- `AppHeader.logout` → navigate `/login`.
- Dashboard:
  - Show `0` everywhere immediately if `stats` is loading (skeleton instead of "—").
  - Editable Daily Goal (click → dialog → saves to `daily_goals`).
  - Live "Today" counter ticks while a session is active.
  - Add subject/tag filter chips; search by tag in `discover`.
  - Announcements banner (from `announcements` table, dismissible per user via `notifications.read`).
- Room page:
  - Idempotent session start: if there is an open session for this user + room, reuse it instead of creating a new one (use `select … is null end_time`).
  - Persistent `beforeunload` to close session.
  - Presence channel: `members` list shows online dot if user is heartbeating.
  - Report user/room button (creates `reports` row).
  - Chat panel (collapsible) using `room_messages`.
  - Exam-mode auto-disable safety: if creator is offline >10min during exam mode, an admin can override (button on `/admin/rooms/:id`).
  - "Locked" rooms (`rooms.locked=true`) refuse new joins and surface a banner.
- Profile dialog:
  - Avatar upload (Supabase Storage bucket `avatars`, public read, owner write — new bucket created in migration).
  - Change password (current+new).
  - Delete account (edge fn calls `auth.admin.deleteUser` and cascades `profiles`).
- Public landing page at `/` (marketing) for logged-out users (current `Index.tsx` only redirects). Logged-in users still go to dashboard.
- `/reset-password` guards against missing recovery token.
- `/signup` shows explicit "Check your email to verify" success state.
- Notifications bell in `AppHeader` opens dropdown of `notifications` rows.

---

## Cluster 5 — Realtime everything

Subscribe via Supabase Realtime to:
1. `room_members` (already done, keep).
2. `timers` (already done, keep).
3. `rooms` row (already done — exam_mode toggle).
4. `room_messages` (new) — chat.
5. `announcements` (new) — global banner.
6. `notifications` (new) — bell.
7. Presence channel per room — online users.
8. Admin Live page subscribes to `timers` and `presence_pings` (replaces 5s poll).

Add channel-topic RLS via `realtime.messages` policy keyed on `is_room_member`.

---

## Cluster 6 — Decisions you need to make before we build

I'll ask one question after this plan is approved (so we don't add work the wrong way):

a) Include in-room **chat** (`room_messages`)? (Adds DB table, UI panel, moderation rules.)
b) Include public **landing page** at `/` or keep redirecting to login?
c) Include **avatar uploads** + Storage bucket?
d) Include **announcements** system?

If you say "everything", I'll build all four.

---

## Cluster 7 — Cleanup

- Delete the 25+ outdated `*.md` / `*.txt` status docs at repo root; replace with one `README.md` + `CHANGELOG.md`.
- Remove `scripts/setup-db.js` (obsolete after migration).
- Re-run security scan; mark fixed findings; update `mem://security/posture.md`.
- Add `src/test/` coverage for: `statsService` partial-session math, `roomService.setExamMode`, `dailyGoalService`, role-change service.

---

## Suggested execution order

1. Cluster 1 (DB migration + seeds + triggers + RLS split). **Highest leverage.**
2. Cluster 2 (services rewrite).
3. Cluster 3 (admin panel — all pages real).
4. Cluster 4 (user-facing polish + presence + chat).
5. Cluster 5 (realtime wiring across all surfaces).
6. Cluster 7 (cleanup + tests + security memory).

Estimated size: ~1 large migration, ~9 service files touched/added, ~12 page files touched/added, ~4 new components, ~2 edge functions (`force-sign-out`, `delete-account`, `cron-housekeeping`).

---

## Out of scope (explicit)

- Whiteboard / video / voice chat.
- Mobile app.
- Payments / subscriptions.
- Calendar integration.
- Email digests (would need separate cron + email provider; can be added later).

---

## Risk controls

- Each cluster is independently shippable; if a cluster fails QA we revert just that migration block.
- All admin mutations route through `audit_logs` via DB triggers — no client-trust.
- Maintenance mode flag is the kill-switch.
- Existing working features (timer sync, member RLS, exam mode, password reset) are touched only by additions, not rewrites.

If approved, I will start with Cluster 1 and ask the four Cluster-6 decisions before continuing.
