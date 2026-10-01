# Cleanup report

Recovery checkpoint: `checkpoint/pre-polish-2be10041`.

## Removed
- No uncertain files were deleted. The previously referenced legacy `js/themes.js` is already absent from the current branch and is not loaded by the live page.

## Replaced / consolidated
- Duplicated quick-settings behavior → one persistent global settings model in `js/app.js` and the Settings modal.
- Hard-coded homepage availability → `data/game-catalog.json`, where only tested games/modes are marked available.
- Stale Ludo finish-state UI checks (56) → canonical shared-engine finish progress 57.
- Service-worker cache → v46 including shared rule engines, supplied royal assets, catalog and final polish CSS.
- Color Cards saved-state loading → validated through the shared rules engine before resume.

## Intentionally retained
Supabase migrations and online auth/data files are deployment history/backend state and were not deleted. Supplied royal artwork/atlases are reusable assets. Referenced CSS layers remain until visual regression testing proves consolidation safe.

## Availability policy
Classic Ludo and Color Cards are playable. Private online rooms use the real backend. Quick Match and Team Up remain unavailable until separate rules are implemented and tested. Carrom, Chess and Snakes & Ladders remain Coming Soon. Rewards/shop/event surfaces are explicitly demonstrations; they do not grant real currency or make purchases.
