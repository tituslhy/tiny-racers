# Milestone 3: Collectibles and Scoring Design

## Goal

Add simple collectible objects and scoring to the existing single playable track without changing the Milestone 2 race controls or finish behavior.

## Scope

The track contains six identical yellow star placeholders. Each star is worth 10 points. Their positions and timing are fixed so every replay is predictable and fair for young children.

This milestone does not add obstacles, penalties, sounds, multiple tracks, vehicle selection, unlocks, or complex animations.

## Gameplay

- Stars appear near the top of the road and move toward the player's car as race progress increases.
- Stars are distributed across three reachable horizontal road positions.
- Steering the car into a star collects it.
- A collected star immediately disappears and increases the score by 10 exactly once.
- A missed star continues past the player and leaves the screen without a penalty.
- The score is displayed as a large `⭐ 0` counter near the top of the screen.
- Starting another race resets the score to zero and restores all six stars.
- Finishing the race retains the existing finish line, finished overlay, frozen game state, and replay behavior.

## Implementation

`RaceScene` owns a small fixed list of collectible descriptors. Each descriptor contains its road position, spawn progress, display object, and collected state. The scene calculates each uncollected star's vertical position from the current race progress. This keeps collectible movement deterministic and synchronized with the fixed 12-second race regardless of frame rate.

Collision uses simple rectangular overlap bounds between the car and each visible star. Phaser's physics system is not needed. When overlap occurs, the scene marks the star collected before updating its visibility and score, preventing duplicate scoring on later frames.

The score counter and collectible objects are created once and reset in place when the player chooses “Race again.” No persistence is required for this milestone.

## Testing

Automated tests will cover:

- collectible position changing with race progress;
- collision detecting a collectible within the car bounds;
- collection increasing score and hiding the object;
- a collected object not scoring twice;
- replay resetting score and collectible state;
- existing race progress and finish behavior remaining intact.

Verification will run the full test suite, TypeScript typecheck, and production build.
