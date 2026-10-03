# LudoByDaniLabs — Classic Ludo + Color Cards

Royal blue/purple/gold mobile-first web games built with plain HTML, CSS and JavaScript. Gameplay rules are isolated in shared engines under `js/rules/`; offline UI, computer players and the online API call those same engines rather than duplicating rules.

## Completed games

### Classic Ludo
- Accurate 15×15 logical board map with 52 explicit outer-track coordinates, color offsets, five-cell home lanes and central finish.
- 2–4 players; two-player games use opposite red/yellow seats; four pawns each.
- Yard entry only on 6, exact finish, eight explicit safe track cells (0, 8, 13, 21, 26, 34, 39, 47), unsafe captures, friendly sharing without blockades.
- One bonus roll for a 6, capture or finish; a third consecutive 6 is cancelled and ends the turn.
- Pass-and-play, human vs computer and mixed-seat presets. Computer strategy selects only legal moves and never controls dice.
- Save/resume, restart, pause, sound, reduced motion and optional auto-move when exactly one pawn is legal.

### Color Cards
Original DaniLabs branding with a classic 108-card color-matching ruleset.
- Red/yellow/green/blue: one 0, two 1–9, two Skip, two Reverse and two Draw Two per color; four Wild and four Wild Draw Four.
- Seven-card deal. Setup deliberately rejects action/Wild opening cards until a numeric opening discard is selected, then returns/re-shuffles rejected cards.
- Play by color/value/action match or Wild; draw exactly one; after drawing, only that card may be played.
- Skip, Reverse (Reverse acts as Skip with two players), Draw Two, Wild and Wild Draw Four. No stacking, jump-in or seven-zero house rules.
- Wild Draw Four legality is captured privately before the play. The affected player may accept or challenge; successful and failed challenges follow the documented 4/6-card outcomes without revealing the offender's hand.
- Explicit UNO declaration and opponent Catch window. A valid catch adds two cards; the window closes when the next player starts a draw/play action.
- Draw-pile recycling keeps the top discard and shuffles the rest. No cards are invented when no draw is possible.
- Single-round and 500-point modes with 20-point action cards and 50-point Wild cards.
- Pass-device privacy screen, computer opponents and complete local match persistence including pending decisions.

## Shared architecture

`js/rules/ludo-engine.js` and `js/rules/color-cards-engine.js` contain gameplay state transitions. They do not render UI, perform network requests or choose computer strategy.

Offline controllers:
- `js/app.js` — Ludo UI, local persistence, dice animation and computer strategy.
- `js/cards.js` — Color Cards UI, pass-device flow, local persistence and computer strategy.

Online authority:
- `api/_online-engine.js` imports the same rule engines.
- The server generates dice, shuffles/deals cards, validates actions and redacts Color Cards private state.
- Requests carry room state versions and unique action IDs. The API rejects stale/out-of-turn actions and remembers recent IDs for deduplication.
- Online state defaults to a 45-second turn deadline and 60-second reconnection grace policy. Configure them with `ONLINE_TURN_SECONDS` and `ONLINE_RECONNECT_GRACE_SECONDS`. On expiry, a server-validated timeout action uses a legal Ludo fallback or safely draws/passes/resolves a pending Color Cards choice.
- Reopening Online reconnects to the live room. Leaving the screen never silently converts a live online match into a separate offline match.
- The browser maintains a Supabase Realtime WebSocket subscription per room. Broadcast messages contain only a wake-up/version signal; clients then fetch their own server-filtered state, so private hands and draw-pile order never travel over the public realtime channel.

## Online privacy

Each Color Cards player receives their own hand plus public match information. Opponent hands are replaced by counts and draw-pile order is removed. Wild Draw Four challenge legality is also removed from public views.

Private rooms support 2–4 players, six-character join codes, lobby readiness, capacity checks and account-based reconnection.

## Offline/PWA

The service worker cache is `ludo-danilabs-v45` and includes the app shell, both rule engines, controllers, CSS and required local art. The **first visit requires connectivity** so those files can be downloaded and cached. After a successful first load/cache, offline Ludo and Color Cards work without internet. API requests are never cached.

## Production setup

1. Use Node 22+.
2. Apply the Supabase migrations in order:
   - `supabase/migrations/20260930_online_v38.sql`
   - `supabase/migrations/20260930_online_auth_v39.sql`
   - `supabase/migrations/20260930_ludo_uno_v41.sql`\n   - `supabase/migrations/20261001_ludo_color_cards_v44.sql` (canonical `classic`/`color-cards` variants, room options and reconnect heartbeat)
3. Configure server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in Vercel.
4. Deploy the repository. Do not expose the Supabase secret in browser code.
5. Open the site online once on each device to install/cache offline assets.

## Verification

Run:

`npm test`

Coverage includes:
- Ludo track length/offsets/home entry, exact finish, safe/unsafe capture behavior, third consecutive six, no-move turns, bonus rolls and friendly sharing.
- Color Cards 108-card composition, numeric opening discard, matching, two-player Reverse, Draw Two no-stacking behavior, both Wild Draw Four challenge outcomes, UNO catch timing, draw-pile recycling, final Draw Two scoring and 500-point score carry-over.
- Online private-hand isolation, reconnect view regeneration, action-ID deduplication, authoritative Ludo actions and turn-timeout validation.

## Rule choices

Ludo has regional variations. This project intentionally uses the exact rules displayed in the in-game Rules screen: friendly pawns do not create blockades, all eight safe cells prevent captures, and 6/capture/finish each qualify for at most one bonus roll after a move.

Color Cards intentionally uses a numeric-only opening discard and does not include optional house rules by default.


## Polished website settings

Global preferences are stored under `ldb_set` and apply immediately: separate music/effects volume, mute, animation level, reduced motion, graphics quality, supported-device vibration, text size, high contrast, fullscreen, local turn notifications, Ludo auto-move and movement speed. Restore Defaults changes only these preferences and does not erase profiles, statistics or saved matches. English is the only implemented interface language, so the UI does not pretend other translations are available.

Color Cards setup adds computer difficulty and hand sorting. Ludo setup documents bot differences: Easy is deliberately less selective, Normal balances progress/safety/captures, and Hard weights finishing, captures and escaping threats more strongly. No difficulty changes dice results or permits illegal moves.

## Homepage feature truthfulness

The central runtime catalog is `data/game-catalog.json`. Classic Ludo, Color Cards and private online rooms are available. Quick Match and Team Up are intentionally disabled until separate rules are implemented and tested. Carrom, Chess and Snakes & Ladders are Coming Soon with no invented release dates. Daily Rewards, Missions, earned-coin Cosmetics and verified Leaderboards are implemented for signed-in online accounts. Lucky Spin remains a clearly labeled preview. Free-entry Classic Ludo tournaments and limited-time events are implemented. Coins have no cash value and there are no real-money purchases, wagering or cash-out.

Public room discovery is not implemented yet. Online room creation therefore exposes Private as the supported visibility and labels Public unavailable rather than simulating it.

See `docs/CLEANUP.md` for the recoverable checkpoint, replacements and retained files.


## Realtime online multiplayer (v48)

Online rooms use a persistent Supabase Realtime WebSocket for room-change notifications. All mutations still go through the same-origin API, which authenticates the account and validates the action against the shared Ludo/Color Cards engines. Realtime broadcasts never contain authoritative match state.

Room lifecycle:
- 2–4 players, six-character private codes, ready states, avatars and host ownership.
- The host can select Classic Ludo or Color Cards and the supported Color Cards match format while waiting. Configuration is rejected after start.
- Waiting rooms expire after `ONLINE_ROOM_HOURS` (default 24). Full, invalid, expired and already-started rooms are rejected.
- If the host leaves a waiting lobby, ownership moves to the lowest occupied seat.
- Clients send a lightweight presence heartbeat every 15 seconds; this is not match-state polling. Connection labels use the server's configurable reconnect grace period.
- During a live match, leaving the view does not create an offline copy. Reopening Online reconnects the account to the authoritative room/private hand.
- Turn deadlines remain server-authoritative. A timeout request is accepted only after the stored deadline; overdue state is also resolved when the room API is next touched. Disconnected players are not replaced by bots.

Environment:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` — server only.
- `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) — public key used to open Realtime. Browser roles still have no SELECT grants on authoritative online tables.
- `ONLINE_TURN_SECONDS` (default 45)
- `ONLINE_RECONNECT_GRACE_SECONDS` (default 60)
- `ONLINE_ROOM_HOURS` (default 24)

Apply `supabase/migrations/20261001_realtime_online_v48.sql` after the existing online migrations. Supabase Realtime must be enabled for the project. The application sends Broadcast messages through the server; it does not expose database rows through Postgres Changes.

Hosting must support the existing Node 22 server API and outbound HTTPS to Supabase. The persistent socket is between each browser and Supabase Realtime, so the web host itself does not need to hold WebSocket connections open.


## Persistent accounts, friends, invitations and verified history (v49)

Guest/offline play remains available without an account. Online identity uses the existing server-side DaniLabs account/session system: password hashes and recovery hashes stay in server-only tables and are never returned by public APIs. New accounts receive a stable public `DL-…` player ID.

Profiles:
- Authenticated players may edit only their own display name and supplied avatar choice.
- The local guest profile stays separate. The Profile screen offers an explicit “Use my guest profile” migration; signup/login never silently overwrites account profile data.
- Verified online statistics are computed only from authoritative recorded online results. Local/offline results remain separate.

Social:
- Friends are found by public player ID, not private account identifiers.
- Requests support send, accept, decline and cancel; accepted friends can be removed.
- Blocking removes an existing relationship and prevents new friend requests and room invitations in either direction.
- Invitations are server validated on send and accept, expire, and re-check room status/capacity and block state before membership is created.
- Presence shown in live rooms comes from the realtime connection/presence heartbeat; history/friends pages do not invent activity.

History:
- Completed authoritative online matches are inserted into `online_match_results` with a unique `room_id`, preventing duplicate result records.
- Participant snapshots, winner and Color Cards scores are stored separately and exposed only to authenticated participants through `/api/online/history`.
- Supported result statuses are completed, abandoned and forfeited. This phase records normal completed matches; abandoned/forfeited policy is reserved for a later explicit match-abandonment feature.

Apply `supabase/migrations/20261001_accounts_social_history_v49.sql` after v48. No additional secrets are required beyond the documented v48 environment variables.


## Rewards, missions, cosmetics and leaderboards (v50)

This economy is deterministic and server controlled. Earned coins have no cash value and cannot be bought, wagered or cashed out.

Daily rewards use server UTC. The daily reset is 00:00 UTC and is displayed in the UI. One fixed reward may be claimed per UTC date. Consecutive claims advance Day 1 through Day 7, Day 7 cycles to Day 1 on the next consecutive day, and missing a UTC day resets the next claim to Day 1. A database primary key plus a transactional server-only RPC prevents concurrent duplicate claims.

Currency changes are written to `reward_ledger` with unique transaction keys. PostgreSQL row locking prevents negative balances and makes claim/purchase operations atomic. Reward amounts and cosmetic prices come only from server policy; clients submit identifiers, never balances or prices. Reward RPC execution is revoked from browser roles.

Daily/weekly missions currently cover verified completed matches, verified wins, Ludo pawn finishes and Color Cards action-card plays. Ludo finishes and card actions are counted inside the authoritative online engine. Result/mission/player event keys make progress idempotent. Offline, abandoned and forfeited matches do not qualify.

The cosmetic catalog currently contains an avatar treatment, profile frame, Ludo board theme, pawn treatment and Color Cards card back. Purchases use earned coins only. Equipped cosmetics are visual only and do not affect rules. The last verified loadout is cached locally so its already-available styling can display offline; offline actions never grant ownership or alter the server wallet.

Ludo and Color Cards leaderboards are separate. Eligibility is at least one verified normally completed online match of that game. Ranking is wins descending, then win rate, then games played, with public player ID as a deterministic final tie break. Abandoned/forfeited/offline matches are excluded.

Apply `supabase/migrations/20261001_rewards_inventory_v50.sql` after v49. No new environment secrets are required.


## Tournaments and limited-time events (v51)

Supported tournament format:
- Free entry only. There are no entry fees, wagers, cash prizes or cash-out.
- Two-player **Classic Ludo**, using the same shared authoritative Classic rules and server-generated dice as normal online rooms.
- Requested bracket capacities: 4, 8 or 16. Single elimination, one match per pairing.
- Color Cards tournaments are **not supported** until a separate tournament round/scoring format is specified and implemented. Team tournaments, paid-entry tournaments and best-of series are also unsupported.
- Registration is unique per account/tournament and capacity is checked while the tournament row is locked. Registration closes at the stored server timestamp.
- If fewer than four players register, the tournament is cancelled. Otherwise the bracket resizes to the smallest supported capacity that contains every registrant (4/8/16); unused slots become byes, so registered players are not arbitrarily dropped.
- Brackets are persisted after registration closes. Initial seeding uses registration order with account ID as a deterministic tie break.
- Schedule and countdown UI uses server time. The displayed tournament timezone is UTC.

Pairings and progression:
- Every real pairing gets a private two-player Classic room. Ordinary host configure/start/leave controls are disabled for tournament-tagged rooms.
- Both players must confirm readiness before the stored readiness deadline (default 5 minutes after the scheduled/created pairing time). One no-show forfeits to the ready player; double no-show has no winner.
- Live tournament matches use account presence heartbeats. After 20 seconds stale presence the UI can show reconnecting; remaining absent beyond the tournament reconnect grace (default 90 seconds) forfeits. If both remain absent, there is no winner.
- Normal winners advance only from the unique authoritative `online_match_results` row for that room. No-show/reconnect forfeits are server-adjudicated and stored as `forfeited` history, so they do not count for verified missions or leaderboards.
- Terminal bracket slots are replayed during tournament sweeps. This repairs progression after a server restart between result persistence and next-round creation. Unique slot/result constraints and conditional updates keep retries idempotent.
- Completed match history is never rewritten when an administrator cancels a tournament. Unfinished pairing rooms are stopped and their tournament slots become cancelled.

Rewards:
- Tournament reward configuration is displayed before registration.
- Champion earned coins are granted to a valid final winner; runner-up rewards require a normally completed final, so a final no-show/forfeit loser is not an eligible finisher. Champion/runner-up earned coins use the existing server-controlled ledger with transaction key `tournament:<tournament-id>:<user-id>`. Replays therefore do not duplicate grants.
- Optional tournament badges are persistent cosmetic achievements. Rewards have no cash value.

Limited-time events:
- Published/cancelled events persist with title, description, optional artwork, start/end timestamps, eligible games, eligible mission keys and a fixed earned-coin/badge reward summary.
- Availability and claims use server time. Upcoming, active, expired and cancelled events remain viewable as applicable.
- Event mission progress is fed only by verified completed online-match metrics. Event reward claims require every configured event mission to be complete and must occur while the published event window is active. Event claims and ledger transactions are unique per account/event.

Administration:
- Admin permission is server-side in `online_admins`; the browser cannot grant itself admin access.
- The admin interface supports create/edit/publish/cancel for events and tournaments. Important mutations are written to `admin_audit_log`.
- Tournament rules/rewards are editable only before start; draft-only structural fields are locked once published. Completed tournaments cannot be cancelled.

Deployment:
1. Apply migrations through v50 first.
2. Apply `supabase/migrations/20261001_tournaments_events_v51.sql`.
3. After the intended administrator has created an account, grant admin explicitly from a trusted Supabase SQL/admin session:
   `insert into public.online_admins(user_id) values ('<server account user_id>') on conflict do nothing;`
4. No browser-visible admin secret is used and no new environment variable is required.
5. The app enforces deadlines when tournament/event APIs are touched (including the open tournament UI's periodic refresh); persisted timestamps make enforcement restart-safe.

Verification is included in `tests/tournament-policy.test.js` plus the existing gameplay/reward suite. It covers supported/resized bracket sizes, registration deadlines/capacity and concurrent-registration database contracts, one/double no-shows, reconnect grace, server-time event availability, winner-slot advancement contracts, duplicate result/reward protections, restart recovery replay and database-backed administrator authorization.
