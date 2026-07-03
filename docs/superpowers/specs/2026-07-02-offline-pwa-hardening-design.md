# Milestone 7 Offline PWA Hardening Design

**Date:** 2026-07-02

## Goal

Make Tiny Racers reliably installable and playable as an offline-first iPad PWA for travel while preserving all Milestone 6 gameplay.

## Scope

Milestone 7 covers PWA install metadata, local install icons, Workbox precaching, a truthful offline-ready message on track selection, safe optional browser-storage behavior, and a documented physical-iPad travel test.

It does not add backend services, analytics, remote assets, external runtime APIs, authentication, online features, or new gameplay.

## Deployment Assumption

Tiny Racers is deployed on Vercel at the origin root. Vite's default `/` base, the manifest `start_url: "/"`, and service-worker scope `/` are therefore intentional. Subpath-hosting support is out of scope.

The production deployment must use HTTPS. Localhost may be used for desktop service-worker testing, but a LAN HTTP preview is not sufficient for physical-iPad installation testing.

## PWA Configuration and Manifest

Continue using `vite-plugin-pwa` with an automatically updated Workbox-generated service worker. The production build must precache the complete local app shell: HTML, bundled JavaScript, CSS, the manifest, service-worker registration code, and local icons. Navigation requests must fall back to `index.html` so an offline cold launch reaches the game.

The manifest will retain the existing Tiny Racers name, description, colors, standalone display mode, landscape orientation, and root start URL. It will explicitly include root scope and locally generated install icons:

- 192×192 PNG;
- 512×512 PNG;
- 512×512 maskable PNG with safe padding.

`index.html` will reference a local 180×180 Apple touch icon and retain the Apple standalone, status-bar, viewport, and theme-color metadata. The icon artwork will be a simple bright Tiny Racers car mark created locally without external assets.

## Offline-Ready Indicator

The track-selection screen remains the start/menu screen. A small cheerful status badge will appear below the track cards.

On production startup it initially says `Getting travel-ready…`. After `navigator.serviceWorker.ready` resolves, it changes to `✅ Ready to play offline`. The ready message means an active service worker completed installation, including Workbox precaching; it does not rely on the unreliable `navigator.onLine` flag.

The status is informational only. Service-worker absence, rejection, storage eviction, or registration failure must never block track selection, race startup, scoring, results, replay, or return to track selection. Unsupported or failed environments keep the initial message without showing a frightening error to a child.

The implementation will use one small pure helper around the optional service-worker container so readiness behavior can be tested without coupling Phaser to browser globals. The scene will update its existing text object asynchronously only while the scene is active.

## Storage and Network Safety

The current game does not use `localStorage`, IndexedDB, fetch, XHR, WebSockets, remote fonts, remote images, remote audio, or Phaser asset loading. Milestone 7 will preserve that property.

No readiness flag will be stored in `localStorage`, because browser storage and service-worker caches can be cleared independently. If persistence is added in a future milestone, reads and writes must be guarded and gameplay must work when storage is unavailable or throws. Milestone 7 adds no persistence merely to satisfy the stack list.

All game visuals and icons remain local. Build-time package registry URLs in `package-lock.json` are not runtime dependencies.

## Preserved Gameplay

Milestone 7 must leave these flows unchanged:

- Backyard, Forest, and Beach track selection;
- touch/pointer steering;
- configured track themes, widths, speeds, collectible sets, and obstacle sets;
- collectible scoring and obstacle penalties clamped at zero;
- non-fatal collision feedback;
- fixed-length successful race completion;
- results totals;
- same-track replay;
- return to track selection.

There remains no failure or game-over state.

## Testing and Verification

Automated coverage will verify:

- service-worker readiness resolves `true` only after the optional browser API's `ready` promise resolves;
- missing or rejected service-worker APIs remain safe and return `false`;
- track selection renders the initial travel-readiness message and updates it after readiness;
- existing track cards and navigation continue to work;
- production manifest metadata and all required icon declarations are emitted;
- the generated service worker precaches the game bundle and provides navigation fallback;
- application source and emitted HTML contain no remote runtime asset URLs.

Required commands:

```bash
npm test
npx tsc --noEmit
npm run build
npm run preview -- --host 127.0.0.1
```

Desktop production-preview verification will load the app once, wait for service-worker readiness/control, switch the browser offline, reload, and exercise track selection through results and replay. Preview server startup and HTTP responses will also be recorded.

README will document the final physical-iPad test: deploy to Vercel over HTTPS, open in Safari while online, Add to Home Screen, launch once online until the ready badge appears, force-close, enable airplane mode with Wi-Fi off, cold-launch from the Home Screen, exercise every preserved gameplay flow, reboot the iPad, and repeat. The tester should record iPad model, iPadOS version, date, and result shortly before travel.

Desktop checks cannot certify iPad installation, standalone presentation, landscape enforcement, Safari cache eviction behavior, emoji rendering, or physical touch response. The physical-iPad test remains a required release-readiness check rather than an automated claim.

## Simplicity Constraints

- No new dependency.
- No custom service worker unless the generated Workbox worker proves insufficient.
- No install prompt, update modal, connectivity controls, or complex PWA state machine.
- No gameplay refactor.
- No persistence abstraction when the game currently stores nothing.
