# Ludo by DaniLabs — v34

A mobile-first, offline-first Ludo game built with plain HTML, CSS and vanilla JavaScript. The repository is a static-root project designed for GitHub → Vercel deployment with no build step.

## Current Ludo experience

- 2, 3 or 4-player local pass-and-play with optional computer opponents.
- Classic, Quick and Rush variants plus Party options.
- Separate color-matched dice for every player; only the current human player's dice is actionable.
- Live progress percentage/bar for every player.
- Optional Shake to Roll on browsers/devices that expose motion events.
- Optional Instant dice roll for faster matches.
- Player cards with match avatars, recent dice history, active-turn feedback and local reactions.
- Party powers live on the owning player's panel: Shield, Re-roll and Freeze.
- Re-roll now works after a dead/no-move roll for humans and bots.
- All owned powers remain reachable on narrow phones instead of hiding later power buttons.
- Bots can use Shield, Freeze and situational Re-roll powers.
- Safe cells, captures, exact finish, extra turns, three-six handling, undo, save/continue, rankings, rematch and replay.

## Reliability and mobile audit

v28 keeps the v27 hardening pass and adds reference-inspired quality-of-life features:

- Live player progress now shows both route percentage and home-token count.
- Shake to Roll requests motion permission when required and only reacts during an eligible human roll turn.
- Instant dice roll shortens the visual roll without changing the final dice engine or legal-move rules.
- Saved Ludo games are validated and normalized before continue.
- Stored gameplay and host options are normalized to supported values.
- Profile data is sanitized before match-card rendering.
- Daily rewards use the device's local calendar day instead of UTC day boundaries.
- Stored game-mode values fall back safely to Classic when invalid.
- Mobile zoom is no longer disabled.
- Small-screen player power controls can scroll so every owned power remains accessible.
- PWA updates automatically refresh an already controlled page when the new service worker takes control.
- Dead Color Cards bot branches were removed.
- Service-worker cache is `ludo-danilabs-v34`.

## Cosmetics and local features

- Board themes, dice skins and pawn styles in Collection.
- Local profile name/avatar and cosmetic coin rewards.
- Sounds, haptics, speed controls and local statistics.
- Separate Color Cards game.
- Offline/PWA app shell with versioned cache updates.

## Private DaniLabs controls

The existing local DaniLabs Control Center is preserved, including per-color legal dice-weighting controls, power-click timing and secret click rules. These private controls are not shown in the normal public match UI. The local credential barrier is convenience-level client-side protection, not server security.

## Project structure

```text
.
├── assets/icons/
├── css/
│   ├── style.css
│   ├── upgrade.css
│   ├── realistic.css
│   ├── lobby.css
│   └── game-room.css
├── js/
│   ├── app.js
│   ├── host.js
│   ├── game-room.js
│   ├── cards.js
│   ├── themes.js
│   ├── realistic.js
│   └── lobby.js
├── index.html
├── manifest.json
├── sw.js
└── vercel.json
```

## Vercel

Import the repository root into Vercel.

- Framework preset: **Other**
- Build command: none
- Output directory: none
- Production branch: `main`

`vercel.json` supplies static cache/security headers.

## PWA / offline

`sw.js` precaches the local app shell. Navigation uses network-first with an offline fallback; static assets use cache-first with background refresh. The cache version is bumped whenever cached deployable assets change.

## Audit status

The v34 static audit covers JavaScript/JSON syntax, duplicate HTML IDs, local asset references, service-worker cache paths, per-player dice/power/reaction integration, saved-state migration, Party power behavior, private power-click preservation, responsive power access, profile/reward state, PWA update flow and Vercel configuration.

Real mobile/browser runtime QA on the deployed production build is still recommended because static checks cannot fully replace device testing.


## Control Center v31

The private Control Center now includes a read-only live match inspector, one-tap jump to the current player, selectable 1/3/5-click quick power presets, a four-color live status dashboard, master re-arm/off controls, and a local power-setup snapshot that can be saved and restored. Existing Easy Power Setup, advanced power controls, click rules and private activation behavior are preserved.


## Fast Control Center v32

The private Control Center now prioritizes the normal workflow in one compact mobile-first surface: select a player color, choose Lucky/Bad/Killer/Defender, choose 1/3/5 activation clicks, then Arm, Activate now, or Off. Live match inspection, four-color status, snapshots, fine tuning, click rules, and owner tools remain available through secondary sections so the primary controls require less scrolling. Touch-oriented primary controls use larger targets and the layout compacts further on narrow phones.


## Fast Workflow v33

The private dashboard now uses one primary workflow: choose a color, choose Lucky/Bad/Killer/Defender, then choose 1/3/5 clicks. Power and click selections automatically arm the selected setup, so the redundant Arm step is removed from the fast surface. Optional Follow Turn keeps the dashboard on the player whose turn is active; manually selecting another color pauses following. Activate Now and Off remain the only immediate fast actions.

The older duplicate dashboard renderer and obsolete settings listener were removed. Fine Tune now contains only optional strength, click-target, multi-power and custom-dice controls instead of repeating the same basic setup. Match details, snapshots, click rules and owner tools remain progressively disclosed below the primary workflow.


## Private match-hold shortcuts v34

After a successful private Control Center login in the current browser session, token 1 and token 2 support match-scoped hold shortcuts. Holding token 1 for about 0.9 seconds toggles Bad Match for that token's color. Holding token 2 toggles Best Powers for that color. Best Powers intentionally combines Good Luck, Killer and Defender but not Bad Luck, avoiding contradictory good/bad weighting. Holding the same token again removes that match shortcut.

The shortcut is stored only with the current match state, survives Continue Game, and clears naturally with a new/completed match. It has no public badge or popup. Pointer movement cancels an unfinished hold, a completed hold suppresses the following normal click so a pawn is not moved accidentally, and the private Control Center can clear all match holds at once.
