# Tiny Racers — Code Review (2026-07-02)

Reviewed at the Milestone 7 (offline PWA hardening) checkpoint, after Codex's session
ran out of tokens. This is an honest assessment of the current working tree, not just
what `implemented.md` claims.

## Verdict

**The code is in good shape.** Milestones 1–6 are solid, and Milestone 7's
implementation (Tasks 1–3 of its plan) is functionally complete and passes every
automated check I ran. What's missing is not code — it's the paperwork and one
verification pass that Task 4 of the Milestone 7 plan calls for, plus the physical
iPad test that was always going to be a manual, pre-travel step.

I ran the full verification loop myself from a clean state:

```
npm test        → 7 files, 47 tests, all passing
npx tsc --noEmit → clean, no errors
npm run build    → succeeds; PWA verification passed
sips (icon dims) → 180/192/512/512, all correct
grep for fetch/XHR/WebSocket/localStorage/http(s):// in src → none found
```

The build output is self-verifying (`scripts/verify-pwa.mjs` checks manifest fields,
icon emission, and that every local asset is actually present in the Workbox
precache), and it passes. `dist/index.html` genuinely gets a service-worker
registration script injected and `dist/registerSW.js` registers `/sw.js`. So the
"✅ Ready to play offline" mechanism is real, not just plausible-looking.

## What's genuinely good

- **Discipline against scope creep.** Every scene stays inside AGENTS.MD's
  constraints — no backend, no persistence, no new dependencies. `tracks.ts` is a
  small, explicit `Record`, not a factory or plugin system. This is exactly the
  "stop and simplify" posture the project docs ask for.
- **Pure-function extraction is well-judged.** `gameplay.ts` (clamping, race
  progress, collectible/obstacle Y position, centered-bounds overlap) has zero
  Phaser dependency, so `gameplay.test.ts` and `tracks.test.ts` test real logic
  without mocking a game engine. That's the highest-leverage testing decision in
  the codebase.
- **Scene tests use typed doubles, not `any`.** `RaceScene.test.ts`,
  `ResultsScene.test.ts`, and `TrackSelectScene.test.ts` hand-roll minimal Phaser
  display-object stand-ins with real typed interfaces. It's more code than a loose
  mock, but it means a typo in a test double is a compile error, not a silent
  false-positive.
- **The "no failure state" product rule is actually honored in code**, not just
  described. Score is clamped at zero (`Math.max(0, this.score - OBSTACLE_PENALTY)`
  in `RaceScene.ts:301`, and again defensively in `ResultsScene.init` at
  `ResultsScene.ts:36-38`), obstacle collisions never change race state, and
  `finishRace()` has no branch that can fail the race.
- **The offline-readiness indicator is honest, not decorative.**
  `waitForOfflineReady` (`src/offlineReady.ts`) only flips the badge after
  `navigator.serviceWorker.ready` resolves, and it checks `status.active` before
  calling `setText` so it won't throw if the scene has moved on
  (`TrackSelectScene.ts:49-51`, covered by the "inactive status" test). Small
  detail, but it's the difference between a badge you can trust before a flight and
  one that's just cosmetic.
- **Race-progress vs. visual-movement delta split is intentional and documented.**
  `update()` clamps `delta` to 50ms for `moveRoad` (visual smoothness) but advances
  race `progress` with the raw delta (`RaceScene.ts:126-128`), so a stalled frame
  can't desync the race length. `implemented.md` even records why. This is the kind
  of subtlety that's easy to "fix" into a bug later if someone doesn't know the
  reasoning — good that it's written down.
- **Strict TypeScript, and it's actually clean** (`tsconfig.json` has `"strict":
  true`, and `npx tsc --noEmit` has zero diagnostics).

## Milestone 7 status: implementation vs. paper trail mismatch

This is the main finding, and it's almost certainly *why* this review was asked for.

Looking at `docs/superpowers/plans/2026-07-02-offline-pwa-hardening.md`, **every
checkbox is still `- [ ]`**, including for Task 1 and Task 2 steps that are
observably done (`src/offlineReady.ts` and its 3 tests exist and pass; the icons
exist at the right sizes; `vite.config.ts` has the hardened manifest; `verify:pwa`
exists and passes; the build script runs it). Compare this to
`docs/superpowers/plans/2026-07-02-track-selection-and-configuration.md` in the same
diff, where equivalent steps are properly checked `- [x]` — so this isn't a project
convention being skipped, it's this specific plan that never got closed out.

Similarly, `implemented.md` has full sections for Milestones 1–6 but **no
"Milestone 7" section at all** — it jumps from Milestone 6 straight to
`## Constraints`. README.md *does* have the Milestone 7 deliverables (Development
and PWA Verification, Install on iPad, Pre-flight Airplane-mode Test sections all
exist and look complete — Task 3 of the plan). So the actual gap is narrow:

**Task 4 of the plan ("Integrated Verification and Handoff") was never run.**
Specifically, of its 9 steps, steps 1–3 (test/typecheck/build) I just re-ran myself
and they pass, but steps 4–6 were not evidenced anywhere:

- Step 4/5: start `npm run preview`, hit `/`, `/manifest.webmanifest`, `/sw.js`, and
  the four icon paths over HTTP, then actually flip the browser to offline mode and
  play a full race through results and replay. There's no record this happened for
  Milestone 7 (and Milestone 3's notes mention the in-app browser tool stalling
  previously, so this may be a recurring blocker rather than an oversight).
- Step 8: append a "Milestone 7" section to `implemented.md` with the same rigor as
  Milestones 1–6.

None of this is a code defect — it's an incomplete handoff. But it means a fresh
Codex session (or you) reading `implemented.md` today would not know Milestone 7 is
this close to done.

## Findings (minor, non-blocking)

1. **Bundle size has been flagged every milestone without action.** The Phaser
   chunk is now 1,698 kB minified / 386 kB gzipped, and the PWA precache is ~1.66 MB
   total. This has been a "known non-blocking item" since Milestone 2 and hasn't
   grown unreasonably, but it's now directly relevant to Milestone 7's actual goal:
   the "Ready to play offline" badge can't turn green until that entire precache
   downloads and installs successfully. On a slow or flaky airport/hotel Wi-Fi
   before the flight, that's the one step in the whole plan most likely to fail
   silently (the UI has no error/retry state if precaching stalls — by design, per
   the spec, since a scary error message doesn't help a 3-year-old, but it does mean
   *you* need to watch for the badge before boarding rather than assuming it
   worked). Not something to fix in code now, just something to actively verify
   during the physical-iPad test rather than assume.
2. **`collectibleY` is reused for obstacle positioning** (`RaceScene.ts:277`)
   without renaming. It's the right call to reuse rather than duplicate the
   function, but the name is now misleading at the call site — a future reader has
   to check the implementation to realize it's generic Y-interpolation, not
   collectible-specific. A one-line rename (e.g. `travelY`) would remove the
   ambiguity without adding any abstraction.
3. **Color constants are re-declared per scene** (`RaceScene.ts`, `ResultsScene.ts`,
   `TrackSelectScene.ts` each have their own `COLORS`/inline hex object, several
   values like `0x18243b`, `0xfff8e7`, `0xffd43b` repeated verbatim across files).
   Given the project's explicit "avoid abstractions unless necessary" philosophy,
   I would *not* introduce a shared theme module for this — three files with a
   handful of duplicated hex constants is well under the threshold where a shared
   module pays for itself, and a shared "theme" concept is exactly the kind of
   speculative abstraction AGENTS.MD warns against. Flagging only so it's a
   conscious choice, not something worth spending remaining budget on.
4. **iPad orientation isn't enforced at runtime.** The manifest declares
   `"orientation": "landscape"`, but iOS home-screen web apps don't actually lock
   orientation from the manifest (that's primarily an Android/Chrome PWA
   capability) — the app will letterbox via `Phaser.Scale.FIT` if a child holds the
   iPad in portrait, rather than being rotation-locked. This isn't a Milestone 7
   regression (it predates this milestone and the fixed 1024×768 canvas has always
   had this property), but worth knowing before the flight: if either child rotates
   the iPad, the game will shrink to a small letterboxed rectangle instead of
   staying full-screen. Worth a 30-second check during the physical test, not
   necessarily worth engineering a fix for a 3-/5-year-old audience that's unlikely
   to intentionally rotate a tablet mid-race.

## Recommended next steps (roughly in order)

1. Run Milestone 7 plan Task 4, steps 4–6 yourself (or with a fresh Codex session):
   `npm run preview -- --host 127.0.0.1`, hit the manifest/service-worker/icon URLs,
   then actually go offline in the browser and play a full race through to results
   and replay. This is the one piece of verification that hasn't happened yet and
   is cheap to do.
2. Once that passes, check off the plan's checkboxes and append the "Milestone 7"
   section to `implemented.md` (mirroring the Milestone 1–6 format) so the durable
   record matches reality — this is what a future session would otherwise be
   missing.
3. Do the physical iPad airplane-mode test from the README checklist before the
   September/October trip — nothing here substitutes for that, and it's the only
   check that can catch real device/orientation/Safari-cache behavior.
4. Nothing in this review blocks moving forward with Milestone 8 (or whatever's
   next) — the two minor naming/duplication items above are optional polish, not
   prerequisites.
