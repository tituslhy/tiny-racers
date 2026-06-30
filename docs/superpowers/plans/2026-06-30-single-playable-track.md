# Single Playable Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one complete landscape race with direct horizontal steering, automatic progress, a finish state, and immediate replay.

**Architecture:** Keep deterministic gameplay calculations in a small pure TypeScript module and render the whole race in one Phaser scene. The scene owns pointer input, moving road graphics, finish detection, and reset state; runtime-generated shapes keep the game fully offline.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, vite-plugin-pwa

## Global Constraints

- Target children aged 3 and 5: immediate controls, no losing, no frustration.
- Use the fixed 1024×768 landscape canvas with responsive Phaser scaling.
- Use only runtime-generated Phaser graphics; add no downloaded assets.
- Include no collectibles, obstacles, scoring, sounds, track selection, or extra tracks.
- Preserve full offline operation.

---

### Task 1: Pure race behavior

**Files:**
- Create: `src/gameplay.ts`
- Create: `src/gameplay.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `clampCarX(pointerX, roadLeft, roadRight, carHalfWidth): number`
- Produces: `advanceRace(progress, elapsedMs, durationMs): number`
- Produces: `isRaceFinished(progress): boolean`

- [ ] **Step 1: Add Vitest and a `test` script**

Run: `npm install --save-dev vitest`

Set `scripts.test` to `vitest run`.

- [ ] **Step 2: Write failing gameplay tests**

Test that horizontal positions clamp at both road boundaries, progress advances proportionally and caps at `1`, and completion occurs only at `1`.

- [ ] **Step 3: Verify the tests fail for missing exports**

Run: `npm test`

Expected: FAIL because `src/gameplay.ts` does not exist.

- [ ] **Step 4: Add the minimal pure implementations**

Use `Math.min`/`Math.max`, return capped normalized progress, and compare completion with `>= 1`.

- [ ] **Step 5: Verify the gameplay tests pass**

Run: `npm test`

Expected: all gameplay tests pass.

### Task 2: Playable Phaser race

**Files:**
- Create: `src/RaceScene.ts`
- Modify: `src/main.ts`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `clampCarX`, `advanceRace`, and `isRaceFinished` from `src/gameplay.ts`.
- Produces: one `RaceScene` registered in the Phaser game configuration.

- [ ] **Step 1: Register an initially missing scene in `src/main.ts`**

Import `RaceScene` and add `scene: [RaceScene]`; run `npm run build` and confirm it fails because the module is absent.

- [ ] **Step 2: Draw the fixed race environment**

Create a centered charcoal road with white edges, green grass, simple backyard decorations, large moving lane dashes, and a chunky red/yellow toy car built from Phaser shapes.

- [ ] **Step 3: Add direct drag steering**

On pointer down and drag, set only the car's horizontal position through `clampCarX`; do not alter vertical position.

- [ ] **Step 4: Add automatic progress and finish-line movement**

Advance a fixed-duration race from elapsed frame time, scroll/recycle lane markings, reveal a black-and-white finish line near the end, and stop when it reaches the car.

- [ ] **Step 5: Add completion and replay**

Show `Finished!` and a large `Race again` button; disable steering and road movement after finishing; reset progress, markings, finish line, car position, and state on activation.

- [ ] **Step 6: Verify compilation and automated behavior**

Run: `npm test && npm run build`

Expected: tests pass and Vite produces the PWA build.

### Task 3: End-to-end browser verification

**Files:**
- Modify if necessary: `src/RaceScene.ts`
- Modify if necessary: `src/style.css`

**Interfaces:**
- Consumes: the production build from Tasks 1 and 2.
- Produces: verified gameplay at the fixed landscape size and responsive scaling.

- [ ] **Step 1: Start the local app and open it at 1024×768**

Run: `npm run dev -- --host 127.0.0.1`

- [ ] **Step 2: Verify the complete race flow**

Confirm road motion, horizontal steering, road-edge clamping, finish-line arrival, stopped movement, visible completion overlay, and complete reset through `Race again`.

- [ ] **Step 3: Inspect the rendered result and remove visual clutter**

Keep the toy car dominant, controls obvious, copy minimal, and touch targets large.

- [ ] **Step 4: Run final verification**

Run: `npm test && npm run build`

Expected: zero test failures and a successful production build.
