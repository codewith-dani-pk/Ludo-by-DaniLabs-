# Ludo by DaniLabs — v26

A mobile-first, offline-first Ludo game built with plain HTML, CSS and vanilla JavaScript. The repository is a static-root project designed for GitHub → Vercel deployment with no build step.

## Current game room

- 2, 3 or 4-player local pass-and-play with optional computer opponents.
- Separate color-matched dice for every Ludo player; only the current human player's dice is actionable.
- Individual player cards with random match avatars, recent dice history and active-turn feedback.
- Party mode gives every player their own random power card: Shield, Re-roll or Freeze.
- Power cards live on the owning player's panel; the old shared bottom power area is disabled.
- Each player panel has its own local emoji/reaction control.
- Duplicate powers in old saved games are cleaned when a game is continued.
- Bots can use Shield, Freeze and situational Re-roll powers.
- Classic, Quick and Rush variants plus Party options, safe cells, captures, exact finish, extra turns and three-six handling.

## Cosmetics and local features

- Board themes, dice skins and pawn styles in Collection.
- Local profile name/avatar and cosmetic coin rewards.
- Sounds, haptics, speed controls, save/continue, rankings, rematch and replay.
- Separate Color Cards game.
- PWA/offline app shell with versioned cache updates.

## Private DaniLabs controls

The existing local DaniLabs Control Center and its per-color legal dice-weighting controls are preserved. Private controls are not shown in the normal public match UI. The local credential barrier is convenience-level client-side protection, not server security.

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

`sw.js` precaches the local app shell. Navigation uses network-first with an offline fallback; static assets use cache-first with background refresh. Bump the cache version whenever cached deployable assets change.

## Audit notes

The v26 audit checks JavaScript/JSON syntax, duplicate HTML IDs, local asset references, service-worker cache paths, per-player dice/power/reaction integration, saved Party-state normalization, private power-click timing and Vercel/PWA configuration. Browser/device QA is still recommended after deployment because static checks do not replace real mobile runtime testing.
