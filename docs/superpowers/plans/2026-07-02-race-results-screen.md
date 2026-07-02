# Milestone 5 Race Results Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End every race successfully and show a dedicated, cheerful results screen with the final score, collected-item count, obstacle-hit count, replay, and main-menu navigation.

**Architecture:** Keep gameplay and result aggregation in `RaceScene`, then pass a small `RaceResults` object to a dedicated `ResultsScene`. Add a minimal `MenuScene` for the return path, register all three scenes in Phaser, and use direct scene starts with no router or generalized UI abstraction.

**Tech Stack:** TypeScript 6, Phaser 4, Vitest 4, Vite 6

## Global Constraints

- Frontend only; add no dependency, backend, network call, or persistence.
- The existing single 12-second race always completes at progress `1`, regardless of score.
- Preserve touch steering, collectibles, obstacle penalties, finish-line movement, offline behavior, and score clamping at zero.
- Use bright colors, large readable text, and large touch targets suitable for children aged 3 and 5.
- Add no tracks, track selection, vehicles, sounds, rankings, timers, complex animation, online functionality, game over, or failure state.
- Preserve all pre-existing uncommitted Milestone 3–4 changes.

---

### Task 1: Race Completion Data and Results Transition

**Files:**
- Modify: `src/RaceScene.test.ts`
- Modify: `src/RaceScene.ts`

**Interfaces:**
- Produces: exported `RaceResults` with `score`, `collected`, and `obstaclesHit` numeric fields.
- Produces: `finishRace(): void`, which freezes gameplay and calls `this.scene.start('results', results)` once.
- Removes: the old `finishOverlay` and its `Race again` button.

- [ ] **Step 1: Write failing finish-transition tests**

Extend the test scene type with:

```ts
scene: { start(key: string, data?: RaceResults): void }
finishRace(): void
```

Replace the overlay assertion in the existing finish test and add a direct aggregation test:

```ts
const stubSprite = () => ({
  setPosition: vi.fn(),
  setVisible: vi.fn(),
})

it('starts the results scene with the final race totals', () => {
  const race = createTestScene()
  race.state = 'racing'
  race.score = 30
  race.scene = { start: vi.fn() }
  race.collectibles = [
    { x: 0, spawnProgress: 0, sprite: stubSprite(), collected: true },
    { x: 0, spawnProgress: 0, sprite: stubSprite(), collected: false },
  ]
  race.obstacles = [
    { x: 0, spawnProgress: 0, sprite: stubSprite(), hit: true },
    { x: 0, spawnProgress: 0, sprite: stubSprite(), hit: false },
  ]

  race.finishRace()
  race.finishRace()

  expect(race.state).toBe('finished')
  expect(race.scene.start).toHaveBeenCalledTimes(1)
  expect(race.scene.start).toHaveBeenCalledWith('results', {
    score: 30,
    collected: 1,
    obstaclesHit: 1,
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `finishRace()` still displays the overlay and does not start `ResultsScene` with totals.

- [ ] **Step 3: Implement the minimal transition**

Export the shared data type from `RaceScene.ts`:

```ts
export interface RaceResults {
  score: number
  collected: number
  obstaclesHit: number
}
```

Remove `finishOverlay`, `createFinishOverlay()`, and all overlay reset behavior. Implement:

```ts
private finishRace(): void {
  if (this.state === 'finished') return
  this.state = 'finished'
  this.scene.start('results', {
    score: this.score,
    collected: this.collectibles.filter(({ collected }) => collected).length,
    obstaclesHit: this.obstacles.filter(({ hit }) => hit).length,
  } satisfies RaceResults)
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all `RaceScene` tests pass.

### Task 2: Dedicated Results Scene

**Files:**
- Create: `src/ResultsScene.ts`
- Create: `src/ResultsScene.test.ts`

**Interfaces:**
- Consumes: `RaceResults` from `RaceScene.ts` through `init(data: RaceResults): void`.
- Produces: a `results` Phaser scene with `Race Again` → `race` and `Main Menu` → `menu`.

- [ ] **Step 1: Write failing rendering and navigation tests**

Mock Phaser's `Scene`, provide `add.rectangle`, `add.circle`, `add.text`, and `add.container` test doubles, then verify:

```ts
it('shows the completion message and all final totals', () => {
  const scene = createResultsScene()
  scene.init({ score: 30, collected: 4, obstaclesHit: 2 })
  scene.create()

  expect(textValues()).toEqual(expect.arrayContaining([
    'Amazing Driving!',
    'Score: 30',
    'Collected: 4 items',
    'Obstacles Hit: 2',
    'Race Again',
    'Main Menu',
  ]))
})

it('starts a fresh race from the replay button', () => {
  scene.create()
  pressButtonWithLabel('Race Again')
  expect(scene.scene.start).toHaveBeenCalledWith('race')
})

it('opens the main menu from the menu button', () => {
  scene.create()
  pressButtonWithLabel('Main Menu')
  expect(scene.scene.start).toHaveBeenCalledWith('menu')
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/ResultsScene.test.ts`

Expected: FAIL because `ResultsScene.ts` does not exist.

- [ ] **Step 3: Implement the cheerful results scene**

Create `ResultsScene extends Phaser.Scene` with key `results`, store safe numeric defaults in `init`, and render:

- sky-blue background and simple decorative circles;
- white 700×650 panel with a thick yellow border;
- centered `Amazing Driving!` headline;
- prominent `Score: N` text;
- `Collected: N items` and `Obstacles Hit: N` text;
- two 420×88 interactive buttons with press-scale feedback.

Keep a small private `createButton(y, label, color, onPress)` helper inside the scene so button behavior is consistent without creating a generalized component system.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/ResultsScene.test.ts`

Expected: all `ResultsScene` tests pass.

### Task 3: Placeholder Main Menu and Scene Registration

**Files:**
- Create: `src/MenuScene.ts`
- Create: `src/MenuScene.test.ts`
- Create: `src/main.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces: a `menu` Phaser scene with one `Start Race` action.
- Produces: exported `gameConfig: Phaser.Types.Core.GameConfig` for direct configuration testing.
- Changes game configuration from `[RaceScene]` to `[RaceScene, ResultsScene, MenuScene]`, preserving direct race startup because `RaceScene` remains first.

- [ ] **Step 1: Write failing menu and registration tests**

Verify the menu renders `Tiny Racers`, `Ready to race?`, and `Start Race`, and that pressing the button calls:

```ts
expect(scene.scene.start).toHaveBeenCalledWith('race')
```

Import the exported `gameConfig` in `main.test.ts` and verify it contains:

```ts
scene: [RaceScene, ResultsScene, MenuScene]
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/MenuScene.test.ts src/main.test.ts`

Expected: FAIL because the menu scene and three-scene registration do not exist.

- [ ] **Step 3: Implement the menu and register all scenes**

Create `MenuScene extends Phaser.Scene` with key `menu`, bright shapes, large title/prompt text, and one 440×110 `Start Race` button using the same simple press-scale interaction. Import `ResultsScene` and `MenuScene` in `main.ts`, export the existing configuration as `gameConfig`, then set:

```ts
export const gameConfig: Phaser.Types.Core.GameConfig = {
  // Preserve the existing renderer, parent, background, and scale fields.
  scene: [RaceScene, ResultsScene, MenuScene],
}

new Phaser.Game(gameConfig)
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- src/MenuScene.test.ts src/main.test.ts`

Expected: all menu and configuration tests pass.

### Task 4: Documentation and Full Verification

**Files:**
- Modify: `implemented.md`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: durable Milestone 5 implementation and verification record.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: every test file and test passes with zero failures.

- [ ] **Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`

Expected: exit code `0` with no TypeScript errors.

- [ ] **Step 3: Build the production PWA**

Run: `npm run build`

Expected: exit code `0`; Vite emits the application bundle, manifest, and service worker. The existing large-chunk warning is non-blocking.

- [ ] **Step 4: Update the implementation record**

Append a Milestone 5 section to `implemented.md` listing the scene flow, displayed totals, navigation buttons, preserved behavior, explicit exclusions, exact test count, typecheck result, build result, and any remaining browser/iPad checks.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only the intended Milestone 5 files plus the pre-existing Milestone 3–4 modifications are present.
