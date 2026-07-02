# Milestone 4 Obstacles and Score Penalties Design

**Date:** 2026-07-02

## Goal

Add simple, non-fatal obstacles to the existing single playable track. Steering into an obstacle removes 10 points, hides that obstacle, gives the car brief funny visual feedback, and allows the race to continue normally.

## Scope

Milestone 4 adds only:

- four simple obstacle placeholders on the existing road;
- progress-driven obstacle movement toward the player;
- forgiving overlap detection using the existing centered-bounds helper;
- a 10-point score penalty clamped at zero;
- one-time obstacle deactivation after collision;
- a short car tilt-and-squash tween on collision;
- replay reset for every obstacle and for the car's visual transform.

It preserves the existing collectible, score counter, touch steering, race progress, finish line, finished overlay, and replay behavior.

It does not add sounds, tracks, vehicle selection, unlocks, complex animation, health, lives, game over, or a crash state.

## Architecture

Obstacle behavior stays inside `RaceScene`, matching the existing collectible implementation. A small fixed layout defines each obstacle's horizontal position and spawn progress. Each obstacle stores its sprite and whether it has already been hit.

Obstacle vertical position uses the existing pure `collectibleY` helper because collectibles and obstacles follow the same progress-based road movement. Collision uses the existing `centeredBoundsOverlap` helper. No physics system, generalized road-item abstraction, or new dependency is needed.

## Visual Design

Each obstacle is a bright orange rectangular road block with a pale horizontal stripe and dark outline. The placeholder is large enough to identify immediately while leaving space to steer around it.

Four obstacles appear at fixed, separated points across the three reachable road positions. Their spawn progress is interleaved with the collectible layout so the 12-second race remains readable and playable for young children.

On collision, the obstacle disappears immediately. The car briefly tilts and squashes, then returns to its normal angle and scale using a single short Phaser tween. This feedback is visual only: it does not move the car, disable touch controls, pause progress, or change race state.

## Scoring and Collision Flow

During each racing update:

1. Calculate each active obstacle's vertical position from race progress.
2. Show it after its spawn progress and while it remains on screen.
3. Test its bounds against the car using inclusive overlap.
4. On first overlap, mark it as hit and hide it.
5. Set the score to `Math.max(0, score - 10)` and refresh the existing score text.
6. Start the brief car collision tween.
7. Continue the same race update and finish-line flow.

An inactive obstacle is skipped on later frames, so it cannot penalize the score more than once.

## Reset and Finish Behavior

Starting a new race restores every obstacle to its initial hidden position and active state. It also stops any obstacle-feedback tween and restores the car to angle `0` and scale `1`.

Once the race is finished, the existing early return in `update` freezes obstacle movement together with road movement, collectibles, progress, and finish-line position. An obstacle collision never calls `finishRace`, changes `state`, or creates another end condition.

## Testing

Scene tests will verify:

- exactly four obstacle placeholders are created at the fixed layout;
- active obstacles move down the road as progress increases;
- collision hides and deactivates an obstacle;
- one collision removes exactly 10 points only once;
- the score never drops below zero;
- collision starts the car feedback tween without changing race state;
- replay restores every obstacle and the car's normal transform;
- the update loop includes obstacles while racing and remains frozen after finish;
- existing collectible, touch movement, score, finish-line, and replay tests still pass.

Final verification runs the complete test suite, explicit TypeScript typecheck, and production build.
