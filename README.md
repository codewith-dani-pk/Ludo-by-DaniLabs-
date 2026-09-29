# Ludo by DaniLabs

Mobile-first offline Ludo for 2-4 friends, built with HTML, CSS and vanilla JavaScript.

## Netlify
Import this GitHub repository into Netlify.

- Build command: leave empty
- Publish directory: `.
- Production branch: `main`

No framework or environment variables are required.

## Offline / PWA
The service worker caches the game after the first successful online load. The manifest enables standalone installation where supported.

## Private controls
There is no public admin button. The private local control center is opened through the DaniLabs logo gesture and local credentials. Special color modes operate through normal legal Ludo dice/moves and are not labelled on the public game screen.

## Security
The control panel is entirely client-side/offline. Its local login is a privacy barrier, not server-grade security.
