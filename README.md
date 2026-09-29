# Ludo by DaniLabs — v20

A mobile-first, offline-first Ludo game built with plain HTML, CSS and vanilla JavaScript. The repository is a clean static-root project designed for GitHub → Vercel deployment with no build step, CDN, database or environment variables.

## v20 highlights

- Premium DaniLabs game room with player panels around a large central board.
- Active-turn lighting, compact turn banner and mobile action dock.
- 3D-style dice with Classic, Galaxy, Wood, Ice, Gold and Neon skins.
- Pawn styles: Classic, Gem, Neon, Candy, Pearl and Royal.
- Board themes: DaniLabs Classic, Vegas Night, Beach, Snow, Royal, Neon and Space.
- Improved movement, capture, finish and victory feedback.
- In-app Edit Profile modal, local emoji reactions and cosmetic coin rewards.
- Offline/PWA cache version `ludo-danilabs-v20`.

## Gameplay preserved

The existing gameplay engine remains intact: 2/3/4-player pass-and-play, computer opponents, Classic/Quick/Rush modes, Party options, Color Cards, save/continue, rankings/rematch, safe cells, captures, exact finish, extra turns, three-six handling, sounds, haptics and local statistics.

## Private DaniLabs Control Center

There is no public admin button. Tap a DaniLabs logo five times to open the local credential screen. Per-color Normal / Good Luck / Bad Luck / Killer / Defender settings, secret tap counts, click rules and legal weighted dice behavior are preserved. Private mode names and counters are not shown in the public match UI.

The private login is local/client-side and is a convenience barrier rather than server-grade security.

## Project structure

```text
.
├── assets/
│   └── icons/          PWA and app icons
├── css/
│   ├── style.css       Core UI and board styles
│   ├── upgrade.css     Theme/premium visual layer
│   ├── realistic.css   Dice/pawn depth effects
│   ├── lobby.css       Lobby and customization UI
│   └── game-room.css   v20 match-room presentation
├── js/
│   ├── app.js          Core Ludo engine
│   ├── host.js         Game options/private controls
│   ├── cards.js        Color Cards game
│   ├── themes.js       Cosmetic theme state
│   ├── realistic.js    Cosmetic dice/pawn behavior
│   ├── lobby.js        Lobby/profile/collection behavior
│   └── game-room.js    v20 match-room behavior
├── index.html
├── manifest.json
├── sw.js
└── vercel.json
```

## Vercel deployment

Import this repository into Vercel and deploy the repository root.

- Framework preset: **Other**
- Build command: leave empty
- Output directory: leave empty
- Production branch: `main`

`vercel.json` provides the static cache/security headers.

## PWA / offline

`sw.js` precaches the app shell and required local assets. Core local play is designed to keep working after the service worker has cached the project. Increment the cache version whenever deployable cached assets change.
