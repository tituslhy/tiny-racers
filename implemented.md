# Tiny Racers Implementation Record

Last updated: 2026-06-30

This file is the durable handoff record for completed work, decisions, verification, and remaining tasks.

## Repository State

- Milestone 3 is being implemented directly on `main` at the user's request. The branch was ahead of `origin/main` before implementation began.
- The repository contains many pre-existing untracked project files. They belong to the user and must not be removed or overwritten wholesale.
- No Milestone 3 production code has been written yet.
- Milestone 3 design commit: `fbe17b4 docs: define milestone 3 collectibles`.
- A linked worktree was intentionally not created because nearly all existing application files are untracked and would be absent from a worktree created from `HEAD`.

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

## Milestone 3 Remaining Work

1. Write and self-review the detailed implementation plan.
2. Create or verify an isolated development branch/worktree without losing the existing untracked project files.
3. Implement collectible position and collision helpers using red-green TDD.
4. Add collectible rendering, movement, collection, scoring, and replay reset to `RaceScene` using red-green TDD.
5. Preserve and regression-test the Milestone 2 finish behavior.
6. Run the full test suite, explicit TypeScript typecheck, and production build.
7. Review the final diff for scope, correctness, and simplicity.

## Constraints

- Frontend only: Vite, TypeScript, Phaser, and `vite-plugin-pwa`.
- The game must work entirely offline on an iPad.
- Keep controls and feedback understandable for children aged 3 and 5.
- Do not add dependencies or unnecessary abstractions for Milestone 3.
- Do not commit, discard, or rewrite unrelated user changes.
