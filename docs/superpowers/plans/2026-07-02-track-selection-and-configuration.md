# Milestone 6 Track Selection and Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-tap selection for Backyard, Forest, and Beach and run the existing race from small explicit track configurations.

**Architecture:** Put the three data-only configurations and fixed-length duration helper in `tracks.ts`. Replace the placeholder menu with a dedicated `TrackSelectScene`; pass only `trackId` between selection, race, and results, and keep the selected `TrackConfig` directly in `RaceScene`.

**Tech Stack:** TypeScript 6, Phaser 4, Vitest 4, Vite 6

## Global Constraints

- Preserve the user's existing uncommitted Milestone 3–5 changes.
- Keep all configuration local, explicit, dependency-free, and limited to the three requested tracks.
- Preserve touch steering, collectibles, obstacles, scoring, finish line, results, replay, and guaranteed completion.
- Add no external assets, unlocks, vehicles, sounds, gyroscope controls, persistence, backend, or online behavior.
- Keep track selection to one large tap suitable for children aged 3 and 5.

---

### Task 1: Explicit Track Configuration

**Files:**
- Create: `src/tracks.ts`
- Create: `src/tracks.test.ts`

**Interfaces:**
- Produces: `TrackId`, `TrackConfig`, `TRACKS`, `TRACK_LENGTH`, `getTrack(trackId?: string)`, and `raceDurationMs(speed)`.

- [x] **Step 1: Write failing configuration tests**

Test that the record contains exactly `backyard`, `forest`, and `beach`; assert every exact name, road width, speed, collectible set, and obstacle set from the spec. Verify invalid/missing IDs return Backyard and durations are 12,000 ms, 10,500 ms, and approximately 9,333.33 ms.

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/tracks.test.ts`

Expected: FAIL because `tracks.ts` does not exist.

- [x] **Step 3: Implement the minimal configuration module**

Create the exact `TrackId` and `TrackConfig` types from the spec, `TRACK_LENGTH = 5_040`, one explicit `TRACKS` object, and:

```ts
export function getTrack(trackId?: string): TrackConfig {
  return TRACKS[trackId as TrackId] ?? TRACKS.backyard
}

export function raceDurationMs(speed: number): number {
  return (TRACK_LENGTH / speed) * 1000
}
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/tracks.test.ts`

Expected: all track configuration tests pass.

### Task 2: One-Tap Track Selection

**Files:**
- Create: `src/TrackSelectScene.ts`
- Create: `src/TrackSelectScene.test.ts`
- Delete: `src/MenuScene.ts`
- Delete: `src/MenuScene.test.ts`

**Interfaces:**
- Consumes: `TRACKS` and `TrackId`.
- Produces: scene key `track-select`; each card calls `scene.start('race', { trackId })`.

- [x] **Step 1: Write failing selection tests**

Use Phaser display-object doubles to verify the screen renders `Choose Your Track!`, `🌱 Backyard`, `🌲 Forest`, and `🏖️ Beach`; verify there are exactly three interactive cards and tapping each sends its matching ID to `race`.

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/TrackSelectScene.test.ts`

Expected: FAIL because `TrackSelectScene.ts` does not exist.

- [x] **Step 3: Implement the selection scene**

Render a bright heading and three 280×430 cards across the landscape screen. Each card uses its config colors, large emoji/name text, its collectible and obstacle emoji rows, and whole-card pointer feedback. Keep the click handler direct:

```ts
button.on('pointerup', () => this.scene.start('race', { trackId: track.id }))
```

Remove the obsolete placeholder menu and its tests.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/TrackSelectScene.test.ts`

Expected: all selection tests pass.

### Task 3: Configure the Existing Race

**Files:**
- Modify: `src/RaceScene.ts`
- Modify: `src/RaceScene.test.ts`

**Interfaces:**
- Consumes: `TrackConfig`, `TrackId`, `getTrack`, and `raceDurationMs`.
- Produces: `init({ trackId?: string }): void`, dynamic road bounds, normalized lanes, track placeholder sets, themed background, configured speed, and configured duration.

- [x] **Step 1: Write failing race-configuration tests**

Extend the testable scene with `track`, `roadLeft`, `roadRight`, `init`, and any focused rendering methods. Verify:

- Beach initializes with road bounds `292` and `732`;
- steering clamps the complete car inside those bounds;
- collectible and obstacle creation cycle through the selected emoji sets;
- all normalized object x-positions lie inside the selected road;
- `update` advances progress using `raceDurationMs(track.speed)`;
- lane movement uses `track.speed`;
- finish-line tiles fit the configured width.

- [x] **Step 2: Run the focused race tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `RaceScene` still uses fixed Backyard constants and shape placeholders.

- [x] **Step 3: Implement configuration-driven race behavior**

Add a default Backyard `track` field and `init` lookup. Replace fixed road edges and speed/duration constants with values derived from `track`. Replace layout x-values with `lane: -0.28 | 0 | 0.28` and compute:

```ts
const x = ROAD_CENTER + lane * this.track.roadWidth
```

Render collectibles and obstacles with `this.add.text` using the configured emoji arrays, retaining the existing collision sizes and one-time state. Draw shared sky/ground colors and a direct three-case decoration switch. Size road, borders, dashes, finish line, steering, and reset positions from selected road width.

- [x] **Step 4: Run the focused race tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all `RaceScene` tests pass.

### Task 4: Preserve Track Through Results and Register Startup

**Files:**
- Modify: `src/RaceScene.ts`
- Modify: `src/RaceScene.test.ts`
- Modify: `src/ResultsScene.ts`
- Modify: `src/ResultsScene.test.ts`
- Modify: `src/main.ts`
- Modify: `src/main.test.ts`

**Interfaces:**
- Changes: `RaceResults` gains `trackId: TrackId`.
- Changes: replay calls `scene.start('race', { trackId })`.
- Changes: secondary result action is `Choose Track` → `track-select`.
- Changes: game scenes become `[TrackSelectScene, RaceScene, ResultsScene]`.

- [x] **Step 1: Write failing flow tests**

Verify race completion includes the selected track ID; results replay passes that ID; the second button renders `Choose Track` and starts `track-select`; game configuration starts with `TrackSelectScene`.

- [x] **Step 2: Run the focused flow tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts src/ResultsScene.test.ts src/main.test.ts`

Expected: FAIL on missing track ID, old menu action, and old registration order.

- [x] **Step 3: Implement track-preserving scene flow**

Add `trackId` to results data, store it safely with Backyard fallback in `ResultsScene.init`, pass it on replay, replace `Main Menu` with `Choose Track`, and register/import `TrackSelectScene` first in `main.ts`.

- [x] **Step 4: Run the focused flow tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts src/ResultsScene.test.ts src/main.test.ts`

Expected: all focused flow tests pass.

### Task 5: Documentation and Final Verification

**Files:**
- Modify: `implemented.md`

**Interfaces:**
- Produces: durable Milestone 6 implementation and verification record.

- [x] **Step 1: Run the complete suite**

Run: `npm test`

Expected: every test passes with zero failures.

- [x] **Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`

Expected: exit code `0` with no errors.

- [x] **Step 3: Build the production PWA**

Run: `npm run build`

Expected: exit code `0`, generated app bundle, manifest, and service worker; the existing size warning remains non-blocking.

- [x] **Step 4: Update the implementation record**

Append exact Milestone 6 track values, scene flow, preserved behavior, test count, typecheck/build results, and remaining browser/iPad checks to `implemented.md`.

- [x] **Step 5: Review scope and whitespace**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only intended Milestone 6 files plus preserved prior uncommitted work.
