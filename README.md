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
- Online state exposes a 45-second turn deadline and 60-second reconnection grace policy. On expiry, a server-validated timeout action uses a legal Ludo fallback or safely draws/passes/resolves a pending Color Cards choice.
- Reopening Online reconnects to the live room. Leaving the screen never silently converts a live online match into a separate offline match.
- The browser currently uses frequent versioned room refreshes as the realtime-equivalent transport; authoritative state remains on the server.

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
   - `supabase/migrations/20260930_ludo_uno_v41.sql` (now permits `color-cards`; legacy values remain accepted)
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
