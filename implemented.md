# Tiny Racers Implementation Record

Last updated: 2026-07-02

This file is the durable handoff record for completed work, decisions, verification, and remaining tasks.

## Repository State

- Current branch: `main`.
- Milestones 3–6 were committed by the user in `1324bbd update milestone 5 tasks` after the initial handoff update.
- Preserve the current completion-review and documentation edits; do not reset, discard, or overwrite earlier milestone work.
- Milestone 5 design commit: `9c715d5 docs: define milestone 5 race results`.
- Milestone 6 design commit: `90b0444 docs: define milestone 6 track selection`.
- The Milestone 5 and Milestone 6 implementation plans are included in `1324bbd`.
- Milestone 3 was implemented directly on `main` at the user's request.
- Commit `5dd0135 add initial code` is the 2026-07-02 stock-take baseline and contains the main application plus the Milestone 3 scene implementation.
- The 2026-07-02 stock take preserved pre-existing `src/RaceScene.test.ts` test-strengthening changes.
- Milestone 3 design commit: `fbe17b4 docs: define milestone 3 collectibles`.
- Milestone 3 plan/record commit: `3120ee5 docs: plan milestone 3 collectibles`.
- Collectible helper commit: `64687b4 feat: add collectible gameplay helpers`.
- A linked worktree was intentionally not created at Milestone 3 implementation start because nearly all application files were untracked at that time and would have been absent from a worktree created from `HEAD`.

## Milestone 1: Project Bootstrap

Implemented before this record was created:

- Vite and TypeScript project setup.
- Phaser game integration.
- `vite-plugin-pwa` service worker and web manifest generation.
- Offline production bundle caching.
- Vitest test runner.

Relevant files:

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.ts`
- `src/style.css`

## Milestone 2: Single Playable Track

Implemented and verified:

- A bright backyard scene with a road, grass, sky, trees, and flowers.
- A player car rendered from simple Phaser shapes.
- Direct horizontal pointer/touch steering.
- Car clamping that keeps the complete rendered car inside the road.
- A fixed 12-second race.
- Road lane movement while racing.
- A finish line that approaches near the end of the race.
- A finished overlay with a large “Race again” button.
- Input and scene updates stop after finishing.
- Replay resets the car, road, race progress, finish line, and overlay.
- Race progress uses the complete frame delta, preserving the intended duration at low frame rates.

Relevant files:

- `src/RaceScene.ts`
- `src/RaceScene.test.ts`
- `src/gameplay.ts`
- `src/gameplay.test.ts`

Milestone 2 verification completed before Milestone 3:

- 9 automated tests passed.
- TypeScript and the Vite production build passed.
- Browser checks covered steering, finish behavior, frozen finished state, replay, responsive scaling, and offline service-worker loading.
- Known non-blocking items: the Phaser production chunk is approximately 1.69 MB minified, and dedicated PWA icons have not been added.

## Milestone 3: Approved Design

Goal: add collectibles and scoring to the existing single playable track.

Approved decisions:

- Use one collectible type: a yellow star placeholder.
- Each star is worth 10 points.
- Use six stars per race.
- Use a fixed, repeatable layout across three reachable road positions.
- Position stars from race progress so movement is deterministic and synchronized with the 12-second race.
- Use simple overlap bounds instead of Phaser physics.
- Collected stars disappear and can score only once.
- Missed stars leave the screen without a penalty.
- Display a large `⭐ 0` score counter near the top of the screen.
- “Race again” resets the score and restores all collectibles.
- Preserve all Milestone 2 finish-line and replay behavior.

Explicitly out of scope:

- obstacles;
- penalties;
- sounds;
- multiple tracks;
- vehicle selection;
- unlocks;
- complex animations;
- score persistence.

Design specification:

- `docs/superpowers/specs/2026-06-30-collectibles-and-scoring-design.md`

Implementation plan:

- `docs/superpowers/plans/2026-06-30-collectibles-and-scoring.md`

Read-only planning audits completed in parallel:

- pure gameplay helper and TDD boundary review;
- `RaceScene` integration and Phaser mock review;
- git/worktree safety review.

## Milestone 3: Implemented

Gameplay helpers in `src/gameplay.ts`:

- deterministic collectible vertical positioning derived from race progress;
- simple centered rectangular overlap detection;
- inclusive edge contact so collection is forgiving for young players;
- no Phaser dependency or unnecessary abstraction in the pure helpers.

Collectibles and scoring in `src/RaceScene.ts`:

- six identical yellow star placeholders;
- fixed spawn timing across three reachable road positions;
- progress-driven movement toward the player's car;
- collection through direct overlap with the car;
- collected stars disappear immediately;
- each star adds exactly 10 points once;
- a large `⭐ 0` score counter at the top of the scene;
- replay resets the score, collectible state, position, and visibility;
- the existing 12-second race, finish line, finished overlay, frozen finished state, and replay flow remain in place;
- no obstacles, penalties, sounds, tracks, vehicles, unlocks, persistence, physics system, or complex animations were added.

Automated coverage in `src/gameplay.test.ts` and `src/RaceScene.test.ts`:

- deterministic collectible movement;
- overlap, separation, and forgiving edge-contact cases;
- the exact six-item layout and three road positions;
- collection, disappearance, +10 scoring, and duplicate-score prevention;
- score-counter creation;
- reset of all six collectibles and the score;
- preserved car clamping and full-delta race progress;
- frozen road, finish line, collectibles, and progress after finishing.

Review results:

- Task 1 helper implementation passed independent spec and quality review with no findings.
- Task 2 scene implementation passed independent spec and quality review with no critical or important findings.
- The documented frame-gap collision concern was reviewed on 2026-07-02. A miss would require an update gap of roughly 962 ms or longer, while Phaser's default timestep smoothing replaces deltas above its 200 ms threshold with recent frame history. No production-code change is warranted unless the game later disables Phaser's timestep smoothing.

Fresh verification on 2026-07-02:

- `npm test`: 2 test files passed, 21 tests passed, 0 failures.
- `npx tsc --noEmit`: passed with no TypeScript errors.
- `npm run build`: passed; Vite generated the production bundle and PWA service worker.
- PWA output precaches 5 entries totaling approximately 1,653.77 KiB.
- The existing non-blocking Vite large-chunk warning remains: the Phaser application bundle is approximately 1,692.21 kB minified and 384.08 kB gzipped.

Browser and PWA audit status:

- The production preview server returned HTTP 200 for the built application.
- The generated HTML registers the web manifest and service worker.
- The generated service worker precaches the application HTML, JavaScript, CSS, manifest, and service-worker registration script, with a navigation fallback to `index.html`.
- The generated manifest requests standalone landscape display.
- The in-app browser connected but stalled during tab discovery and navigation, so a fresh interaction check could not be completed.
- Milestone 3 has not yet received a fresh browser or physical-iPad interaction check.

## Milestone 3 Remaining Work

1. Perform a fresh browser interaction check when the in-app browser backend is available.
2. Test the production PWA on a physical iPad in airplane mode before the flight.
3. No commit was created during the 2026-07-02 stock take; commit the test strengthening, plan status note, and updated record separately if desired.

## Milestone 4: Implemented

Obstacles and penalties in `src/RaceScene.ts`:

- four fixed bright orange obstacle placeholders across three reachable road positions;
- progress-driven obstacle movement on the existing single track;
- forgiving collision through the existing centered-bounds overlap helper;
- a one-time 10-point penalty clamped at zero;
- immediate obstacle deactivation and disappearance after collision;
- brief non-fatal car tilt-and-squash feedback;
- replay reset for all obstacles and the car transform;
- preserved collectibles, score counter, touch steering, race progress, finish line, finished state, and replay flow;
- no sounds, tracks, vehicles, unlocks, health, lives, game over, crash state, physics system, or new dependency.

Automated coverage in `src/RaceScene.test.ts`:

- exact four-obstacle layout and three road positions;
- progress-driven obstacle movement;
- collision, disappearance, one-time score penalty, and zero score floor;
- collision feedback without a race-state change;
- replay reset of every obstacle and the car transform;
- frozen obstacle updates after the race finishes;
- preserved Milestone 2 and Milestone 3 behavior.

Fresh verification on 2026-07-02:

- `npm test`: 2 test files passed, 27 tests passed, 0 failures.
- `npx tsc --noEmit`: passed with no TypeScript errors.
- `npm run build`: passed; Vite generated the production bundle and PWA service worker.
- PWA output precaches 5 entries totaling approximately 1,655.15 KiB.
- The existing non-blocking Vite large-chunk warning remains: the Phaser application bundle is approximately 1,693.61 kB minified and 384.40 kB gzipped.

Milestone 4 still requires a browser interaction check and a physical-iPad airplane-mode test before travel.

## Milestone 5: Implemented

Race completion and scene flow:

- race progress reaching `1` always completes the race successfully;
- active race state is frozen before leaving gameplay;
- the old finish overlay was replaced with a dedicated Phaser results scene;
- the race passes the final score, number of collected items, and number of obstacles hit to the results scene;
- completion does not depend on score and has no failure or game-over branch;
- restarting replaces retained lane-dash references before recreating scene objects;
- the existing finish line, 12-second race, touch steering, collectibles, obstacle penalties, and zero score floor remain in place.

Cheerful results screen in `src/ResultsScene.ts`:

- large `Amazing Driving!` completion message;
- prominent final score;
- collected-item and obstacle-hit totals;
- bright toy-racing colors, large rounded text, and checkered corner details;
- large `Race Again` button that starts a fresh race;
- large `Main Menu` button that opens the placeholder menu;
- simple button press feedback with no complex animation.

Placeholder menu in `src/MenuScene.ts`:

- bright single-screen `Tiny Racers` menu;
- large `Ready to race?` prompt and `Start Race` button;
- no track selection, vehicle selection, or additional menu system;
- the application still starts directly in the race for immediate play.

Automated coverage:

- exact result totals and one-time transition at race completion;
- frozen race updates after completion;
- results headline, score, collected total, and obstacle-hit total;
- replay and main-menu navigation;
- menu rendering and start-race navigation;
- registration of the race, results, and menu scenes;
- preserved Milestone 2–4 gameplay tests.

Fresh verification on 2026-07-02:

- `npm test`: 5 test files passed, 35 tests passed, 0 failures.
- `npx tsc --noEmit`: passed with no TypeScript errors.
- `npm run build`: passed; Vite generated the production bundle and PWA service worker.
- PWA output precaches 5 entries totaling approximately 1,657.51 KiB.
- The existing non-blocking Vite large-chunk warning remains: the Phaser application bundle is approximately 1,696.04 kB minified and 385.11 kB gzipped.

Milestone 5 still requires a browser interaction check and a physical-iPad airplane-mode test before travel.

## Milestone 6: Track Selection and Configuration

Status: implementation, final code/spec review, and browser interaction validation are complete. The physical-iPad airplane-mode check remains a release-readiness task before travel.

Approved design decisions:

- use a dedicated one-tap track selection screen;
- replace the Milestone 5 placeholder menu instead of adding another navigation step;
- support exactly three explicit configurations: Backyard, Forest, and Beach;
- keep a fixed abstract track length of `5,040` and derive race duration from configured speed;
- use emoji text as lightweight collectible and obstacle placeholders;
- pass only `trackId` between selection, race, and results;
- replay the same selected track and return directly to track selection from results;
- add no assets, dependencies, factories, unlocks, vehicles, sounds, gyroscope controls, persistence, backend, or online behavior.

Design and plan:

- committed specification: `docs/superpowers/specs/2026-07-02-track-selection-and-configuration-design.md`;
- implementation plan (included in `1324bbd`): `docs/superpowers/plans/2026-07-02-track-selection-and-configuration.md`.

### Implemented Track Configuration

New `src/tracks.ts` contains the small `TrackId` and `TrackConfig` types, an explicit `TRACKS` record, `TRACK_LENGTH`, `getTrack`, and `raceDurationMs`.

Exact configurations:

| Track | Colors | Road width | Speed | Derived duration | Collectibles | Obstacles |
|---|---|---:|---:|---:|---|---|
| 🌱 Backyard | blue sky, green ground, yellow accent | 504 | 420 px/s | 12.00 s | 🌼 🍌 🦋 | 🧱 🪣 🧹 |
| 🌲 Forest | pale sky, deep green ground, lime accent | 460 | 480 px/s | 10.50 s | 🍄 🐦 🌰 | 🪨 🪵 🌳 |
| 🏖️ Beach | aqua sky, sand ground, coral accent | 440 | 540 px/s | approximately 9.33 s | 🐚 🥥 ⭐ | 🦀 ⚽ 🏰 |

Missing or invalid track IDs fall back to Backyard.

### Implemented Track Selection

New `src/TrackSelectScene.ts`:

- uses scene key `track-select`;
- displays `Choose Your Track!` and three large side-by-side cards;
- shows each track's colors, name, emoji, simple road preview, collectible set, and obstacle set;
- uses each configured accent color for its card border;
- makes each whole card interactive with simple press-scale feedback;
- starts the race immediately with `{ trackId }` after one tap.

The game configuration now starts with:

```ts
[TrackSelectScene, RaceScene, ResultsScene]
```

The Milestone 5 `MenuScene` and its test were removed because track selection replaces that placeholder menu.

### Implemented Configurable Race

`src/RaceScene.ts` now:

- receives `{ trackId }` through `init` and stores the selected `TrackConfig`;
- derives road edges from configured road width;
- keeps the full car inside each selected road when steering;
- derives lane-dash position and movement from road width and configured speed;
- derives race duration from the fixed track length and speed;
- uses normalized lanes (`-0.28`, `0`, `0.28`) so all objects remain reachable on every road width;
- cycles through the selected collectible and obstacle emoji sets;
- preserves six collectibles, four obstacles, progress-driven movement, +10 scoring, -10 penalty, zero score floor, and non-fatal bounce feedback;
- sizes the finish line to the selected road width;
- draws lightweight direct Backyard, Forest, and Beach theme decorations;
- displays the selected track name during the race;
- includes the selected `trackId` in `RaceResults`.

### Implemented Results Flow

`src/ResultsScene.ts` now:

- retains the selected track ID with Backyard fallback;
- keeps the existing cheerful completion message and final totals;
- starts `Race Again` with the same `{ trackId }`;
- replaces `Main Menu` with `Choose Track`;
- returns `Choose Track` directly to `track-select`.

Every race still finishes successfully regardless of score. There is no game over or failure state.

### Milestone 6 TDD and Verification Evidence

Red-green cycles completed:

- track tests first failed because `tracks.ts` did not exist, then 4 tests passed;
- track-selection tests first failed because `TrackSelectScene.ts` did not exist, then 2 tests passed;
- race configuration tests produced 7 expected failures against fixed Backyard behavior, then all 19 `RaceScene` tests passed;
- scene-flow tests produced 5 expected failures for missing track propagation and old menu navigation, then all 23 focused tests passed;
- TypeScript subsequently found three test-double typing issues; those test-only signatures were corrected.

Final automated checks on 2026-07-02:

- `npm test`: 6 test files passed, 42 tests passed, 0 failures.
- `npx tsc --noEmit`: passed with no TypeScript errors.
- `npm run build`: passed; Vite 6.4.3 transformed 10 modules and generated the production bundle and PWA service worker.
- PWA output precaches 5 entries totaling approximately 1,659.35 KiB.
- The existing non-blocking large-chunk warning remains: the application bundle is approximately 1,697.92 kB minified and 385.75 kB gzipped.

Final review and browser validation:

- reviewed the Milestone 6 implementation against the approved specification and plan;
- confirmed Phaser supplies an empty data object when a scene starts without explicit data, so the Backyard fallback remains safe;
- validated all three track cards and their distinct race themes at a 1024×768 landscape viewport;
- validated touch-style horizontal steering to a road edge;
- observed collectible scoring, an obstacle penalty, finish-line completion, and the results totals;
- validated same-track replay and `Choose Track` navigation;
- observed no browser console warnings or errors during the interaction pass;
- `git diff --check` passed.

### Milestone 6 Remaining Release Check

1. Install the production PWA on a physical iPad, launch it in landscape, then cold-launch and play it in airplane mode before travel.

## Constraints

- Frontend only: Vite, TypeScript, Phaser, and `vite-plugin-pwa`.
- The game must work entirely offline on an iPad.
- Keep controls and feedback understandable for children aged 3 and 5.
- Do not add dependencies or unnecessary abstractions.
- Do not commit, discard, or rewrite unrelated user changes.
