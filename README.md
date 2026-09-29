# Ludo by DaniLabs

NEW 

Mobile-first offline Ludo for 2-4 friends, built with HTML, CSS and vanilla JavaScript.

## Vercel deployment

Import this repository into Vercel with the project root set to this directory. It is a static site, so leave the framework preset as **Other**, with no build command and no output directory. Vercel serves `index.html` directly; `vercel.json` sets cache headers so the service worker and page can pick up deployments promptly. No environment variables are required.

## Netlify deployment

Import this GitHub repository into Netlify:

- Production branch: `main`
- Build command: leave empty
- Publish directory: `.`
- Base directory: leave empty
- Environment variables: none required

A `netlify.toml` file is included, so Netlify can use the correct static-site publish settings automatically.

## Offline / PWA

The service worker (`ludo-danilabs-v9`) precaches every file on first load, serves assets cache-first with background refresh, and falls back to the cached page when offline. Bump the `V` constant in `sw.js` whenever you deploy changes so installed copies update. PNG icons (including maskable and Apple touch) make installs work on Android and iOS.

## Gameplay

- Roll a 6 to leave the yard; exact roll needed to reach the center.
- Captures, sixes and reaching the center give another turn; three 6s in a row lose the turn.
- House rule (Settings): two of your tokens on one cell can't be captured.
- Play against the computer (Home screen toggle): you are Red, the others are bots that prefer captures, finishing and safe cells.
- Tap the dice or the Roll button to roll; wins are tracked on the home screen; confetti for the winner.
- Sound effects, optional ambient music, vibration and animation speed are in Settings.
- The lobby is designed for offline pass-and-play. Online, profile, social, store and event tiles open a clear Coming soon note; they do not imply those services are active.

## Private controls

There is no public admin button. Tap the DaniLabs logo five times to reach the local credential screen. On first access, the owner creates the username/password.

The private Control Center opens with a compact row of colors. Select a color to configure multiple powers at once, activation taps and strength, plus preferred dice numbers. You can activate powers directly or set secret click rules that count taps on any token: the defaults give the clicked color Maximum Bad Luck after 3 taps on a friend token and give your color all powers after 5 taps on your token. Add, remove, or customize rules in the Click rules tab. Token tap sequences work anywhere on the board.

Good Luck, Bad Luck, Killer and Defender adjust the weighting of legal dice outcomes; they do not create illegal moves or guarantee a win. Preferences and click rules are kept in this browser's local storage. You can export/import a JSON backup from More controls.

## Security

The control panel is entirely client-side/offline. Its local login is a privacy/convenience barrier, not server-grade security.

## Game options (Settings > Game options)

Optional PIN-lock. House rules (leave-yard roll, exact finish, three 6s, capture bonus turn, paired tokens safe, undo), computer difficulty (Easy/Normal/Hard), player names, colorblind palette, stats + backup/import, and "Watch last game" replay.

Visible party modes, announced to every player at game start: wild star dice (pick 1-6), power cards (Shield, Re-roll, Freeze), party events every 10 turns, underdog boost, and per-player helper re-roll. Bump the `V` constant in `sw.js` on each deploy.

## More games and styles

- Ludo styles (home screen): Classic, Quick (2 tokens each), Rush (tokens start on the track).
- Color Cards: an original UNO-style matching card game for 2-4 players, pass-and-play or vs computer. Options: stack +2/+4, 7 swaps hands / 0 passes hands, draw until you can play.
