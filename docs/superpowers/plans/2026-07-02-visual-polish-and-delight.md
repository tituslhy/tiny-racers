# Milestone 8 Visual Polish and Delight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Tiny Racers a toy-box, storybook, and carnival visual polish pass while preserving every gameplay and offline behavior.

**Architecture:** Keep the existing three Phaser scenes and explicit three-track configuration. Add visual primitives and small local effect methods inside the scene that owns them; do not introduce assets, dependencies, shared UI frameworks, or new gameplay state. Race, track-selection, and results work are file-independent and may be implemented in parallel, then integrated through the existing scene payloads.

**Tech Stack:** Vite 6, TypeScript 6, Phaser 4, Vitest 4, vite-plugin-pwa 1.

## Global Constraints

- Preserve the current dirty working tree, including the Milestone 7 verifier/docs and `collectibleY` → `travelY` rename.
- Keep all changes uncommitted unless the user explicitly requests a commit.
- Add no npm dependency, runtime asset, remote resource, backend, online feature, gameplay system, or new mechanic.
- Preserve fixed track length, speeds, touch steering, collision bounds, score rules, successful completion, results payloads, replay, track selection, and offline readiness.
- Use only existing Phaser shapes, containers, text, emoji, and finite tweens.
- No tween may control logical road position, collision state, score state, or race completion timing.
- Buttons remain interactive immediately; decorative animation failure must never block gameplay.
- Keep copy readable on the fixed 1024×768 landscape iPad canvas.

## Parallel Execution Map

- **Agent A:** Task 1 only — `tracks.ts`, `tracks.test.ts`, `RaceScene.ts`, `RaceScene.test.ts`.
- **Agent B:** Task 2 only — `TrackSelectScene.ts`, `TrackSelectScene.test.ts`.
- **Agent C:** Task 3 only — `ResultsScene.ts`, `ResultsScene.test.ts`.
- **Primary agent:** Task 4 integration, review, browser verification, plan checkboxes, and `implemented.md`.

Tasks 1–3 may run concurrently because they own disjoint source/test files. Task 4 begins only after all three reviews pass.

---

### Task 1: Race Theme, Toy Objects, Feedback, and Score

**Files:**
- Modify: `src/tracks.ts`
- Modify: `src/tracks.test.ts`
- Modify: `src/RaceScene.ts`
- Modify: `src/RaceScene.test.ts`

**Interfaces:**
- Consumes: existing `TrackConfig`, `travelY(...)`, `RaceResults`, scene keys, score values, collision constants, and track layouts.
- Produces: `TrackConfig.roadColor: number`, `TrackConfig.edgeColor: number`, `playCollectFeedback(x: number, y: number): void`, and the unchanged `RaceResults` payload.

- [x] **Step 1: Add failing explicit track-palette tests**

Extend the `keeps every track explicit and lightweight` expectations in `src/tracks.test.ts`:

```ts
expect(TRACKS.backyard).toMatchObject({
  roadColor: 0x596273,
  edgeColor: 0xffd43b,
})
expect(TRACKS.forest).toMatchObject({
  roadColor: 0x3f5149,
  edgeColor: 0xa8e063,
})
expect(TRACKS.beach).toMatchObject({
  roadColor: 0x58617a,
  edgeColor: 0xff7f66,
})
```

- [x] **Step 2: Run the palette test and verify RED**

Run: `npm test -- src/tracks.test.ts`

Expected: FAIL because `roadColor` and `edgeColor` are absent.

- [x] **Step 3: Add the two explicit fields to every track**

Add to `TrackConfig`:

```ts
roadColor: number
edgeColor: number
```

Add the exact tested values to Backyard, Forest, and Beach. Do not change `roadWidth`, `speed`, collectibles, obstacles, or `TRACK_LENGTH`.

- [x] **Step 4: Run the palette test and verify GREEN**

Run: `npm test -- src/tracks.test.ts`

Expected: 4 tests pass.

- [x] **Step 5: Add failing RaceScene contracts for visual polish**

Extend the `TestableRaceScene` double with the methods used by visual effects:

```ts
playCollectFeedback(x: number, y: number): void
drawRoad(): void
createCar(): unknown
```

Extend display-object doubles only with methods production code actually calls: `setAngle`, `setScale`, `setAlpha`, `setDepth`, `setOrigin`, `setStrokeStyle`, `destroy`, and container `add`.
Add `phase: number` to the collectible type in the test double and to every existing collectible fixture; add `setAngle` and `setScale` spies to every collectible sprite fixture used by `updateCollectibles()`.

Add these focused tests:

```ts
it('draws the selected track road and colorful shoulders without changing bounds', () => {
  const scene = createTestScene()
  scene.init({ trackId: 'forest' })
  scene.add = { rectangle: vi.fn(() => ({ setStrokeStyle: vi.fn() })) } as TestableRaceScene['add']

  scene.drawRoad()

  expect(scene.add.rectangle).toHaveBeenCalledWith(512, 438, 496, 660, 0xa8e063)
  expect(scene.add.rectangle).toHaveBeenCalledWith(512, 438, 460, 660, 0x3f5149)
  expect(scene.roadLeft).toBe(282)
  expect(scene.roadRight).toBe(742)
})

it('invokes finite collection feedback after awarding ten points once', () => {
  const scene = createTestScene()
  const y = 620
  const sprite = {
    setPosition: vi.fn(), setVisible: vi.fn(), setAngle: vi.fn(), setScale: vi.fn(),
  }
  scene.progress = 0.02 + ((y + 50) / 868) * 0.3
  scene.car = { x: 512, y }
  scene.score = 0
  scene.scoreText = { setText: vi.fn() }
  scene.playCollectFeedback = vi.fn()
  scene.collectibles = [{ x: 512, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

  scene.updateCollectibles()
  scene.updateCollectibles()

  expect(scene.score).toBe(10)
  expect(scene.playCollectFeedback).toHaveBeenCalledTimes(1)
  expect(scene.playCollectFeedback).toHaveBeenCalledWith(512, 620)
})

it('gives visible collectibles bounded sticker motion without changing travel y', () => {
  const scene = createTestScene()
  const sprite = {
    y: -50,
    setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }),
    setVisible: vi.fn(),
    setAngle: vi.fn(),
    setScale: vi.fn(),
  }
  scene.progress = 0.1
  scene.car = { x: 700, y: 620 }
  scene.scoreText = { setText: vi.fn() }
  scene.collectibles = [{ x: 372, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

  scene.updateCollectibles()

  expect(sprite.setAngle).toHaveBeenCalledWith(expect.any(Number))
  expect(sprite.setScale).toHaveBeenCalledWith(expect.any(Number))
  expect(sprite.y).toBeCloseTo(181.47, 1)
})
```

Update the obstacle-feedback test to expect `duration: 260`, `ease: 'Bounce.Out'`, and an angle beginning at `-10`. Update the score-counter test to expect `fontSize: '52px'`. Update the finish-line test to retain 24 checkered rectangles and expect two `🏁` text calls without changing finish width.

- [x] **Step 6: Run RaceScene tests and verify RED**

Run: `npm test -- src/RaceScene.test.ts`

Expected: FAIL for missing palette use, `phase`, ambient transforms, collection effect, new feedback duration, score size, and flags.

- [x] **Step 7: Draw track-specific road shoulders and clearer scenery**

Replace the road surface constant usage with the selected config while preserving its geometry:

```ts
private drawRoad(): void {
  this.add.rectangle(
    ROAD_CENTER,
    HEIGHT / 2 + 54,
    this.track.roadWidth + 36,
    HEIGHT - 108,
    this.track.edgeColor,
  )
  this.add.rectangle(
    ROAD_CENTER,
    HEIGHT / 2 + 54,
    this.track.roadWidth,
    HEIGHT - 108,
    this.track.roadColor,
  )
  this.add.rectangle(this.roadLeft + 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
  this.add.rectangle(this.roadRight - 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
}
```

Keep `drawTrackTheme()` explicit. Add only static primitives outside the road:

- Backyard: two three-panel cream fences and existing flowers/trees.
- Forest: retain four trees and add two small mushroom emoji or circle/stem pairs.
- Beach: add two blue horizontal water bands behind the road, cream wave dashes, and two sun/coral circles.

Do not add a scenery collection, update loop, or scrolling state.

- [x] **Step 8: Build collectible and obstacle sticker containers**

Change the sprite types in both interfaces to `Phaser.GameObjects.Container`; add `phase: number` to `Collectible`.

Create each collectible as a container whose children are a yellow/cream backing and the existing emoji:

```ts
const badge = this.add.circle(0, 0, 39, 0xffd43b, 0.95)
badge.setStrokeStyle(6, COLORS.white)
const icon = this.add.text(0, 0, this.track.collectibles[index % this.track.collectibles.length], {
  fontSize: '48px',
  fontFamily: 'Arial, sans-serif',
})
icon.setOrigin(0.5)
const sprite = this.add.container(x, COLLECTIBLE_START_Y, [badge, icon])
sprite.setVisible(false)
return { x, spawnProgress, phase: index * 0.9, sprite, collected: false }
```

Create obstacles the same way with a pale coral backing, cream stroke, and 50px emoji. Keep the existing logical half-width and half-height constants.

In `updateCollectibles()`, after positioning and visibility:

```ts
const wiggle = Math.sin(this.progress * 36 + collectible.phase)
collectible.sprite.setAngle(wiggle * 5)
collectible.sprite.setScale(1 + wiggle * 0.04)
```

Do not animate container `x` or `y` outside `setPosition()`.

- [x] **Step 9: Add finite collection feedback and score pop**

Invoke `this.playCollectFeedback(collectible.x, y)` immediately after updating the score.

Add the local method:

```ts
private playCollectFeedback(x: number, y: number): void {
  const effect = this.add.text(x, y - 20, '+10 ✨', {
    color: '#ffd43b',
    fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
    fontSize: '34px',
    fontStyle: 'bold',
    stroke: '#18243b',
    strokeThickness: 6,
  })
  effect.setOrigin(0.5)
  effect.setDepth(30)

  this.tweens.add({
    targets: effect,
    y: y - 90,
    alpha: 0,
    scale: 1.25,
    duration: 420,
    ease: 'Sine.Out',
    onComplete: () => effect.destroy(),
  })

  this.tweens.killTweensOf(this.scoreText)
  this.scoreText.setScale(1)
  this.tweens.add({
    targets: this.scoreText,
    scale: { from: 1.22, to: 1 },
    duration: 180,
    ease: 'Back.Out',
  })
}
```

Update `playObstacleFeedback()` to a 260ms `Bounce.Out` tween with `angle: { from: -10, to: 0 }`, `scaleX: { from: 0.88, to: 1 }`, and `scaleY: { from: 1.12, to: 1 }`. Keep state unchanged.

- [x] **Step 10: Polish the toy car, score pill, and finish flags**

Keep the car container dimensions and position. Add decorative children only: four yellow wheel-hub circles, a cream rear bumper rectangle, and a centered `★` hood text. Do not change `CAR_HALF_WIDTH`, `CAR_HALF_HEIGHT`, or steering.

In `createScoreCounter()`, add a cream pill behind the text using one rectangle plus two end circles at depth 19, then create the existing `⭐ 0` text at 52px and depth 20. Keep the method return type `Phaser.GameObjects.Text`.

At the end of `createFinishLine()`, add two flag icons:

```ts
for (const x of [-this.track.roadWidth / 2 - 28, this.track.roadWidth / 2 + 28]) {
  const flag = this.add.text(x, 28, '🏁', { fontSize: '34px', fontFamily: 'Arial, sans-serif' })
  flag.setOrigin(0.5)
  finish.add(flag)
}
```

Keep `finishRace()` unchanged so results start immediately.

- [x] **Step 11: Run focused race tests and verify GREEN**

Run: `npm test -- src/tracks.test.ts src/RaceScene.test.ts`

Expected: all track and race tests pass, including existing scoring, steering, finish, and results payload coverage.

- [x] **Step 12: Review Task 1 scope**

Run:

```bash
git diff --check -- src/tracks.ts src/tracks.test.ts src/RaceScene.ts src/RaceScene.test.ts
git diff -- src/tracks.ts src/tracks.test.ts src/RaceScene.ts src/RaceScene.test.ts
```

Expected: no whitespace errors; no gameplay constants, track length, speeds, layouts, collision bounds, or scene keys changed.

---

### Task 2: Playful Track Selection Cards

**Files:**
- Modify: `src/TrackSelectScene.ts`
- Modify: `src/TrackSelectScene.test.ts`

**Interfaces:**
- Consumes: existing `TRACKS`, `TrackConfig`, `waitForOfflineReady()`, and scene key `race`.
- Produces: three 280×450 interactive `Phaser.GameObjects.Container` cards with unchanged track-id payloads.

- [x] **Step 1: Extend test doubles and write failing card-interaction tests**

Extend `TestObject` with `setSize` and `add`. Add `add.container` and `tweens.add` to the scene double. Record containers whose `setInteractive()` is called in `cards`, and separately record every rectangle `setStrokeStyle` call in `accentStrokes` so the existing exact yellow/green/coral border contract remains independent of the input target.

Add:

```ts
it('makes each whole toy card a large pressable target', () => {
  scene.create()

  expect(cards).toHaveLength(3)
  for (const card of cards) {
    expect(card.setSize).toHaveBeenCalledWith(280, 450)
    card.handlers.pointerdown()
    expect(card.setScale).toHaveBeenLastCalledWith(0.96)
    card.handlers.pointerout()
    expect(card.setScale).toHaveBeenLastCalledWith(1)
  }
})

it('adds one finite entrance tween for each card', () => {
  scene.create()

  expect(scene.tweens.add).toHaveBeenCalledTimes(3)
  expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
    duration: 180,
    ease: 'Back.Out',
  }))
})
```

Retain the exact heading/name strings, immediate `race` starts, and both offline-status tests. Change the border assertion source from `cards.map(...)` to `accentStrokes` and keep the exact expected calls `[10, 0xffd43b]`, `[10, 0xa8e063]`, and `[10, 0xff7f66]`.

- [x] **Step 2: Run selection tests and verify RED**

Run: `npm test -- src/TrackSelectScene.test.ts`

Expected: FAIL because interaction is still attached only to background rectangles and no entrance tween exists.

- [x] **Step 3: Build one complete interactive container per card**

Change the loop to pass `index`:

```ts
Object.values(TRACKS).forEach((track, index) => {
  this.createTrackCard(CARD_X[index], track, index)
})
```

Implement `createTrackCard(x, track, index)` around a local container:

```ts
const card = this.add.container(x, 414)
card.setSize(280, 450)
card.setInteractive({ useHandCursor: true })

const shadow = this.add.rectangle(8, 10, 280, 450, 0x18243b, 0.24)
const panel = this.add.rectangle(0, 0, 280, 450, track.groundColor)
panel.setStrokeStyle(10, track.accentColor)
card.add([shadow, panel])
```

Add all card text and preview shapes at local coordinates. Preserve exact labels and use 34px names, 38px collectible icons, and 34px obstacle icons.

Attach handlers to `card`:

```ts
card.on('pointerdown', () => card.setScale(0.96))
card.on('pointerout', () => card.setScale(1))
card.on('pointerup', () => {
  card.setScale(1)
  this.scene.start('race', { trackId: track.id })
})
```

- [x] **Step 4: Draw explicit miniature storybook previews**

Add `private addTrackPreview(card, track): void` with an explicit `track.id` branch. Use only local coordinates inside the container:

- common sky rectangle at `(0, -174)`, size `250×82`;
- common road rectangle at `(0, -49)`, size `112×190`;
- Backyard adds three cream fence slats and three flower circles;
- Forest adds two trunk rectangles, four canopy circles, and two mushroom text icons;
- Beach adds a yellow sun circle and two aqua wave rectangles.

Add pale cream/yellow and pale coral row backings behind the collectible and obstacle emoji. Keep decoration inside card bounds `x ±140`, `y ±225`.

- [x] **Step 5: Add finite card entrance motion**

After building each card:

```ts
card.setScale(0.9)
this.tweens.add({
  targets: card,
  scale: 1,
  duration: 180,
  delay: index * 70,
  ease: 'Back.Out',
})
```

Do not add repeat, yoyo, or continuously moving cards.

- [x] **Step 6: Run focused selection tests and verify GREEN**

Run: `npm test -- src/TrackSelectScene.test.ts src/offlineReady.test.ts`

Expected: all selection and readiness tests pass.

- [x] **Step 7: Review Task 2 scope**

Run:

```bash
git diff --check -- src/TrackSelectScene.ts src/TrackSelectScene.test.ts
git diff -- src/TrackSelectScene.ts src/TrackSelectScene.test.ts
```

Expected: only visual/card test changes; exact track ids and truthful readiness semantics remain unchanged.

---

### Task 3: Rewarding Results Celebration

**Files:**
- Modify: `src/ResultsScene.ts`
- Modify: `src/ResultsScene.test.ts`

**Interfaces:**
- Consumes: unchanged `RaceResults`, `getTrack()`, scene keys `race` and `track-select`.
- Produces: immediate two-button results UI with `SCORE`, `Collected`, and `Silly Bumps` hierarchy plus finite celebration tweens.

- [x] **Step 1: Write failing hierarchy, target-size, and celebration tests**

Extend the scene double with `tweens.add`, `add.container` only if used, and display-object `setDepth`, `setAlpha`, `setAngle`, and `destroy` methods.

Replace the reading-heavy text expectation with:

```ts
expect(textValues).toEqual(expect.arrayContaining([
  'Amazing Driving!',
  '🏆',
  'SCORE',
  '30',
  '4',
  'Collected',
  '2',
  'Silly Bumps',
  'Race Again',
  'Choose Track',
]))
```

Record rectangle creation arguments for interactive buttons and add:

```ts
it('uses two immediate child-sized action targets', () => {
  scene.init({ trackId: 'backyard', score: 0, collected: 0, obstaclesHit: 0 })
  scene.create()

  expect(interactiveButtons).toHaveLength(2)
  for (const button of interactiveButtons) {
    expect(button.width).toBeGreaterThanOrEqual(480)
    expect(button.height).toBeGreaterThanOrEqual(96)
  }
})

it('keeps score zero cheerful and starts only finite celebration tweens', () => {
  scene.init({ trackId: 'backyard', score: -10, collected: 0, obstaclesHit: 0 })
  scene.create()

  expect(textValues).toContain('Amazing Driving!')
  expect(textValues).toContain('0')
  expect(textValues).not.toEqual(expect.arrayContaining(['Game Over', 'You Lost']))
  expect(scene.tweens.add).toHaveBeenCalled()
  for (const [config] of scene.tweens.add.mock.calls) {
    expect(config).not.toEqual(expect.objectContaining({ repeat: -1 }))
  }
})
```

Keep the exact replay track-id and `track-select` navigation tests.

- [x] **Step 2: Run results tests and verify RED**

Run: `npm test -- src/ResultsScene.test.ts`

Expected: FAIL because the old sentence layout, 420×88 buttons, and animation-free screen remain.

- [x] **Step 3: Replace the flat column with a finish celebration hierarchy**

Keep `init()` unchanged. In `create()`:

- retain the bright sky background and one cream panel;
- keep `Amazing Driving!` at y=104 in 64px type;
- add `🏆` at y=178 and store its text object;
- add a yellow score card centered at y=275, with `SCORE` at 235 and the numeric score at 292 in 82px type;
- add two side-by-side cream or pale-color stat cards centered at x=385 and x=639, y=410;
- show collected number plus `Collected` on the left;
- show obstacle count plus exact label `Silly Bumps` on the right;
- place buttons at y=565 and y=680 so their 96px height remains inside the canvas.

Do not condition praise, colors, or animation on score.

- [x] **Step 4: Enlarge buttons without changing actions**

Change `createButton()` to create a `500×96` rectangle and use 42px labels. Preserve immediate `setInteractive`, pointer-down scale, pointer-out reset, pointer-up reset, and callback order.

Keep callbacks exact:

```ts
this.scene.start('race', { trackId: this.results.trackId })
this.scene.start('track-select')
```

- [x] **Step 5: Add one finite trophy pop and 12 confetti tweens**

Add:

```ts
private playCelebration(trophy: Phaser.GameObjects.Text): void {
  trophy.setScale(0.75)
  this.tweens.add({
    targets: trophy,
    scale: 1,
    duration: 360,
    ease: 'Back.Out',
  })

  const colors = [COLORS.yellow, COLORS.red, COLORS.green, COLORS.blue]
  for (let index = 0; index < 12; index += 1) {
    const left = index % 2 === 0
    const x = left ? 150 + (index % 3) * 28 : 874 - (index % 3) * 28
    const y = 90 + (index % 6) * 82
    const piece = this.add.rectangle(x, y, 14, 28, colors[index % colors.length])
    piece.setDepth(2)
    this.tweens.add({
      targets: piece,
      y: y + 110,
      angle: left ? 150 : -150,
      alpha: 0,
      duration: 760 + index * 20,
      delay: index * 35,
      ease: 'Sine.Out',
      onComplete: () => piece.destroy(),
    })
  }
}
```

Call it after creating the content and interactive buttons. Confetti remains outside the main content column and never receives input.

- [x] **Step 6: Run focused results tests and verify GREEN**

Run: `npm test -- src/ResultsScene.test.ts`

Expected: all results content, button, navigation, zero-score, and finite-animation tests pass.

- [x] **Step 7: Review Task 3 scope**

Run:

```bash
git diff --check -- src/ResultsScene.ts src/ResultsScene.test.ts
git diff -- src/ResultsScene.ts src/ResultsScene.test.ts
```

Expected: no ranking, failure copy, conditional praise, delayed interaction, changed result payload, or new scene.

---

### Task 4: Integrated Verification, Browser Critique, and Handoff

**Files:**
- Modify: `implemented.md`
- Modify: `docs/superpowers/plans/2026-07-02-visual-polish-and-delight.md`

**Interfaces:**
- Consumes: completed Tasks 1–3 and the approved Milestone 8 specification.
- Produces: verified production build, visual browser evidence, durable implementation record, and the remaining physical-iPad check.

- [x] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: every test file passes with zero failures. Record the exact file and test counts.

- [x] **Step 2: Run standalone TypeScript validation**

Run: `npx tsc --noEmit`

Expected: exit code 0 with no diagnostics.

- [x] **Step 3: Build and self-verify the production PWA**

Run: `npm run build`

Expected: exit code 0, `PWA verification passed`, and Workbox includes the hashed application bundle in its precache. The existing Phaser chunk-size warning remains non-blocking if the bundle is precached.

- [x] **Step 4: Request a final code review**

Review the complete Milestone 8 diff against `docs/superpowers/specs/2026-07-02-visual-polish-and-delight-design.md`. Fix every Critical or Important finding, run the covering focused tests, and request re-review until both specification and quality pass.

- [x] **Step 5: Start and probe production preview**

Run: `npm run preview -- --host 127.0.0.1`

Probe `/`, `/manifest.webmanifest`, `/sw.js`, and the four install-icon paths. Expected: HTTP 200 for each. Keep the preview running for the browser pass.

- [x] **Step 6: Critique track selection at iPad landscape size**

Use the production build at a 1024×768 viewport. Verify:

- heading and offline-ready badge remain readable;
- all three whole cards react to press and remain inside their bounds;
- Backyard, Forest, and Beach previews are immediately distinguishable;
- icons, labels, and shadows do not overlap;
- every track starts with one tap.

- [x] **Step 7: Exercise all three race themes and feedback paths**

For Backyard, Forest, and Beach, verify selected road/shoulder colors, distinct scenery, toy car clarity, large score pill, sticker movement, steering, collection effect, obstacle bounce, finish flags, and successful transition. At least one race must visibly collect an item and hit an obstacle without stopping.

- [x] **Step 8: Exercise results, replay, and offline reload**

Verify `Amazing Driving!`, trophy, score hierarchy, exact totals, `Silly Bumps`, finite confetti, large button targets, same-track replay, and Choose Track. Confirm no console warnings or errors. Wait for the offline-ready badge, stop the preview server, reload, and confirm the polished track-selection screen still loads from the service-worker cache.

- [x] **Step 9: Update durable records**

Append a Milestone 8 section to `implemented.md` covering:

- the layered toy-box/storybook/carnival direction;
- track palette and scenery differences;
- collectible, obstacle, car, score, finish, card, and results improvements;
- exact automated verification counts;
- build/PWA and browser results;
- confirmation that gameplay and offline behavior are unchanged;
- the physical-iPad visual/touch/airplane-mode check that remains outstanding.

Mark completed checkboxes in this plan only after evidence exists.

- [x] **Step 10: Run final scope checks**

Run:

```bash
git diff --check
git status --short
rg -n "https?://|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|indexedDB|this\.load\." src --glob '!*.test.ts'
```

Expected: no whitespace errors; no new runtime network/storage/loader dependency; status contains only the preserved Milestone 7 changes, the approved Milestone 8 spec/plan, and intentional Milestone 8 source/test/docs changes. Do not commit without explicit user instruction.
