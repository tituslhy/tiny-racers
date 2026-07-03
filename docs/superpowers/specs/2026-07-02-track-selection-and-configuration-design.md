# Milestone 6 Track Selection and Configuration Design

## Goal

Add an immediate, child-friendly track selection screen and run the existing race with one of three explicit lightweight track configurations: Backyard, Forest, or Beach.

## Scope

Milestone 6 adds track selection and configurable visual/gameplay differences while preserving touch steering, collectibles, obstacles, scoring, non-fatal collisions, finish-line completion, replay, results, and offline operation.

This milestone does not add external assets, unlocks, vehicles, sounds, gyroscope controls, additional tracks, persistence, or online features.

## Scene Flow

The game registers these scenes in startup order:

1. `TrackSelectScene` (`track-select`) — starts automatically and shows three large track cards.
2. `RaceScene` (`race`) — receives `{ trackId }` and runs the selected configuration.
3. `ResultsScene` (`results`) — receives the race totals and selected `trackId`.

The old placeholder `MenuScene` is replaced by `TrackSelectScene`, removing an unnecessary extra tap.

Selecting a card calls:

```ts
this.scene.start('race', { trackId })
```

At completion, `RaceScene` adds `trackId` to `RaceResults`. `Race Again` starts `RaceScene` with the same track ID. `Choose Track` starts `TrackSelectScene`.

## Track Configuration

Create `src/tracks.ts` containing one small interface, an explicit record, and a fallback lookup:

```ts
export type TrackId = 'backyard' | 'forest' | 'beach'

export interface TrackConfig {
  id: TrackId
  name: string
  emoji: string
  skyColor: number
  groundColor: number
  accentColor: number
  roadWidth: number
  speed: number
  collectibles: readonly string[]
  obstacles: readonly string[]
}
```

The exact initial configurations are:

| Track | Colors | Road width | Speed | Collectibles | Obstacles |
|---|---|---:|---:|---|---|
| 🌱 Backyard | blue sky, green ground, yellow accent | 504 | 420 px/s | 🌼 🍌 🦋 | 🧱 🪣 🧹 |
| 🌲 Forest | pale sky, deep green ground, lime accent | 460 | 480 px/s | 🍄 🐦 🌰 | 🪨 🪵 🌳 |
| 🏖️ Beach | aqua sky, sand ground, coral accent | 440 | 540 px/s | 🐚 🥥 ⭐ | 🦀 ⚽ 🏰 |

`getTrack(trackId)` returns the requested config and falls back to Backyard if scene data is missing or invalid. No class hierarchy, factory, registry system, or configuration loader is added.

## Fixed Track Length and Speed

All tracks use the same abstract length of `5,040` progress units. Race duration is derived directly from track speed:

```ts
durationMs = (TRACK_LENGTH / track.speed) * 1000
```

This produces:

- Backyard: 12 seconds;
- Forest: 10.5 seconds;
- Beach: approximately 9.33 seconds.

The same speed value drives lane-dash movement. Faster tracks therefore look faster and finish sooner while always completing successfully.

## Track Selection Screen

`TrackSelectScene` uses Phaser shapes and text only. It displays:

- a bright `Choose Your Track!` heading;
- three side-by-side cards sized for landscape iPad touch;
- each track's emoji and name in large text;
- a small visual preview using the track colors and its collectible/obstacle emoji rows;
- simple press-scale feedback on the whole card.

No confirmation dialog or secondary start button is used. One tap immediately starts the selected race.

## Race Configuration

`RaceScene.init({ trackId })` stores the selected configuration before `create()`.

The configuration changes:

- sky, ground, and simple decorative theme colors;
- road width and road-edge positions;
- lane-dash positions;
- touch steering limits, keeping the full car inside the selected road;
- finish-line width;
- road movement speed and derived race duration;
- collectible and obstacle placeholder emojis.

Existing spawn progress values stay fixed. Replace absolute lane x-coordinates with normalized lane values (`-0.28`, `0`, `0.28`) and calculate each object x-position from the selected road width. This keeps every object reachable on all three tracks without adding a layout engine.

Collectibles and obstacles become large Phaser text placeholders. Each six-item collectible layout cycles through the track's three collectible emojis. Each four-item obstacle layout cycles through its three obstacle emojis. Collision bounds, +10 collectible score, -10 obstacle penalty, zero score floor, and collision feedback remain unchanged.

Theme drawing remains directly inside `RaceScene`: shared sky/ground shapes plus a short `switch` on the three track IDs for a few simple decorations. This is clearer than a generic drawing factory for only three placeholder themes.

## Results Screen

`RaceResults` gains `trackId`. Results continue showing:

- `Amazing Driving!`;
- final score;
- collected count;
- obstacles-hit count.

Buttons become:

- `Race Again` — reruns the same track;
- `Choose Track` — returns to `track-select`.

There is no score requirement or failure state.

## Testing

Automated tests will verify:

- the exact three track configurations and Backyard fallback;
- fixed track length produces the expected duration for every speed;
- selection renders all three names and starts the race with the tapped track ID;
- game startup order begins with track selection;
- `RaceScene` accepts a track ID and uses its road width, steering bounds, speed, placeholder sets, and finish-line width;
- every configured object remains within its selected road;
- race completion passes the selected track ID and existing totals;
- replay preserves the selected track;
- `Choose Track` returns to selection;
- existing movement, scoring, collision, finish, and result behaviors remain passing.

Final verification runs the full test suite, `npx tsc --noEmit`, and `npm run build`.

## Constraints

- Keep configuration simple, local, explicit, and dependency-free.
- Keep all controls large and understandable for children aged 3 and 5.
- A track selection takes one tap and immediately starts a race.
- Every race reaches the finish line successfully regardless of score.
- Preserve the user's existing uncommitted Milestone 3–5 work.
