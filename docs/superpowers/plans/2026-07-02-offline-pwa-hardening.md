# Milestone 7 Offline PWA Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tiny Racers installable and reliably playable offline from an iPad Home Screen after one completed online load.

**Architecture:** Keep the existing generated Workbox service worker and harden its manifest/assets rather than introducing a custom worker. Add one small browser-API helper for truthful readiness UI, plus a dependency-free post-build verifier that checks the emitted PWA rather than trusting configuration alone.

**Tech Stack:** Vite 6, TypeScript 6, Phaser 4, vite-plugin-pwa 1, Workbox generateSW, Vitest 4, Node.js.

## Global Constraints

- Deploy on Vercel at the origin root with `start_url` and service-worker scope `/`.
- Add no backend, analytics, remote asset, external runtime API, authentication, leaderboard, or network dependency.
- Add no new npm dependency and no custom service worker.
- Service-worker and storage failures must never block gameplay.
- Preserve every Milestone 6 gameplay flow and the current uncommitted accent-color changes.
- Keep all changes uncommitted unless the user explicitly requests a commit.
- A physical-iPad airplane-mode cold-launch test remains required before travel.

---

### Task 1: Truthful Offline-Ready Status

**Files:**
- Create: `src/offlineReady.ts`
- Create: `src/offlineReady.test.ts`
- Modify: `src/TrackSelectScene.ts`
- Modify: `src/TrackSelectScene.test.ts`

**Interfaces:**
- Produces: `waitForOfflineReady(serviceWorker?: ServiceWorkerReady): Promise<boolean>`.
- Changes: track selection initially renders `Getting travel-ready…` and changes it to `✅ Ready to play offline` only after the helper resolves `true`.

- [ ] **Step 1: Write failing helper tests**

Create `src/offlineReady.test.ts` with real resolved and rejected promises:

```ts
import { describe, expect, it } from 'vitest'
import { waitForOfflineReady } from './offlineReady'

describe('waitForOfflineReady', () => {
  it('returns true after service-worker readiness resolves', async () => {
    await expect(waitForOfflineReady({ ready: Promise.resolve({}) })).resolves.toBe(true)
  })

  it('returns false when service workers are unavailable', async () => {
    await expect(waitForOfflineReady(undefined)).resolves.toBe(false)
  })

  it('returns false when readiness rejects', async () => {
    await expect(waitForOfflineReady({ ready: Promise.reject(new Error('blocked')) })).resolves.toBe(false)
  })
})
```

- [ ] **Step 2: Run helper tests and verify RED**

Run: `npm test -- src/offlineReady.test.ts`

Expected: FAIL because `src/offlineReady.ts` does not exist.

- [ ] **Step 3: Implement the minimal readiness helper**

Create `src/offlineReady.ts`:

```ts
export type ServiceWorkerReady = { ready: Promise<unknown> }

export async function waitForOfflineReady(
  serviceWorker: ServiceWorkerReady | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.serviceWorker,
): Promise<boolean> {
  if (!serviceWorker) return false

  try {
    await serviceWorker.ready
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run helper tests and verify GREEN**

Run: `npm test -- src/offlineReady.test.ts`

Expected: 3 tests pass.

- [ ] **Step 5: Write failing track-selection status tests**

Mock `waitForOfflineReady`, add `active: true` and `setText` to the scene display-object double, and assert:

```ts
expect(textValues).toContain('Getting travel-ready…')
await vi.waitFor(() => expect(status.setText).toHaveBeenCalledWith('✅ Ready to play offline'))
```

Retain the existing three exact accent-border assertions unchanged.

- [ ] **Step 6: Run scene tests and verify RED**

Run: `npm test -- src/TrackSelectScene.test.ts`

Expected: FAIL because the readiness text and update do not exist.

- [ ] **Step 7: Add the non-blocking status badge**

Import `waitForOfflineReady`. In `create()`, draw a rounded-looking green rectangle and centered initial status below the cards, then update only an active text object:

```ts
const status = this.add.text(WIDTH / 2, 710, 'Getting travel-ready…', {
  color: '#18243b',
  fontFamily: FONT,
  fontSize: '26px',
  fontStyle: 'bold',
})
status.setOrigin(0.5)

void waitForOfflineReady().then((ready) => {
  if (ready && status.active) status.setText('✅ Ready to play offline')
})
```

Keep all track cards, tap handlers, and the user’s accent-color change intact.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `npm test -- src/offlineReady.test.ts src/TrackSelectScene.test.ts`

Expected: all helper and selection tests pass.

---

### Task 2: Install Icons, Manifest, and Emitted-PWA Verification

**Files:**
- Create: `public/icons/tiny-racers-icon.svg`
- Create: `public/icons/tiny-racers-192.png`
- Create: `public/icons/tiny-racers-512.png`
- Create: `public/icons/tiny-racers-maskable-512.png`
- Create: `public/icons/apple-touch-icon-180.png`
- Create: `scripts/verify-pwa.mjs`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Produces: a root-scoped standalone landscape manifest with local 192, 512, and maskable icons; Apple Home Screen icon metadata; `npm run verify:pwa`.

- [ ] **Step 1: Add a failing emitted-PWA verifier**

Create `scripts/verify-pwa.mjs` using only `node:assert/strict`, `node:fs`, and `node:path`. It must read `dist/manifest.webmanifest`, `dist/index.html`, and `dist/sw.js`, then assert:

```js
assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'landscape')
assert.deepEqual(
  manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
  [
    { src: '/icons/tiny-racers-192.png', sizes: '192x192', purpose: 'any' },
    { src: '/icons/tiny-racers-512.png', sizes: '512x512', purpose: 'any' },
    { src: '/icons/tiny-racers-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
  ],
)
assert.match(html, /apple-touch-icon-180\.png/)
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//)
```

For each icon, assert the emitted file exists. Extract local `src` and stylesheet `href` values from emitted HTML and assert each appears in `sw.js`; also assert `manifest.webmanifest`, every icon path, and `index.html` appear in `sw.js`. Print `PWA verification passed` only after every assertion succeeds.

Add `"verify:pwa": "node scripts/verify-pwa.mjs"` to `package.json` without changing `build` yet.

- [ ] **Step 2: Build and verify RED**

Run: `npm run build && npm run verify:pwa`

Expected: build succeeds, then verifier fails because required manifest fields/icons are absent.

- [ ] **Step 3: Create local icon artwork and PNG sizes**

Create one square SVG with a blue background, safe yellow inner circle, and centered simple pink racing car made from vector rectangles/circles. Keep all important artwork inside the central 66% so it remains safe when masked.

Generate the four PNG files locally from that SVG at exact 192, 512, 512, and 180 pixel square sizes. Verify each with:

```bash
sips -g pixelWidth -g pixelHeight public/icons/*.png
```

Expected: the reported dimensions match each filename. Do not reference the SVG or any remote image at runtime.

- [ ] **Step 4: Harden manifest and Apple metadata**

Add `scope: '/'`, `id: '/'`, `lang: 'en'`, `categories: ['games', 'kids']`, and the three exact manifest icon entries to `vite.config.ts`. Add these local links to `index.html`:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
<meta name="apple-mobile-web-app-title" content="Tiny Racers" />
```

Retain automatic update registration, standalone mode, landscape orientation, and all current viewport/status metadata.

- [ ] **Step 5: Make production builds self-verifying**

Change the build script to:

```json
"build": "tsc && vite build && npm run verify:pwa"
```

- [ ] **Step 6: Build and verify GREEN**

Run: `npm run build`

Expected: Vite generates the app, manifest, and service worker; Workbox reports every app file precached; `PWA verification passed`; exit code 0. The existing large application-chunk warning remains non-blocking only while the JavaScript bundle is still listed in the service-worker precache.

---

### Task 3: Travel Runbook

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: exact local verification, Vercel installation, and physical-iPad airplane-mode test instructions.

- [ ] **Step 1: Document local production verification**

Add a `Development and PWA Verification` section with:

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run preview -- --host 127.0.0.1
```

State that `npm run build` validates manifest metadata, install icons, precache membership, navigation fallback, and local HTML assets. Explain that localhost is valid for desktop service-worker checks, while an iPad must use the HTTPS Vercel deployment rather than LAN HTTP preview.

- [ ] **Step 2: Document iPad installation**

Add `Install on iPad` steps: deploy to Vercel, open the HTTPS URL in Safari while online, Share → Add to Home Screen, launch from the icon while online, and wait for `✅ Ready to play offline` before disconnecting.

- [ ] **Step 3: Document the pre-flight airplane-mode test**

Add a checklist that force-closes Safari and the installed app, enables airplane mode with Wi-Fi off, cold-launches from the Home Screen, checks all three track cards, steering, collection, obstacle penalty, successful finish/results, same-track replay, Choose Track, and all three themes. Require a reboot and repeated offline cold launch, plus recording iPad model, iPadOS version, date, and pass/fail shortly before travel.

- [ ] **Step 4: Clarify current versus future functionality**

Label extra tracks, vehicle selection, sounds, gyroscope controls, and richer score examples as future ideas so the README does not imply Milestone 7 implements them.

- [ ] **Step 5: Check documentation formatting**

Run: `git diff --check -- README.md`

Expected: exit code 0.

---

### Task 4: Integrated Verification and Handoff

**Files:**
- Modify: `implemented.md`
- Modify: `docs/superpowers/plans/2026-07-02-offline-pwa-hardening.md`

**Interfaces:**
- Produces: final Milestone 7 evidence and durable remaining physical-device check.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: every test file passes with zero failures.

- [ ] **Step 2: Run standalone TypeScript validation**

Run: `npx tsc --noEmit`

Expected: exit code 0 with no diagnostics.

- [ ] **Step 3: Build and inspect production output**

Run: `npm run build`

Expected: exit code 0, `PWA verification passed`, and build output confirms the hashed JavaScript bundle is included in the Workbox precache below the configured size ceiling.

- [ ] **Step 4: Start and probe production preview**

Run: `npm run preview -- --host 127.0.0.1`

In a second command, request `/`, `/manifest.webmanifest`, `/sw.js`, and all four icon paths. Expected: each responds HTTP 200. Stop the preview after browser testing.

- [ ] **Step 5: Verify browser offline behavior**

Load production preview once, wait for `✅ Ready to play offline` and service-worker control, enable browser offline mode, reload, select a track, steer, observe score changes, finish, replay the same track, and return to selection. Expected: the complete flow works with no runtime network request dependency or console error.

- [ ] **Step 6: Review runtime dependency and storage scope**

Run source-only searches excluding lockfiles, docs, tests, `node_modules`, and `dist` for `http://`, `https://`, `fetch(`, XHR, WebSocket, remote Phaser loaders, `localStorage`, and IndexedDB. Expected: no application runtime dependency or required browser persistence.

- [ ] **Step 7: Request final code review**

Review the complete Milestone 7 diff against the approved specification. Fix every Critical or Important issue and rerun the covering tests before continuing.

- [ ] **Step 8: Update durable records**

Mark completed plan checkboxes and append to `implemented.md`: exact manifest/icons, readiness semantics, no-storage/no-network findings, test count, typecheck/build/preview/browser results, and the physical-iPad test that remains outstanding.

- [ ] **Step 9: Run final scope checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional Milestone 6 completion edits and Milestone 7 files are modified/untracked. Do not commit them without explicit user instruction.
