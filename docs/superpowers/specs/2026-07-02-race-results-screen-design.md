# Milestone 5 Race Results Screen Design

## Goal

End every race successfully and transition to a cheerful results screen that clearly shows the player's final score, collectibles collected, and obstacles hit. Make restarting or handing the iPad to the next child immediate and obvious.

## Scope

Milestone 5 adds race completion, a dedicated results scene, and a minimal main menu scene. It preserves the existing single 12-second track, touch steering, collectibles, obstacle penalties, finish line, and offline behavior.

This milestone does not add tracks, track selection, vehicles, sounds, rankings, timers, online features, complex animation, or any failure state.

## Scene Flow

The Phaser game registers three scenes:

1. `MenuScene` — a bright placeholder menu with the game title and one large `Start Race` button.
2. `RaceScene` — the existing playable backyard race.
3. `ResultsScene` — the dedicated end-of-race screen.

The game continues to start directly in `RaceScene` so current startup behavior remains immediate. Reaching race progress `1` sets the race state to `finished` and starts `ResultsScene` with a plain results object:

```ts
interface RaceResults {
  score: number
  collected: number
  obstaclesHit: number
}
```

Starting another scene removes the active race from view and stops its update loop. The existing in-race finish overlay is removed because the dedicated results scene replaces it.

## Result Counting

`RaceScene` continues to own collectible and obstacle state.

- Final score uses the existing `score` value.
- Collected count is the number of collectible entries with `collected === true`.
- Obstacles-hit count is the number of obstacle entries with `hit === true`.

Counts are assembled only when the race finishes. Each object already changes state only once, so the totals cannot double count.

Every race completes when progress reaches `1`, regardless of score, missed collectibles, or obstacle collisions. There is no failure branch.

## Results Screen

`ResultsScene` uses Phaser shapes and text only, with no new assets or dependencies. The screen has:

- a bright sky-blue background with simple colorful decorative circles or stars;
- a large white panel with a thick yellow border;
- the headline `Amazing Driving!` in large dark text;
- final score as the most prominent statistic;
- `Collected: N items`;
- `Obstacles Hit: N`;
- a large red `Race Again` button;
- a large blue `Main Menu` button.

All text uses the project's existing rounded system-font stack. Buttons have large rectangular touch areas and simple press-scale feedback. No celebration animation beyond the scene transition and button feedback is added.

`Race Again` starts a fresh `RaceScene`. Phaser creates a new scene run, and the existing `resetRace()` initialization restores score, objects, car position, progress, and finish-line state.

`Main Menu` starts `MenuScene`.

## Placeholder Main Menu

`MenuScene` is intentionally minimal:

- bright background and simple decorative shapes;
- large `Tiny Racers` title;
- short `Ready to race?` prompt;
- one large `Start Race` button.

The start button returns to `RaceScene`. It does not imply track or vehicle selection.

## Testing

Automated tests will verify:

- finishing changes race state and starts `ResultsScene` exactly once;
- the scene transition receives the exact final score, collected count, and obstacle-hit count;
- race updates remain stopped after completion;
- results text renders all supplied totals and the cheerful headline;
- `Race Again` starts `RaceScene`;
- `Main Menu` starts `MenuScene`;
- the menu start button starts `RaceScene`;
- scene registration includes all three scenes;
- existing collectible, obstacle, steering, scoring, and finish-line tests remain passing.

Final verification runs the complete test suite, `npx tsc --noEmit`, and `npm run build`.

## Constraints

- Frontend only; no new dependency, backend, network, or persistence.
- The race always ends successfully at progress `1`.
- No game over, failure state, ranking, or score qualification.
- Keep visuals bright, text large, and controls understandable for children aged 3 and 5.
- Preserve all existing Milestone 2–4 gameplay behavior except replacing the old finish overlay with the dedicated results scene.
