# Milestone 2: Single Playable Track

## Goal

Create one complete, child-friendly race that is understandable within seconds and always reaches a finish state.

## Scope

The milestone includes one landscape track, a placeholder car, automatic forward movement, horizontal touch-drag steering, a visible finish line, and a completion overlay with a large **Race again** button.

It does not include collectibles, obstacles, scoring, sounds, track selection, or additional tracks.

## Gameplay

The car remains near the bottom of the screen while road markings move downward at a constant speed. This creates the impression of automatic forward travel without introducing camera or world-management complexity.

Dragging anywhere on the game canvas moves the car horizontally. The car follows the pointer directly and is clamped inside the road edges. Vertical pointer movement has no effect.

Race progress advances automatically. Near the end, a checkered finish line moves down the road. When it reaches the car, road movement stops and steering is disabled. The game displays **Finished!** and a large **Race again** button. Pressing the button resets the same race immediately.

## Visual Design

The scene uses a bright backyard-like palette suitable for young children:

- Sky blue: `#38BDF8`
- Grass green: `#65C466`
- Asphalt charcoal: `#404858`
- Road white: `#FFF8E7`
- Car red: `#F04444`
- Car yellow accent: `#FFD43B`

The road is wide and centered, with high-contrast white edges and large moving dashed markings. The placeholder car is built from simple Phaser shapes with a chunky silhouette, visible wheels, and a bright windshield. The finish line is an unmistakable black-and-white checker pattern.

The visual signature is the oversized toy-like red car against the smoothly scrolling road. Decorative detail remains restrained so the steering action is immediately obvious.

## Architecture

The app uses one Phaser scene. Phaser graphics generate all visuals at runtime, avoiding asset downloads and preserving offline operation.

Small pure functions handle horizontal clamping and race progress. They are kept separate from the scene so core behavior can be tested without rendering Phaser in a browser. The scene owns rendering, pointer input, the update loop, finish detection, and restart behavior.

## State Flow

The race has two states:

1. `racing`: road scrolls, progress advances, and drag steering is enabled.
2. `finished`: movement and steering stop, and the completion overlay is visible.

Selecting **Race again** resets progress, road markings, finish-line position, car position, and state.

## Testing and Verification

Automated tests cover car clamping and race completion behavior using pure gameplay functions. The implementation follows a red-green test cycle.

Verification includes:

- Running the full automated test command.
- Running the production build.
- Opening the app in a browser and confirming the road scrolls, drag steering works, the car remains within the road, the finish line appears, the race ends, and **Race again** resets it.
- Confirming the layout fits the existing 1024×768 landscape canvas and remains usable through Phaser's responsive scaling.
