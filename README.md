# Ludo by DaniLabs — v40

Mobile-first Ludo built with plain HTML, CSS and vanilla JavaScript, deployed from GitHub to Vercel.

## Play

- Local pass-and-play for 2, 3 or 4 players, with optional computer opponents.
- Classic, Quick and Rush variants plus optional Party features.
- Save/continue, undo, rankings, rematch, replay, local stats, profile, cosmetic coins and Collection.
- Separate Color Cards game and installable offline-first PWA.

## Online

Online play uses DaniLabs username/password accounts and private invite-code rooms. Dice rolls, legal moves and turn ownership are server-authoritative. Friends are username-based and there is no public text chat. Passwords use salted scrypt hashes; sessions use Secure, HttpOnly, SameSite=Strict cookies; recovery values are stored hashed. Local-only controls do not affect online match results.

## Production backend

Apply `supabase/migrations/20260930_online_v38.sql` and then `supabase/migrations/20260930_online_auth_v39.sql`.

Configure Vercel server-side variables `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Never place the Supabase secret in browser code or Git history. `/api/online/health` reports whether the production database connection is ready.

## PWA

`sw.js` uses cache `ludo-danilabs-v40`. Navigation is network-first with an offline fallback. Static assets use cached responses with background refresh; `/api/*` is never service-worker cached.

## Project structure

```text
api/                    Vercel online API
assets/icons/           PWA icons
css/                    App and game-room styles
js/                     Ludo, lobby, online and Color Cards clients
supabase/migrations/    Production database migrations
index.html              App shell
manifest.json           PWA manifest
sw.js                   Service worker
vercel.json             Production headers/cache policy
```

## v40 audit

v40 separates online/local lifecycle state, restores local names after online play, fixes online turn ownership messaging, preserves saved Game Options across reloads, improves service-worker failure handling, removes obsolete online configuration and adds browser-security headers. The server-side Ludo engine was stress-checked across randomized 2/3/4-player Classic, Quick and Rush matches.

Production online play still requires the two Supabase environment variables above.
