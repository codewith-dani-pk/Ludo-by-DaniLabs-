# Ludo by DaniLabs

Mobile-first offline Ludo for 2-4 friends, built with HTML, CSS and vanilla JavaScript.

## Netlify deployment

Import this GitHub repository into Netlify:

- Production branch: `main`
- Build command: leave empty
- Publish directory: `.`
- Base directory: leave empty
- Environment variables: none required

A `netlify.toml` file is included, so Netlify can use the correct static-site publish settings automatically.

## Offline / PWA

The service worker caches the game after the first successful online load. The manifest enables standalone installation where supported.

## Private controls

There is no public admin button. Tap the DaniLabs logo five times to reach the local credential screen. On first access, the owner creates the username/password.

Each color can use Normal, Good Luck, Bad Luck, Killer or Defender with configurable secret activation taps. The special modes influence ordinary legal Ludo dice/move possibilities and are not labelled on the public game screen.

## Security

The control panel is entirely client-side/offline. Its local login is a privacy/convenience barrier, not server-grade security.
