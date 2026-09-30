# Ludo + UNO by DaniLabs — v41

Mobile-first Ludo and UNO-style card play built with plain HTML, CSS and vanilla JavaScript, deployed from GitHub to Vercel.

## Games

- Ludo offline: 2, 3 or 4 players, pass-and-play or computer opponents.
- Ludo online: private 2–4 player invite-code rooms with server-authoritative dice, moves and turn ownership.
- Ludo variants: Classic, Quick and Rush. Dice are fair random rolls; hidden luck/bad-luck weighting, secret powers and party modifiers are not part of gameplay.
- UNO offline: 2–4 players, pass-and-play or computer opponents.
- UNO online: private 2–4 player rooms with server-authoritative hands, draws, legal plays and turn ownership.
- UNO core rules use one-card draw, no Draw Two/Draw Four stacking, Skip, Reverse, Draw Two, Wild and Wild Draw Four. Wild Draw Four is rejected when the player still holds the current color.

## Online privacy and security

Online play uses DaniLabs username/password accounts and private invite-code rooms. UNO opponent hands and the draw pile are redacted from every client response; only the server keeps the full card state. Friends are username-based and there is no public text chat.

Passwords use salted scrypt hashes. Sessions use Secure, HttpOnly, SameSite=Strict cookies. Recovery values are stored hashed. Browser clients never receive the Supabase secret key.

## Production backend

Apply these migrations in order:

1. `supabase/migrations/20260930_online_v38.sql`
2. `supabase/migrations/20260930_online_auth_v39.sql`
3. `supabase/migrations/20260930_ludo_uno_v41.sql`

Configure Vercel server-side variables `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Never place the Supabase secret in browser code or Git history. `/api/online/health` reports whether the production database connection is ready.

## PWA

`sw.js` uses cache `ludo-danilabs-v41`. Navigation is network-first with an offline fallback. Static game assets are cached; `/api/*` is never service-worker cached.

## Tests

Run:

`npm test`

The online-engine tests cover UNO hand privacy and core action rules plus Ludo yard/turn behavior.

## Project structure

```text
api/                    Vercel online API and authoritative game engine
assets/icons/           PWA icons
css/                    Home, Ludo room and card-game styles
js/                     Ludo, UNO, lobby and online clients
supabase/migrations/    Production database migrations
tests/                  Server game-engine tests
index.html              App shell
manifest.json           PWA manifest
sw.js                   Service worker
vercel.json             Production headers/cache policy
```

## v41 audit

v41 removes the weighted-dice/private power system and visible party gameplay, keeps Ludo on one fair core ruleset, upgrades the card game to core UNO-style rules, adds server-authoritative online UNO, hides opponents' online UNO hands, fixes finished-room state delivery, and caches the reference home stylesheet for offline PWA use.
