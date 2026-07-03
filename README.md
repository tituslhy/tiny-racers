# 🚗 Tiny Racers

Tiny Racers is a simple offline-first racing game built for my two daughters (ages 3 and 5).

The purpose of this project is extremely simple:

**Build a fun game that keeps two children entertained during long flights for our Australia trip in September/October 2026.**

Success metric:

> Children happily play for 20+ minutes without fighting over the iPad.

---

# Project Philosophy

This project is intentionally small.

It is **not**:

- a portfolio project
- an architecture experiment
- a technical showcase
- an excuse to overengineer

It **is**:

- a fun game for young children
- an offline iPad experience
- a lightweight frontend-only project
- an experiment in building with OpenAI Codex

Important reminder:

**Do not accidentally build enterprise software.**

---

# Core Gameplay Loop

Simple arcade-style racing game.

The current game includes three selectable tracks (Backyard, Forest, and Beach),
drag-to-steer controls, collectibles, obstacles, a finish/results screen, replay,
and track selection. Ideas explicitly marked as future work are not implemented.

```text
Choose Track
↓
Car automatically moves forward
↓
Player steers left and right
↓
Collect good objects → gain points
↓
Hit bad objects → lose points
↓
Reach finish line
↓
Show final score
↓
Next child takes turn
```

Important design rule:

**Every race must finish.**

This allows children to take turns.

There is **no endless mode**.

---

# Core Design Principles

The game is designed for children aged **3 and 5**.

This means:

Prioritize:

- immediate fun
- bright colors
- simple controls
- funny animations
- rewarding sounds (future idea)
- clear visual feedback
- large touch targets

Avoid:

- reading-heavy UI
- timers
- complicated menus
- difficult mechanics
- game over screens
- frustrating interactions

Primary design rule:

> If a 3-year-old cannot understand it immediately, simplify it.

---

# Controls

## Phase 1 — Touch Controls

Player drags finger horizontally.

```text
drag left  → move left
drag right → move right
```

This is the MVP.

## Future Enhancement — Gyroscope

Possible future support:

```text
tilt left  → move left
tilt right → move right
```

Not required for initial version.

---

# Scoring System

Players collect good objects for points.

The current game shows a simple score. The object-specific values and richer
collection breakdowns below are future ideas.

## Positive Collectibles

Examples:

| Object | Points |
|----------|--------|
| Banana 🍌 | +10 |
| Ice Cream 🍦 | +15 |
| Teddy Bear 🧸 | +20 |
| Star ⭐ | +30 |
| Strawberry 🍓 | +10 |

---

## Negative Obstacles

Examples:

| Object | Penalty |
|----------|---------|
| Rock 🪨 | -10 |
| Mud Puddle 💦 | -5 |
| Traffic Cone 🚧 | -10 |
| Sleeping Cat 🐈 | -5 |

Important:

Collisions do **not** stop the race.

On collision:

- play bounce animation
- play funny sound effect (future idea)
- continue moving

There is no failure state.

---

# Track System

Different themed tracks.

Difficulty changes through:

- road width
- number of collectibles
- number of obstacles
- movement speed

Each track has:

- fixed length
- fixed speed

No acceleration.

---

# Tracks

The current selectable tracks are Backyard, Forest, and Beach.

## 🌱 Backyard (Easy)

Collect:

- flowers
- bananas
- butterflies

Avoid:

- toy blocks
- watering cans
- garden rake

Characteristics:

- slow speed
- wide road
- few obstacles

---

## 🌲 Forest (Medium)

Collect:

- mushrooms
- birds
- acorns

Avoid:

- rocks
- logs
- tree stumps

Characteristics:

- medium speed
- moderate obstacles

---

## 🏖️ Beach (Medium)

Collect:

- shells
- coconuts
- starfish

Avoid:

- crabs
- beach balls
- sandcastles

Characteristics:

- more obstacles

---

## Future Idea — ❄️ Snow Land (Hard)

Collect:

- snowflakes
- candy canes
- penguins

Avoid:

- ice patches
- snowmen

Characteristics:

- higher speed

---

## Future Idea — 🍭 Candy Land (Chaos Mode)

Collect:

- donuts
- cupcakes
- gummy bears

Avoid:

- broccoli

Because obviously.

---

# Future Idea — Vehicle Selection

Pure cosmetic selection.

Examples:

- Pink Car 🚗
- Blue Car 🚙
- Unicorn Car 🦄
- Dinosaur Truck 🦖
- Princess Carriage 👑

No gameplay difference.

---

# End Of Race Screen

The current results screen shows the final score and lets the player replay the
same track or choose a track. A richer collection breakdown like the following
is a future idea:

```text
Amazing Driving!

Collected:
12 Bananas 🍌
4 Stars ⭐
3 Teddy Bears 🧸

Final Score: 420
```

Then:

```text
Play Again
Choose Another Track
Next Player
```

No rankings.

No pressure.

---

# Technical Stack

Frontend only.

## Framework

- Vite
- TypeScript

## Game Engine

- Phaser

## Offline Support

- vite-plugin-pwa
- service worker

## Persistence

- localStorage is an optional future tool; current gameplay does not require or use it

## Audio

- Web Audio API (future idea; sounds are not currently implemented)

---

# Development and PWA Verification

Run the complete local production verification from a clean checkout:

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run preview -- --host 127.0.0.1
```

`npm run build` validates the web app manifest metadata, install icons, precache
membership, navigation fallback, and local HTML assets. After it succeeds, use
the preview URL to check the production build on the desktop.

Localhost is valid for desktop service-worker checks. An iPad must use the HTTPS
Vercel deployment; a LAN HTTP preview is not a valid iPad installation or
offline-service-worker test.

## Install on iPad

1. Deploy the production build to Vercel.
2. While online, open the HTTPS Vercel URL in Safari on the iPad.
3. Tap **Share → Add to Home Screen**.
4. Launch Tiny Racers from its new Home Screen icon while still online.
5. Wait until the game shows **✅ Ready to play offline** before disconnecting.

## Pre-flight Airplane-mode Test

Run this test on the physical iPad shortly before travel:

- [ ] While still online, confirm the installed app shows **✅ Ready to play offline**.
- [ ] Force-close both Safari and the installed Tiny Racers app.
- [ ] Enable airplane mode and confirm Wi-Fi is off.
- [ ] Cold-launch Tiny Racers from its Home Screen icon.
- [ ] Confirm all three track cards appear: Backyard, Forest, and Beach.
- [ ] On a race, confirm drag steering works.
- [ ] Collect an item and confirm the score increases.
- [ ] Hit an obstacle and confirm the score penalty without stopping the race.
- [ ] Finish the race and confirm the results screen appears.
- [ ] Use **Race Again** and confirm the same track starts.
- [ ] Use **Choose Track** and confirm track selection returns.
- [ ] Play all three themes and confirm Backyard, Forest, and Beach each load offline.
- [ ] Reboot the iPad while it remains offline.
- [ ] Repeat the offline cold launch from the Home Screen and confirm the game still works.
- [ ] Record the iPad model, iPadOS version, test date, and overall pass/fail result.

---

# Non Goals

This project must remain simple.

Do NOT build:

- backend APIs
- authentication
- cloud services
- databases
- multiplayer networking
- analytics
- telemetry
- user accounts
- online leaderboards

Forbidden technologies:

- Kubernetes
- Redis
- RabbitMQ
- PostgreSQL
- Docker orchestration

No enterprise architecture.

This is a children's game.

---

# Development Roadmap

We build incrementally.

---

## Milestone 1

Project bootstrap.

Build:

- Vite setup
- TypeScript setup
- Phaser integration
- PWA setup

Success criteria:

Project runs locally.

---

## Milestone 2

Basic movement.

Build:

- road background
- car sprite
- left/right touch movement

Success criteria:

Player can control car.

---

## Milestone 3

Object spawning.

Build:

- collectible spawning
- collision detection
- score increase

Success criteria:

Can collect items.

---

## Milestone 4

Obstacle system.

Build:

- obstacle spawning
- score penalty
- bounce animation

Success criteria:

Obstacle collision works.

---

## Milestone 5

Race completion.

Build:

- finish line
- race timer
- end screen

Success criteria:

Track completes successfully.

---

## Milestone 6

Track selection.

Build:

- multiple tracks
- themed assets
- difficulty changes

Success criteria:

Can choose different tracks.

---

# Final Rule

Always remember:

The end users are:

- Faith ❤️
- Claire ❤️

If the game is technically impressive but not fun for children:

The project has failed.

---

# Emergency Reminder For Titus

If at any point I begin building:

- microservices
- event-driven architecture
- distributed caching
- observability pipelines
- multi-agent orchestration
- backend infrastructure

I have lost the plot.

Stop coding immediately.
