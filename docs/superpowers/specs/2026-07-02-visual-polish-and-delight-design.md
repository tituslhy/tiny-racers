# Milestone 8 Visual Polish and Delight Design

**Date:** 2026-07-02

## Goal

Make Tiny Racers feel joyful, magical, and rewarding for children aged 3 and 5 without changing its gameplay systems, rules, controls, or offline-first architecture.

## Design Direction

Milestone 8 uses a layered fusion of three visual personalities:

- **Chunky toy-box** supplies the shared shapes, thick outlines, bright plastic-car styling, sticker-like objects, and large controls.
- **Storybook adventure** makes Backyard, Forest, and Beach feel like distinct illustrated places.
- **Mini carnival** appears only during rewarding moments such as collection, race completion, and results.

Assigning each personality a specific role prevents the screen from becoming visually noisy. Normal racing remains clear and readable; the strongest motion and decoration are reserved for successful actions.

## Visual Language

The core palette remains local, bright, and high contrast:

- sky blue `#38BDF8`;
- sunshine yellow `#FFD43B`;
- toy red `#F04444`;
- leaf green `#65C466`;
- warm cream `#FFF8E7`;
- deep navy `#18243B`.

Track-specific colors may extend this palette, but navy text and cream outlines remain the readability anchors. Visual elements use thick borders, simple layered Phaser primitives, sticker-like emoji tokens, and soft offset shadows.

The existing rounded system-font stack remains unchanged. It works offline and avoids depending on platform font downloads. Important text uses clear size and weight hierarchy rather than additional copy.

The signature element is a collectible sticker: each existing track-specific emoji sits on a colorful token, gently wiggles while travelling, and bursts into a short sparkle effect when collected.

## Track Configuration

Each existing `TrackConfig` gains two explicit visual values:

- `roadColor`: the main road surface color;
- `edgeColor`: the colorful road-shoulder color beneath the cream edge line.

Backyard remains a welcoming wide toy road, Forest becomes a deeper green woodland route, and Beach uses a warmer road with coral or aqua edging. Road width, car speed, track length, collectible sets, and obstacle sets remain unchanged.

No general theme engine, asset factory, or shared component framework will be introduced. Track-specific scenery remains an explicit three-case branch because there are exactly three tracks.

## Track Selection Screen

The existing three-card landscape layout remains because its 280×450 cards are already large and readable on a 1024×768 iPad canvas.

Each card becomes a chunky toy-road tile with:

- a small offset shadow;
- the existing track accent border;
- a miniature track scene derived directly from the selected track;
- a pale collectible sticker row and contrasting obstacle row;
- one interactive card container so the entire tile scales together on press.

The miniature scenes are deliberately distinct:

- Backyard: blue sky, lawn, white fence, flowers, and bushes;
- Forest: mint sky, deep green ground, layered trees, and mushrooms;
- Beach: turquoise sky, sand, sun, and simple wave bands.

Cards use a one-time staggered entrance tween from `0.9` to `1` over 180ms, but they do not float or pulse continuously. Pointer-down scales the complete card to `0.96`; pointer-out restores it; pointer-up restores it and starts the selected race immediately.

The heading, track names, and truthful offline-ready badge remain. `✅ Ready to play offline` may appear only after service-worker readiness resolves successfully and only while the status object is active.

## Race Screen

### Track and Road

The road receives a track-specific surface, a wider colored shoulder, cream edge lines, and the existing moving lane dashes. Steering and collision boundaries continue to use the configured road width, not decorative shoulder width.

Roadside scenery remains static and is built from inexpensive Phaser shapes:

- Backyard: fence panels, flowers, toy-like bushes, and friendly trees;
- Forest: layered light/dark trees, mushrooms, and small woodland plants;
- Beach: sand, blue water bands, waves, shells, and umbrellas.

Scenery must not obscure the road, score, car, finish line, collectibles, or obstacles.

### Collectibles and Obstacles

Collectible and obstacle emoji sets remain unchanged. Each collectible becomes a small sticker token made from a backing shape and emoji in a container. Each obstacle receives a contrasting warning-style backing so it reads as a different class of object without adding instructions.

Logical collision calculations continue using the existing fixed bounds and calculated road coordinates. Emoji rendering differences between platforms must not affect collision size.

Visible collectibles receive a small deterministic rotation and scale pulse. Their `x` and `y` remain owned by the existing road-travel calculation; no tween may compete with `setPosition()`.

Collecting an item immediately marks it collected, hides its logical token, adds ten points, updates the score, and invokes a transient `+10 ✨` rise-and-fade effect at the collision position. The score display briefly pops. Transient objects destroy themselves when their finite tween completes.

Hitting an obstacle immediately marks it hit, applies the existing score penalty clamped at zero, and keeps the race active. The car receives a 260ms squash/wobble bounce using a 10-degree angle and the existing `Bounce.Out` easing. No crash state, delay, failure, health, or game-over path is introduced.

### Toy Car and Score

The car retains its current container position and collision footprint. Decorative additions make it look like a toy without changing control behavior:

- colorful wheel hubs;
- layered body and bumper shapes;
- a small hood badge;
- brighter windshield and light details;
- the existing drop shadow.

The score becomes a fixed high-contrast pill near the top-right with a 52px value and remains above gameplay and transient effects. Score copy stays short: `⭐ N`.

### Finish Celebration

The finish line remains sized to each configured road width and continues to end the race successfully at the existing progress threshold.

Race completion must transition to results without waiting for an animation. The main celebration occurs immediately when the results screen opens. The approaching finish line gains two small decorative flag icons, but no finish animation delays or blocks `finishRace()`.

## Results Screen

The results screen becomes a finish-line celebration card while preserving unconditional praise and both navigation actions.

The hierarchy is:

1. `Amazing Driving!` in large rounded text;
2. a trophy or finish symbol with a short pop animation;
3. a large yellow score card with a small `SCORE` label and prominent numeric score;
4. two side-by-side stat cards for collected items and obstacle contacts;
5. large `Race Again` and `Choose Track` buttons.

The obstacle total uses the friendly label `Silly Bumps` while preserving the exact numeric count. Icons reinforce labels but never replace them because emoji appearance varies on iPad.

Both buttons increase to at least 480×96 pixels, remain interactive immediately, retain their current actions, and use the existing press-scale feedback. Replay remains the primary warm-red action and passes the same track id. Track selection remains blue and returns to `track-select`.

Celebration consists of a finite trophy pop and 12 simple confetti shapes around the panel edges. Confetti moves and fades once, stays behind content and controls, and destroys itself. There is no emitter, loop, score count-up, ranking, medal tier, or score-dependent praise.

## Animation Rules

- Motion must communicate a reward, affordance, or object identity.
- Ambient motion stays subtle and limited to the six collectibles.
- Celebration motion is finite and nonblocking.
- No tween controls logical road position, collision state, score state, or scene transition timing.
- No per-frame display-object creation is permitted.
- Transient collection and celebration objects are destroyed after use.
- Buttons remain usable while entrance or celebration tweens are running.
- Gameplay remains functional if a decorative tween cannot run.

## Preserved Behavior

Milestone 8 must preserve:

- Backyard, Forest, and Beach selection;
- fixed track length and configured speeds;
- touch and pointer steering;
- collectible values and layouts;
- obstacle penalties clamped at zero;
- non-fatal collisions;
- successful finish-line completion for every race;
- final score, collected total, and obstacle-hit total;
- same-track replay and return to track selection;
- PWA installability, service-worker readiness, and complete offline play.

There remains no failure state, game over, health, lives, timer pressure, unlock, vehicle selection, multiplayer, backend, or online functionality.

## Testing and Verification

Automated tests will verify behavior rather than brittle decorative coordinates:

- all three track configs expose explicit road and edge colors;
- card pointer feedback applies to the complete interactive track card and all three ids still start immediately;
- offline-ready copy remains truthful and lifecycle-safe;
- each selected track uses its configured road colors and preserves road bounds;
- collectible collision still awards ten points once and invokes collection feedback;
- obstacle collision still penalizes once, never goes below zero, invokes bounce feedback, and does not stop racing;
- score styling remains large and high contrast;
- results remain cheerful at score zero and show every exact total;
- both results buttons meet the minimum target size and preserve their navigation payloads;
- celebration tweens are finite and buttons are interactive immediately;
- race completion still transitions immediately with the correct results payload.

Required verification commands:

```bash
npm test
npx tsc --noEmit
npm run build
```

Production browser verification will use the fixed 1024×768 landscape canvas to inspect all three track previews and race themes, steering, collectible and obstacle feedback, finish completion, results celebration, replay, and return to selection. It will also confirm no browser console warnings or errors and recheck offline loading after the visual changes are precached.

## Simplicity Constraints

- Use existing Phaser shapes, containers, text, emoji, and tweens only.
- Add no runtime asset, remote resource, or npm dependency.
- Add no particle framework, animation framework, generic scene component library, or theme abstraction.
- Keep track-specific scenery explicit.
- Keep animation methods small and local to the scene that owns the effect.
- Do not refactor gameplay code unless required to isolate a visual-effect seam for testing.
