# Collectibles and Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six collectible star placeholders and a score counter to the existing 12-second single-track race.

**Architecture:** Keep deterministic positioning and center-based overlap calculations as two pure helpers in `src/gameplay.ts`. Keep the fixed star layout, Phaser display objects, collected state, score, and replay reset inside `RaceScene`; no physics system, persistence, or new dependency is needed.

**Tech Stack:** TypeScript 6, Phaser 4, Vitest 4, Vite 6

**Implementation status (audited 2026-07-02):** Tasks 1 and 2 are fully implemented. Task 3 verification and the durable record are current; only the final record commit remains. The unchecked step boxes below are the original execution script, not an indication of missing production behavior.

## Global Constraints

- Use one collectible type: a yellow star placeholder.
- Create exactly six stars per race; each is worth exactly 10 points.
- Use a fixed, repeatable layout across three reachable road positions.
- Position stars from race progress so movement stays synchronized with the fixed 12-second race.
- Collected stars disappear and can score only once.
- Missed stars leave the screen without a penalty.
- Display a large `⭐ 0` score counter near the top of the screen.
- “Race again” resets the score and restores all six collectibles.
- Preserve the Milestone 2 finish line, finished overlay, frozen finished state, and replay behavior.
- Do not add obstacles, penalties, sounds, multiple tracks, vehicle selection, unlocks, complex animations, score persistence, dependencies, or Phaser physics.

---

### Task 1: Deterministic collectible gameplay helpers

**Files:**
- Modify: `src/gameplay.ts`
- Modify: `src/gameplay.test.ts`

**Interfaces:**
- Produces: `collectibleY(progress: number, spawnProgress: number, startY: number, endY: number, travelProgress: number): number`
- Produces: `CenteredBounds` with `x`, `y`, `halfWidth`, and `halfHeight` numeric fields
- Produces: `centeredBoundsOverlap(first: CenteredBounds, second: CenteredBounds): boolean`

- [ ] **Step 1: Write failing deterministic-position tests**

Add this import and suite to `src/gameplay.test.ts`:

```ts
import {
  advanceRace,
  clampCarX,
  collectibleY,
  isRaceFinished,
} from './gameplay'

describe('collectibleY', () => {
  it('places a collectible at its start position when it spawns', () => {
    expect(collectibleY(0.25, 0.25, -50, 818, 0.3)).toBe(-50)
  })

  it('moves a collectible according to race progress', () => {
    expect(collectibleY(0.4, 0.25, -50, 818, 0.3)).toBeCloseTo(384)
  })
})
```

- [ ] **Step 2: Run the position tests and verify RED**

Run: `npm test -- src/gameplay.test.ts`

Expected: FAIL because `collectibleY` is not exported from `src/gameplay.ts`.

- [ ] **Step 3: Implement the position helper**

Add to `src/gameplay.ts`:

```ts
export function collectibleY(
  progress: number,
  spawnProgress: number,
  startY: number,
  endY: number,
  travelProgress: number,
): number {
  const travelled = (progress - spawnProgress) / travelProgress
  return startY + travelled * (endY - startY)
}
```

- [ ] **Step 4: Run the position tests and verify GREEN**

Run: `npm test -- src/gameplay.test.ts`

Expected: all tests in `src/gameplay.test.ts` pass.

- [ ] **Step 5: Write failing overlap tests**

Add `centeredBoundsOverlap` to the existing import from `./gameplay`, then add to `src/gameplay.test.ts`:

```ts
describe('centeredBoundsOverlap', () => {
  const car = { x: 512, y: 620, halfWidth: 65, halfHeight: 88 }

  it('detects a collectible inside the car bounds', () => {
    const star = { x: 540, y: 650, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(true)
  })

  it('does not detect a horizontally separated collectible', () => {
    const star = { x: 700, y: 620, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(false)
  })

  it('does not detect a vertically separated collectible', () => {
    const star = { x: 512, y: 400, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(false)
  })

  it('counts touching edges as a forgiving collection', () => {
    const star = { x: 605, y: 620, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(true)
  })
})
```

- [ ] **Step 6: Run the overlap tests and verify RED**

Run: `npm test -- src/gameplay.test.ts`

Expected: FAIL because `centeredBoundsOverlap` and `CenteredBounds` do not exist.

- [ ] **Step 7: Implement the overlap helper**

Add to `src/gameplay.ts`:

```ts
export interface CenteredBounds {
  x: number
  y: number
  halfWidth: number
  halfHeight: number
}

export function centeredBoundsOverlap(
  first: CenteredBounds,
  second: CenteredBounds,
): boolean {
  return (
    Math.abs(first.x - second.x) <= first.halfWidth + second.halfWidth &&
    Math.abs(first.y - second.y) <= first.halfHeight + second.halfHeight
  )
}
```

- [ ] **Step 8: Run the helper tests and verify GREEN**

Run: `npm test -- src/gameplay.test.ts`

Expected: all tests in `src/gameplay.test.ts` pass.

- [ ] **Step 9: Commit Task 1**

```bash
git add src/gameplay.ts src/gameplay.test.ts
git commit -m "feat: add collectible gameplay helpers"
```

---

### Task 2: Collectible rendering, scoring, and replay reset

**Files:**
- Modify: `src/RaceScene.ts`
- Modify: `src/RaceScene.test.ts`

**Interfaces:**
- Consumes: `collectibleY(...)` and `centeredBoundsOverlap(...)` from Task 1
- Produces: six fixed `Collectible` scene records with `x`, `spawnProgress`, `sprite`, and `collected`
- Produces: `updateCollectibles(): void` and `resetCollectibles(): void` scene methods

- [ ] **Step 1: Write failing scene tests for layout and movement**

Extend the test-only `TestableRaceScene` type in `src/RaceScene.test.ts` with the collectible fields and private-method signatures. Add display fakes supporting `setPosition`, `setVisible`, and `setStrokeStyle`. Then add:

```ts
it('creates exactly six collectible stars', () => {
  const scene = createTestScene()
  const star = () => ({ setStrokeStyle: vi.fn(), setPosition: vi.fn(), setVisible: vi.fn() })
  const addStar = vi.fn(star)
  scene.add = { star: addStar } as TestableRaceScene['add']

  scene.createCollectibles()

  expect(addStar).toHaveBeenCalledTimes(6)
  expect(scene.collectibles).toHaveLength(6)
})

it('moves an active collectible down the road as race progress increases', () => {
  const scene = createTestScene()
  const sprite = { y: -50, setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }), setVisible: vi.fn() }
  scene.progress = 0.1
  scene.car = { x: 700, y: 620 }
  scene.scoreText = { setText: vi.fn() }
  scene.collectibles = [{ x: 372, spawnProgress: 0.02, sprite, collected: false }]

  scene.updateCollectibles()
  const firstY = sprite.y
  scene.progress = 0.2
  scene.updateCollectibles()

  expect(sprite.y).toBeGreaterThan(firstY)
})
```

- [ ] **Step 2: Run the layout/movement tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because the collectible state and methods do not exist.

- [ ] **Step 3: Add collectible constants, state, creation, and movement**

In `src/RaceScene.ts`:

```ts
import {
  advanceRace,
  centeredBoundsOverlap,
  clampCarX,
  collectibleY,
  isRaceFinished,
} from './gameplay'

const CAR_HALF_HEIGHT = 88
const COLLECTIBLE_RADIUS = 28
const COLLECTIBLE_START_Y = -50
const COLLECTIBLE_END_Y = HEIGHT + 50
const COLLECTIBLE_TRAVEL_PROGRESS = 0.3
const COLLECTIBLE_SCORE = 10

const COLLECTIBLE_LAYOUT = [
  { x: ROAD_CENTER - 140, spawnProgress: 0.02 },
  { x: ROAD_CENTER + 140, spawnProgress: 0.14 },
  { x: ROAD_CENTER, spawnProgress: 0.26 },
  { x: ROAD_CENTER + 140, spawnProgress: 0.38 },
  { x: ROAD_CENTER - 140, spawnProgress: 0.5 },
  { x: ROAD_CENTER, spawnProgress: 0.62 },
] as const

interface Collectible {
  x: number
  spawnProgress: number
  sprite: Phaser.GameObjects.Star
  collected: boolean
}
```

Add scene fields:

```ts
private score = 0
private scoreText!: Phaser.GameObjects.Text
private collectibles: Collectible[] = []
```

Add methods:

```ts
private createCollectibles(): void {
  this.collectibles = COLLECTIBLE_LAYOUT.map(({ x, spawnProgress }) => {
    const sprite = this.add.star(
      x,
      COLLECTIBLE_START_Y,
      5,
      13,
      COLLECTIBLE_RADIUS,
      COLORS.yellow,
    )
    sprite.setStrokeStyle(5, COLORS.white)
    sprite.setVisible(false)
    return { x, spawnProgress, sprite, collected: false }
  })
}

private updateCollectibles(): void {
  for (const collectible of this.collectibles) {
    if (collectible.collected) continue

    const y = collectibleY(
      this.progress,
      collectible.spawnProgress,
      COLLECTIBLE_START_Y,
      COLLECTIBLE_END_Y,
      COLLECTIBLE_TRAVEL_PROGRESS,
    )
    const visible = this.progress >= collectible.spawnProgress && y <= COLLECTIBLE_END_Y
    collectible.sprite.setPosition(collectible.x, y)
    collectible.sprite.setVisible(visible)
  }
}
```

Call `createCollectibles()` after `createLaneDashes()` and before creating the car. Call `updateCollectibles()` in `update()` after `positionFinishLine()` and before the finish check.

- [ ] **Step 4: Run the layout/movement tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: the new layout/movement tests and existing scene tests pass.

- [ ] **Step 5: Write failing collection and duplicate-score tests**

Add to `src/RaceScene.test.ts`:

```ts
it('hides a collected star and adds ten points only once', () => {
  const scene = createTestScene()
  const y = 620
  const sprite = { setPosition: vi.fn(), setVisible: vi.fn() }
  scene.progress = 0.02 + ((y + 50) / 868) * 0.3
  scene.car = { x: 512, y }
  scene.score = 0
  scene.scoreText = { setText: vi.fn() }
  scene.collectibles = [{ x: 512, spawnProgress: 0.02, sprite, collected: false }]

  scene.updateCollectibles()
  scene.updateCollectibles()

  expect(scene.collectibles[0].collected).toBe(true)
  expect(sprite.setVisible).toHaveBeenLastCalledWith(false)
  expect(scene.score).toBe(10)
  expect(scene.scoreText.setText).toHaveBeenCalledTimes(1)
  expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 10')
})
```

- [ ] **Step 6: Run the collection test and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `updateCollectibles()` positions the star but does not collect it or change the score.

- [ ] **Step 7: Implement collection and one-time scoring**

Add this branch immediately after `collectible.sprite.setVisible(visible)` inside `updateCollectibles()`:

```ts
if (
  visible &&
  centeredBoundsOverlap(
    { x: this.car.x, y: this.car.y, halfWidth: CAR_HALF_WIDTH, halfHeight: CAR_HALF_HEIGHT },
    { x: collectible.x, y, halfWidth: COLLECTIBLE_RADIUS, halfHeight: COLLECTIBLE_RADIUS },
  )
) {
  collectible.collected = true
  collectible.sprite.setVisible(false)
  this.score += COLLECTIBLE_SCORE
  this.scoreText.setText(`⭐ ${this.score}`)
}
```

- [ ] **Step 8: Run the collection test and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: the collection test passes, with one score update after two collision checks.

- [ ] **Step 9: Write failing score-counter and reset tests**

Add these tests to `src/RaceScene.test.ts`:

```ts
it('creates a large score counter with an initial zero score', () => {
  const scene = createTestScene()
  const counter = { setOrigin: vi.fn(), setDepth: vi.fn() }
  const addText = vi.fn(() => counter)
  scene.add = { text: addText } as TestableRaceScene['add']

  const result = scene.createScoreCounter()

  expect(addText).toHaveBeenCalledWith(
    990,
    54,
    '⭐ 0',
    expect.objectContaining({ fontSize: '46px', fontStyle: 'bold' }),
  )
  expect(counter.setOrigin).toHaveBeenCalledWith(1, 0.5)
  expect(counter.setDepth).toHaveBeenCalledWith(20)
  expect(result).toBe(counter)
})

it('resets the score and restores every collectible', () => {
  const scene = createTestScene()
  const firstSprite = { setPosition: vi.fn(), setVisible: vi.fn() }
  const secondSprite = { setPosition: vi.fn(), setVisible: vi.fn() }
  scene.score = 20
  scene.scoreText = { setText: vi.fn() }
  scene.collectibles = [
    { x: 372, spawnProgress: 0.02, sprite: firstSprite, collected: true },
    { x: 652, spawnProgress: 0.14, sprite: secondSprite, collected: true },
  ]

  scene.resetCollectibles()

  expect(scene.score).toBe(0)
  expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 0')
  expect(scene.collectibles.every((item) => !item.collected)).toBe(true)
  expect(firstSprite.setVisible).toHaveBeenCalledWith(false)
  expect(secondSprite.setVisible).toHaveBeenCalledWith(false)
})
```

- [ ] **Step 10: Run the counter/reset tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `createScoreCounter` and `resetCollectibles` do not exist.

- [ ] **Step 11: Implement the score counter and reset**

Add to `src/RaceScene.ts`:

```ts
private createScoreCounter(): Phaser.GameObjects.Text {
  const counter = this.add.text(WIDTH - 34, 54, '⭐ 0', {
    color: '#18243b',
    fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
    fontSize: '46px',
    fontStyle: 'bold',
    stroke: '#fff8e7',
    strokeThickness: 7,
  })
  counter.setOrigin(1, 0.5)
  counter.setDepth(20)
  return counter
}

private resetCollectibles(): void {
  this.score = 0
  this.scoreText.setText('⭐ 0')
  for (const collectible of this.collectibles) {
    collectible.collected = false
    collectible.sprite.setPosition(collectible.x, COLLECTIBLE_START_Y)
    collectible.sprite.setVisible(false)
  }
}
```

Assign `this.scoreText = this.createScoreCounter()` in `create()` after the car exists. Call `this.resetCollectibles()` from `resetRace()`.

- [ ] **Step 12: Run the counter/reset tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all tests in `src/RaceScene.test.ts` pass.

- [ ] **Step 13: Add a finish-state regression test**

Add to `src/RaceScene.test.ts`:

```ts
it('keeps the finished race frozen after collectibles are added', () => {
  const scene = createTestScene()
  const overlay = { setVisible: vi.fn() }
  scene.state = 'racing'
  scene.progress = 0.99
  scene.finishOverlay = overlay
  scene.moveRoad = vi.fn()
  scene.positionFinishLine = vi.fn()
  scene.updateCollectibles = vi.fn()

  scene.update(0, 120)
  const finishedProgress = scene.progress
  scene.update(120, 1_000)

  expect(scene.state).toBe('finished')
  expect(overlay.setVisible).toHaveBeenCalledWith(true)
  expect(scene.progress).toBe(finishedProgress)
  expect(scene.updateCollectibles).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 14: Run the finish regression test and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all scene tests pass and the existing finished-state early return remains effective.

- [ ] **Step 15: Commit Task 2**

```bash
git add src/RaceScene.ts src/RaceScene.test.ts
git commit -m "feat: add collectible stars and scoring"
```

---

### Task 3: Durable record and final verification

**Files:**
- Modify: `implemented.md`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 behavior
- Produces: an up-to-date durable implementation and verification record

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run explicit TypeScript typecheck**

Run: `npx tsc --noEmit`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0; Vite produces `dist/` and the PWA service worker.

- [ ] **Step 4: Update the durable implementation record**

Update `implemented.md` to mark the Milestone 3 tasks complete and record the exact test count, typecheck result, build result, files changed, and any remaining non-blocking warnings. Do not claim verification that was not observed in Steps 1–3.

- [ ] **Step 5: Commit the record**

```bash
git add implemented.md
git commit -m "docs: record milestone 3 implementation"
```
