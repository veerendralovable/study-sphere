
# StudySphere → StudyStream Feature Expansion Plan

This plan layers Study Stream–style co-working features on top of the current StudySphere foundation. It is grouped into 8 sequential clusters. Each cluster ships independently and does not break the previous one. Free-tier services only.

---

## Cluster 8 — Live Audio & Video (study-with-me cams), free-tier

Goal: every room can be a "study-with-me" room with optional camera and mic tiles, controlled per user.

### 8.1 Transport choice (free tier)
- Primary: **LiveKit Cloud free tier** (50 GB egress / mo, 100 concurrent participants) via official Deno-friendly token-issuing edge function. Falls within budget for early users.
- Fallback for rooms ≤ 4 users when LiveKit quota is exhausted: **Supabase Realtime as a WebRTC mesh signaling channel** (no media server cost; clients connect peer-to-peer). Auto-switch decided server-side.
- Audio-only mode is the default to save egress; users opt-in to video per session.

### 8.2 Database
- `room_media_sessions(id, room_id, user_id, kind ['cam'|'mic'|'screen'], started_at, ended_at)` — analytics + abuse trail, not signaling.
- `rooms.media_mode text default 'audio'` — `'off' | 'audio' | 'video' | 'mesh'`.
- `rooms.max_video_tiles int default 12`.
- `room_media_bans(room_id, user_id, until)` — creator/admin can temp-mute or ban camera per user.

### 8.3 Edge functions
- `livekit-token` — verifies caller is `is_room_member`, room not `locked`, not banned; mints LK access token with room name = `room:<uuid>` and identity = `user:<uuid>`. Reads `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` secrets.
- `livekit-egress-quota` — daily cron sums monthly minutes via LK REST; flips `media_mode` to `'mesh'` when 90% of budget hit; writes `system_settings.media_quota_state`.

### 8.4 UI (Room page)
- New `MediaTiles` panel: grid of camera tiles, mic-only avatar tiles, raise-hand row. Tile shows: avatar, name, mic level (Web Audio analyser), timer remaining, focus state badge.
- Self-controls strip: mic toggle, cam toggle, screen-share, blur-background (uses `@mediapipe/selfie_segmentation` client-side — free), virtual background presets, "go AFK", "leave call".
- Settings sheet: input/output device picker, noise suppression (LK default), auto-mute on focus block, "low-bandwidth mode" (drop to audio).
- Creator-only moderation menu per tile: mute, disable cam, kick from call (does not remove from room), ban media for room.

### 8.5 Permissions / RLS
- `room_media_bans`: insert/delete by creator or admin; read by everyone (clients check before publishing).
- Media-publish authority is enforced by the LK token, not by RLS.

---

## Cluster 9 — Focus Suite inside a room

Goal: full study-session productivity loop. All data persists per session.

### 9.1 Pomodoro Presets
- New table `pomodoro_presets(id, user_id, name, focus_min, short_break_min, long_break_min, cycles_until_long, auto_start)`.
- Seed defaults (Classic 25/5/15×4, 50/10, 90/20 ultradian, Deep 120/30, Custom).
- `room_timer_program(room_id, preset_id, current_phase, cycle_index, phase_started_at, paused_at)` — drives the shared timer across phases instead of one duration.
- Realtime broadcast: phase transitions auto-advance for everyone in room; creator can skip/reset.

### 9.2 Tasks per session
- `session_tasks(id, user_id, session_id, room_id, title, done, est_pomodoros, actual_pomodoros, created_at, completed_at, position)`.
- Side panel "My tasks" in room: add, reorder (drag), check, edit, delete; tag a task as the "current focus" — shown on the user's tile and in chat presence.
- Pomodoro completion auto-increments `actual_pomodoros` of the current focus task.

### 9.3 Distraction Blocker (client-side checklist + lock)
- New table `focus_blocklists(user_id, items text[])` — list of sites the user wants to remember to avoid.
- "Lock-in mode": when on, the room UI hides chat, leaderboard, notifications bell, achievements popovers; only timer + tasks + media tiles render. Disables tab navigation away (best-effort: `beforeunload`, `visibilitychange` warning). No real blocking (browser sandbox), purely accountability + visible "left the room" alert to peers.

### 9.4 Session Notes & Reflection
- `session_notes(session_id, user_id, body markdown, created_at, updated_at)` — autosaves every 5 s. Markdown editor in side panel.
- On `study_sessions.end`, a Reflection dialog asks: mood (1-5), productivity (1-5), what was accomplished, what's next, friction notes. Stored as `session_reflections`.
- Dashboard surfaces last 7 reflections, average mood/productivity trends.

### 9.5 Ambient Sounds & Focus Music
- Bundled royalty-free loops (lo-fi, rain, cafe, forest, white/brown/pink noise, fireplace) shipped as static `.opus` files in `public/sounds/` (size budget: total ≤ 6 MB after Opus encoding).
- Per-user mix: independent volume sliders per layer (max 3 layers concurrent), saved to `user_sound_mixes(user_id, mix jsonb)`.
- "Room ambience" toggle for creators: streams a shared ambience selection over Realtime so everyone hears the same.
- Optional ElevenLabs **on-demand** music generation (gated behind admin flag `feature_ai_music`, off by default to protect AI balance). Edge function `gen-focus-track` proxies ElevenLabs Music API; cached results stored in `focus_tracks` table + Supabase Storage `focus-tracks` bucket (public read).

---

## Cluster 10 — Gamification: XP, Levels, Badges, Streaks

### 10.1 Schema
- `user_xp(user_id pk, xp bigint default 0, level int default 1, level_progress int default 0, updated_at)`.
- `xp_events(id, user_id, source ['session'|'task'|'streak'|'social'|'badge'], amount, ref_id, created_at)` — append-only ledger; recomputable.
- `badges(code pk, name, description, icon, criteria jsonb, tier)`.
- `user_badges(user_id, badge_code, awarded_at)`.
- `user_streaks(user_id pk, current int, longest int, last_active_date)` — replaces ad-hoc streak query for hot path; `user_streak()` SQL fn becomes write-through.

### 10.2 Award rules (server-side, trigger-driven)
- AFTER UPDATE on `study_sessions` when `duration` becomes non-null:
  - +1 XP per minute, +10 bonus per full pomodoro phase logged.
- AFTER UPDATE on `session_tasks` when `done=true`:
  - +5 XP per task; +15 if estimated pomodoros met exactly.
- AFTER UPDATE on `user_streaks`:
  - Day-3 / 7 / 14 / 30 / 60 / 100 → badges + bonus XP.
- Level curve: `xp_required(n) = 100 * n^1.5` (rounded). Recomputed in SQL function `recalc_level(uid)`.

### 10.3 Badge catalogue (seed)
- First Session, Night Owl (00:00–04:00), Early Bird (05:00–08:00), Marathon (4 h single session), Centurion (100 sessions), Streak Starter / Keeper / Hero / Legend, Social Butterfly (5 friends), Tutor (helped 10 chat replies), Focus Master (50 completed pomodoros), Subject badges per `rooms.subject`.

### 10.4 Frontend
- Profile page additions: level bar, badge grid (locked/unlocked), XP history chart.
- Toasts on award (respect Lock-in mode — queue and show after).
- Dashboard "Rank up in X XP" widget.

---

## Cluster 11 — Leaderboards & Social Graph (friends)

### 11.1 Friends
- `friend_requests(id, from_user, to_user, status ['pending'|'accepted'|'rejected'|'cancelled'], created_at, responded_at)`.
- `friends(user_a, user_b)` materialised on accept (both directions inserted; PK `(user_a, user_b)` with `user_a < user_b`).
- RLS: users see only rows they participate in.
- Search users by name/email prefix via `search_users(q)` SECURITY DEFINER fn limited to 20 results.

### 11.2 Presence among friends
- Friends list shows live status (online/in-room/focusing/break) via Realtime presence channel `friends:<uid>`.
- "Join friend's room" button if room is public or shared code present.

### 11.3 Leaderboards
- Views:
  - `leaderboard_weekly` — sum(duration) past 7 d per user.
  - `leaderboard_alltime` — sum(duration) lifetime.
  - `leaderboard_xp_weekly`, `leaderboard_xp_alltime`.
  - `leaderboard_room_weekly(room_id)` — per-room.
- Opt-in flag `profiles.leaderboard_opt_in boolean default true`. Opted-out users still see their own rank but are hidden from others.
- Privacy: leaderboards show only display name + avatar + minutes/XP; never email. Anonymous mode shows a generated alias.

### 11.4 UI
- `/leaderboard` page with tabs: Global · Weekly · Friends · Room. Filter by subject.
- Room sidebar mini-leaderboard "This room, this week".

---

## Cluster 12 — Chat upgrade & community surfaces

### 12.1 Room chat improvements
- Reactions (emoji), reply threads (1-level), mentions (`@name`) → creates `notifications` rows for mentioned users.
- Pinned message per room (`rooms.pinned_message_id`).
- Slash commands: `/break`, `/focus`, `/task add X`, `/timer 25` — parsed client-side, routed to existing services.
- Slow-mode toggle (creator): N seconds between posts, enforced via DB function `post_room_message_throttled`.
- Moderation: report message inline → existing `reports` flow; creator can soft-delete; admin can hard-delete (audit logged).

### 12.2 Direct messages (1:1, friends only)
- `dm_threads(id, user_a, user_b unique pair)`, `dm_messages(thread_id, user_id, body, created_at, read_at)`.
- RLS: participants only. Realtime enabled. Notifications bell counts unread.

### 12.3 Subject hubs (lightweight communities)
- `subjects(slug pk, name, description, icon)` — seeded (Math, CS, Bio, Physics, History, Languages, MBA, MCAT, USMLE, LSAT, …).
- `/subjects/:slug` page: featured rooms with that subject, top users this week, recent announcements tagged with that subject.
- Rooms already carry `subject` + `tags`; expose filter chips on dashboard.

---

## Cluster 13 — Real-time everywhere & presence v2

### 13.1 Presence channels
- `room:<id>` — current members, mic/cam state, focus state, current task title, raise-hand.
- `friends:<uid>` — online + current room id.
- `global:lobby` — top-level "X people studying now" count (anonymous sample).

### 13.2 Realtime subscriptions added
- `room_media_sessions`, `room_timer_program`, `session_tasks` (room-scoped), `room_messages` reactions, `dm_messages`, `notifications`, `friend_requests`, `xp_events` (self only), `leaderboard_*` polled every 60 s.

### 13.3 Authorization
- One `realtime.messages` topic policy that maps topic → owning entity:
  - `room:*` and `presence_room:*` require `is_room_member`.
  - `friends:<uid>` requires `auth.uid() = uid` OR they are friends.
  - `dm:<thread>` requires participant check via SQL fn.

---

## Cluster 14 — Mobile-first polish, accessibility, infra

### 14.1 Responsive
- Room: media tiles collapse to horizontal swipeable strip on `< 768 px`. Side panels become bottom-sheet tabs (Chat · Tasks · Notes · Leaderboard · Members).
- Add PWA manifest + service worker (offline shell, cached ambient sounds, push notifications for friend requests + announcements once supported).

### 14.2 Accessibility
- All media controls reachable via keyboard; captions track scaffold (LK supports server-side STT — leave behind a flag).
- Reduced-motion preference disables tile animations and confetti on level-up.
- High-contrast theme variant added to `index.css` tokens.

### 14.3 Observability & cost guardrails
- Edge function `metrics-rollup` (cron 5 min): writes `daily_metrics(date pk, active_users, sessions_started, video_minutes, ai_seconds, messages_sent)`.
- Admin dashboard new tab "Costs": LK minutes, ElevenLabs seconds, storage GB. Hard cap toggles per service.
- Sentry-free lightweight error logger: `client_errors(user_id, route, message, stack_hash, created_at)` write-only via edge fn.

### 14.4 Cleanup
- Delete the 25 legacy `*.md` / `*.txt` docs; keep `README`, `CHANGELOG`, `ARCHITECTURE`.
- Tests: vitest coverage for XP curve math, streak math, slash-command parser, throttle function.
- Update `mem://security/posture.md` with media, friends, DM, and leaderboard rules.

---

## Cluster 15 — Decisions before build (one ask, then go)

I will ask once before starting Cluster 8:

1. **LiveKit account** — do you have one? If not, I'll create the edge function and request `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` as secrets. Free tier signup is at livekit.io.
2. **Anonymous leaderboard default** — opt-in (show me by default) or opt-out (hide me by default)?
3. **AI music generation** — leave it OFF by default to protect AI balance, admin toggle to enable?

---

## Execution order & dependencies

```
8 Live A/V ──┐
             ├──> 13 Realtime v2 ──> 14 Polish & infra
9 Focus  ────┤
10 XP ───────┤
             ├──> 11 Leaderboards ──> 12 Chat & DMs
```

8 and 9 are independent; 10 must precede 11; 12 depends on 10 (mentions award XP) and 11 (friends gate DMs).

---

## Risk controls

- Every new feature is behind a `system_settings` flag: `feature_video`, `feature_ai_music`, `feature_dm`, `feature_leaderboards`, `feature_friends`, `feature_pomodoro_program`. Admin can kill-switch any feature without redeploy.
- All XP awards via DB triggers — never trusted from client.
- Media tokens are per-room, 1-hour TTL, signed server-side.
- Quota guards (`media_quota_state`, AI seconds) flip features into degraded mode before billing surprises.
- Each cluster ships its own migration block; reverts isolated.

---

## Out of scope (explicit)

- Native mobile apps, in-person event check-ins, paid subscriptions, tutoring marketplace, calendar/email digests, AI tutor chat (a future Cluster 16 if requested).
