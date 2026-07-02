# Milestone 4 Obstacles and Score Penalties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four non-fatal road obstacles that remove 10 points without taking the score below zero and give the car brief funny collision feedback.

**Architecture:** Keep obstacle state and rendering directly in `RaceScene`, parallel to the existing collectible implementation. Reuse `collectibleY` for progress-driven vertical movement and `centeredBoundsOverlap` for forgiving collision detection; use one short Phaser tween for visual feedback and no physics or generalized item system.

**Tech Stack:** TypeScript 6, Phaser 4, Vitest 4, Vite 6

## Global Constraints

- Work entirely in the frontend and preserve offline behavior.
- Keep the existing 12-second single track, touch steering, collectibles, score counter, finish line, finished overlay, and replay flow.
- Use four fixed bright orange obstacle placeholders.
- Each first collision subtracts exactly 10 points and clamps the score at zero.
- A collision must never stop the race, change race state, create game over, or disable steering.
- Add no sounds, tracks, vehicles, unlocks, health, lives, crash state, complex animation, dependency, backend, or persistence.
- Preserve the user's existing uncommitted Milestone 3 documentation and test-strengthening changes.

---

### Task 1: Obstacle Spawning and Progress-Driven Movement

**Files:**
- Modify: `src/RaceScene.test.ts`
- Modify: `src/RaceScene.ts`

**Interfaces:**
- Consumes: `collectibleY(progress, spawnProgress, startY, endY, travelProgress): number`
- Produces: `createObstacles(): void`, `updateObstacles(): void`, and an `obstacles` array containing `{ x, spawnProgress, sprite, hit }`.

- [ ] **Step 1: Extend the test scene type and write failing spawn and movement tests**

Add obstacle sprite, obstacle state, and scene method shapes to `TestableRaceScene`. Add tests equivalent to:

```ts
it('creates exactly four obstacle blocks at the fixed layout', () => {
  const scene = createTestScene()
  const rectangle = () => ({ setStrokeStyle: vi.fn() })
  const container = (_x: number, _y: number) => ({
    y: -50,
    setPosition: vi.fn(),
    setVisible: vi.fn(),
  })
  scene.add = {
    rectangle: vi.fn(rectangle),
    container: vi.fn(container),
  } as TestableRaceScene['add']

  scene.createObstacles()

  expect(scene.add.container).toHaveBeenCalledTimes(4)
  expect(scene.obstacles.map(({ x, spawnProgress }) => ({ x, spawnProgress }))).toEqual([
    { x: 512, spawnProgress: 0.08 },
    { x: 372, spawnProgress: 0.2 },
    { x: 652, spawnProgress: 0.44 },
    { x: 512, spawnProgress: 0.56 },
  ])
})

it('moves an active obstacle down the road as race progress increases', () => {
  const scene = createTestScene()
  const sprite = {
    y: -50,
    setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }),
    setVisible: vi.fn(),
  }
  scene.progress = 0.16
  scene.car = { x: 700, y: 620 }
  scene.scoreText = { setText: vi.fn() }
  scene.obstacles = [{ x: 512, spawnProgress: 0.08, sprite, hit: false }]

  scene.updateObstacles()
  const firstY = sprite.y
  scene.progress = 0.22
  scene.updateObstacles()

  expect(sprite.y).toBeGreaterThan(firstY)
})
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `createObstacles`, `updateObstacles`, and `obstacles` do not exist.

- [ ] **Step 3: Implement the fixed obstacle layout, placeholder, and movement**

In `src/RaceScene.ts`, add constants and state equivalent to:

```ts
const OBSTACLE_HALF_WIDTH = 42
const OBSTACLE_HALF_HEIGHT = 34
const OBSTACLE_START_Y = -50
const OBSTACLE_END_Y = HEIGHT + 50
const OBSTACLE_TRAVEL_PROGRESS = 0.3

const OBSTACLE_LAYOUT = [
  { x: ROAD_CENTER, spawnProgress: 0.08 },
  { x: ROAD_CENTER - 140, spawnProgress: 0.2 },
  { x: ROAD_CENTER + 140, spawnProgress: 0.44 },
  { x: ROAD_CENTER, spawnProgress: 0.56 },
] as const

interface Obstacle {
  x: number
  spawnProgress: number
  sprite: Phaser.GameObjects.Container
  hit: boolean
}
```

Add an `obstacles: Obstacle[]` field. Call `createObstacles()` in `create()` before creating the finish line and car. Implement:

```ts
private createObstacles(): void {
  this.obstacles = OBSTACLE_LAYOUT.map(({ x, spawnProgress }) => {
    const body = this.add.rectangle(0, 0, 84, 68, 0xff8a1f)
    body.setStrokeStyle(6, COLORS.white)
    const stripe = this.add.rectangle(0, 0, 68, 14, COLORS.yellow)
    const sprite = this.add.container(x, OBSTACLE_START_Y, [body, stripe])
    sprite.setVisible(false)
    return { x, spawnProgress, sprite, hit: false }
  })
}

private updateObstacles(): void {
  for (const obstacle of this.obstacles) {
    if (obstacle.hit) continue

    const y = collectibleY(
      this.progress,
      obstacle.spawnProgress,
      OBSTACLE_START_Y,
      OBSTACLE_END_Y,
      OBSTACLE_TRAVEL_PROGRESS,
    )
    const visible = this.progress >= obstacle.spawnProgress && y <= OBSTACLE_END_Y
    obstacle.sprite.setPosition(obstacle.x, y)
    obstacle.sprite.setVisible(visible)
  }
}
```

Call `updateObstacles()` immediately after `updateCollectibles()` in `update()`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all `RaceScene` tests pass.

### Task 2: One-Time Score Penalty and Non-Fatal Feedback

**Files:**
- Modify: `src/RaceScene.test.ts`
- Modify: `src/RaceScene.ts`

**Interfaces:**
- Consumes: Task 1's `Obstacle` state and `updateObstacles(): void`.
- Produces: `playObstacleFeedback(): void`, one-time collision handling, and score clamping at zero.

- [ ] **Step 1: Write failing collision tests**

Add focused tests equivalent to:

```ts
it('hides a hit obstacle and removes ten points only once', () => {
  const scene = createTestScene()
  const y = 620
  const sprite = { setPosition: vi.fn(), setVisible: vi.fn() }
  scene.state = 'racing'
  scene.progress = 0.08 + ((y + 50) / 868) * 0.3
  scene.car = { x: 512, y, setAngle: vi.fn(), setScale: vi.fn() }
  scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }
  scene.score = 20
  scene.scoreText = { setText: vi.fn() }
  scene.obstacles = [{ x: 512, spawnProgress: 0.08, sprite, hit: false }]

  scene.updateObstacles()
  scene.updateObstacles()

  expect(scene.obstacles[0].hit).toBe(true)
  expect(sprite.setVisible).toHaveBeenLastCalledWith(false)
  expect(scene.score).toBe(10)
  expect(scene.scoreText.setText).toHaveBeenCalledTimes(1)
  expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 10')
  expect(scene.state).toBe('racing')
})

it('does not reduce the score below zero', () => {
  const scene = createTestScene()
  const y = 620
  scene.progress = 0.08 + ((y + 50) / 868) * 0.3
  scene.car = { x: 512, y, setAngle: vi.fn(), setScale: vi.fn() }
  scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }
  scene.score = 5
  scene.scoreText = { setText: vi.fn() }
  scene.obstacles = [{
    x: 512,
    spawnProgress: 0.08,
    sprite: { setPosition: vi.fn(), setVisible: vi.fn() },
    hit: false,
  }]

  scene.updateObstacles()

  expect(scene.score).toBe(0)
  expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 0')
})

it('plays brief car feedback without stopping the race', () => {
  const scene = createTestScene()
  scene.state = 'racing'
  scene.car = { x: 512, y: 620, setAngle: vi.fn(), setScale: vi.fn() }
  scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }

  scene.playObstacleFeedback()

  expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(scene.car)
  expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
    targets: scene.car,
    duration: 220,
    ease: 'Bounce.Out',
  }))
  expect(scene.state).toBe('racing')
})
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because collision handling and `playObstacleFeedback` are missing.

- [ ] **Step 3: Implement the penalty and visual feedback**

Add `const OBSTACLE_PENALTY = 10`. After setting each obstacle's position and visibility in `updateObstacles`, add:

```ts
if (
  visible &&
  centeredBoundsOverlap(
    { x: this.car.x, y: this.car.y, halfWidth: CAR_HALF_WIDTH, halfHeight: CAR_HALF_HEIGHT },
    {
      x: obstacle.x,
      y,
      halfWidth: OBSTACLE_HALF_WIDTH,
      halfHeight: OBSTACLE_HALF_HEIGHT,
    },
  )
) {
  obstacle.hit = true
  obstacle.sprite.setVisible(false)
  this.score = Math.max(0, this.score - OBSTACLE_PENALTY)
  this.scoreText.setText(`⭐ ${this.score}`)
  this.playObstacleFeedback()
}
```

Implement feedback without moving or disabling the car:

```ts
private playObstacleFeedback(): void {
  this.tweens.killTweensOf(this.car)
  this.car.setAngle(0)
  this.car.setScale(1)
  this.tweens.add({
    targets: this.car,
    angle: { from: -8, to: 0 },
    scaleX: { from: 0.9, to: 1 },
    scaleY: { from: 1.08, to: 1 },
    duration: 220,
    ease: 'Bounce.Out',
  })
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- src/RaceScene.test.ts`

Expected: all `RaceScene` tests pass.

### Task 3: Replay Reset and Finish-State Regression

**Files:**
- Modify: `src/RaceScene.test.ts`
- Modify: `src/RaceScene.ts`

**Interfaces:**
- Consumes: Task 1's obstacle array and Task 2's feedback transform.
- Produces: `resetObstacles(): void` and complete Milestone 4 regression coverage.

- [ ] **Step 1: Write failing reset and finish-state tests**

Add a reset test that creates all four hit obstacles, calls `resetObstacles()`, and asserts every obstacle is active, hidden, and positioned at `(x, -50)`. Assert that existing tweens are killed and the car is restored with `setAngle(0)` and `setScale(1)`.

Extend the existing finished-race test with `scene.updateObstacles = vi.fn()` and assert it is called once before finish and not called by the later frozen update.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL because `resetObstacles` is missing and finished-state obstacle coverage is not wired.

- [ ] **Step 3: Implement obstacle reset**

Call `resetObstacles()` from `resetRace()` after `resetCollectibles()`. Implement:

```ts
private resetObstacles(): void {
  this.tweens.killTweensOf(this.car)
  this.car.setAngle(0)
  this.car.setScale(1)
  for (const obstacle of this.obstacles) {
    obstacle.hit = false
    obstacle.sprite.setPosition(obstacle.x, OBSTACLE_START_Y)
    obstacle.sprite.setVisible(false)
  }
}
```

- [ ] **Step 4: Run the complete tests and verify GREEN**

Run: `npm test`

Expected: all test files and tests pass with zero failures.

### Task 4: Verification and Durable Record

**Files:**
- Modify: `implemented.md`

**Interfaces:**
- Consumes: completed Milestone 4 implementation and verification output.
- Produces: an accurate durable record of behavior, tests, and remaining device checks.

- [ ] **Step 1: Run explicit typecheck**

Run: `npx tsc --noEmit`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit code 0 and generated Vite/PWA production output. The existing large Phaser chunk warning is non-blocking.

- [ ] **Step 3: Review scope and whitespace**

Run: `git diff --check`

Expected: exit code 0 with no whitespace errors.

Run: `git diff -- src/RaceScene.ts src/RaceScene.test.ts implemented.md`

Expected: only obstacle spawning, movement, collision penalty, brief feedback, reset, tests, and the implementation record are added; no prohibited feature appears.

- [ ] **Step 4: Update the implementation record**

Append a Milestone 4 section to `implemented.md` containing:

```markdown
## Milestone 4: Implemented

- four fixed bright orange obstacle placeholders;
- progress-driven obstacle movement on the existing single track;
- forgiving collision with a one-time 10-point penalty clamped at zero;
- immediate obstacle deactivation after collision;
- brief non-fatal car tilt-and-squash feedback;
- replay reset for all obstacles and the car transform;
- preserved collectibles, scoring, touch steering, finish line, finished state, and replay flow;
- no sounds, tracks, vehicles, unlocks, health, lives, game over, or crash state.
```

Record the exact final test, typecheck, and build results rather than estimated values.

- [ ] **Step 5: Run final verification after documentation changes**

Run: `npm test && npx tsc --noEmit && npm run build && git diff --check`

Expected: all commands exit 0; all tests pass; Vite creates the production bundle and PWA service worker.
