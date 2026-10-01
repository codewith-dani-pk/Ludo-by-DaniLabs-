# LudoByDaniLabs — Classic Ludo + Color Cards v44

LudoByDaniLabs contains two complete games with original DaniLabs presentation: **Classic Ludo** and the UNO-style, independently branded **Color Cards**. Both offline and online controllers use the same rules files in `js/rules/`; UI, bots and API handlers do not own alternate rule implementations.

## Classic Ludo

The engine defines the 15×15 board as data: 52 explicit outer-track coordinates, start offsets (red 0, green 13, yellow 26, blue 39), home-entry points, five-cell colored home lanes and eight safe track positions (0, 8, 13, 21, 26, 34, 39, 47). Each player has four uniquely identified pawns with yard/track/home/finished state and owner-relative progress.

Implemented rules: all pawns start in the yard; a six may enter a pawn or move one already in play; entry consumes the roll; exact finish is required; unsafe landings capture opponents; safe squares cannot be captured; friendly pawns may share/pass and never form blockades; six/capture/finish grants one bonus roll; a third consecutive six is cancelled; and the first player to finish all four pawns wins. Two-player games use red/yellow (opposite colors).

Offline supports 2–4 pass-and-play players, human-vs-computer/mixed seats, localStorage resume, restart, pause, rules, sound, auto-move for a single legal pawn and reduced motion. Computer players receive only legal moves and never influence dice generation.

## Color Cards

Color Cards uses the classic 108-card structure: four colors, one 0 per color, two 1–9 per color, two Skip/Reverse/Draw Two per color, four Wild and four Wild Draw Four cards. Every card has a unique ID. Seven cards are dealt to each of 2–4 players. Setup deliberately chooses a numeric opening discard; action/Wild candidates are returned to the draw pile and reshuffled.

Turns allow one legal play or one-card draw. A player may draw even when another play exists; after drawing, only that card may be played, otherwise it is kept and the turn ends. Empty draw piles recycle all but the top discard. Draw penalties never stack. Two-player Reverse acts as Skip.

Wild Draw Four records server/private pre-play legality evidence. The affected player may Accept or Challenge. A successful challenge makes the offender draw four and lets the challenger continue; a failed challenge makes the challenger draw six and lose the turn. The evidence is never sent to opponents.

An **UNO!** declaration can be armed before a play that leaves one card. If omitted, an opponent can Catch until the next player begins a draw/play action; a valid catch draws two. Final Draw Two/Wild Draw Four effects resolve before scoring. Single-round and 500-point modes use 20 points for Skip/Reverse/Draw Two, 50 for Wild/Wild Draw Four, and face value for number cards.

Offline Color Cards supports pass-and-play privacy screens, computer players, localStorage resume including pending color/challenge/catch state, and strategic color selection without reading hidden hands or draw order.

## Online architecture

Private online rooms use authenticated DaniLabs accounts, six-character join codes, readiness, 2–4 player limits, reconnectable membership and an approximately realtime polling transport. The database is authoritative. The server shuffles/deals Color Cards, generates Ludo dice, validates membership/turns/actions, increments room versions, rejects stale writes and keeps the latest 100 action IDs to deduplicate retries.

Color Cards responses contain the viewer's own hand, opponent hand counts, public discard/history and draw count only. Draw-pile order, opponent hands, Wild Draw Four challenge evidence and retry metadata stay private.

Online turns have a 45-second server deadline and 60-second reconnect-grace metadata. Color Cards timeout fallback draws one card and ends safely (or accepts a pending Wild Draw Four challenge); Ludo timeout fallback rolls server-side and makes the first legal move when a move is required. A disconnected match remains an online match; the UI never silently converts it to offline play.

## Setup

1. Deploy the repository on Vercel or another Node 22-compatible host.
2. Configure the existing Supabase/backend environment variables used by `api/_db.js` and `api/_auth.js`.
3. Apply the existing auth/room migrations in order, then apply `supabase/migrations/20261001_ludo_color_cards_v44.sql`.
4. Run `npm test` with Node 22+.
5. Visit the deployed site once while connected. The service worker caches the application, both shared rules engines and required local royal assets. After that successful cache load, offline games work without a network connection.

## Important source files

- `js/rules/ludo-engine.js` — sole Classic Ludo rules/board engine.
- `js/rules/color-cards-engine.js` — sole Color Cards deck/turn/challenge/scoring engine.
- `js/app.js` — Ludo offline controller/renderer/bots.
- `js/cards.js` — Color Cards offline/online controller and renderer.
- `api/_online-engine.js` — server adapter importing the exact same two rules engines.
- `api/online/action.js` — authoritative version/action-ID validation.
- `api/online/room.js` — room lifecycle, readiness, reconnect heartbeat and timer enforcement.
- `tests/online-engine.test.js` — board, route, dice, card, challenge, privacy and retry tests.
- `sw.js` — offline cache v44.

## Verification focus

Tests cover Ludo board offsets/routes/safe squares, exact finish, capture behavior, third-six cancellation and no-move bonus behavior; Color Cards deck composition, numeric opening discard, matching, two-player Reverse, Draw Two behavior, both Wild Draw Four challenge outcomes, catch timing, draw recycling, final action scoring, private-hand isolation, retry deduplication and reconnect-view regeneration.

The project intentionally does not simulate public online opponents. Online players are authenticated room members; computer players are labeled computer players and are used only in offline matches.
