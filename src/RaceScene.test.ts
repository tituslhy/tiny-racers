import { describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Math: {
      Linear: (start: number, end: number, amount: number) =>
        start + (end - start) * amount,
    },
  },
}))

import { RaceScene } from './RaceScene'
import type { TrackConfig } from './tracks'

type TestableRaceScene = {
  state: 'racing' | 'finished'
  progress: number
  track: TrackConfig
  roadLeft: number
  roadRight: number
  car: {
    x: number
    y?: number
    setAngle?(angle: number): void
    setScale?(scale: number): void
  }
  tweens: {
    killTweensOf(target: unknown): void
    add(config: unknown): void
  }
  add: {
    star?(...args: unknown[]): {
      setStrokeStyle(...args: unknown[]): void
      setPosition(x: number, y: number): void
      setVisible(visible: boolean): void
    }
    text?(...args: unknown[]): {
      setOrigin?(...args: unknown[]): void
      setDepth?(...args: unknown[]): void
      setAngle?(...args: unknown[]): void
      setScale?(...args: unknown[]): void
      setAlpha?(...args: unknown[]): void
      setPosition?(x: number, y: number): void
      setVisible?(visible: boolean): void
      destroy?(): void
    }
    rectangle?(...args: unknown[]): {
      setDepth?(...args: unknown[]): void
      setStrokeStyle?(...args: unknown[]): void
    }
    circle?(...args: unknown[]): {
      setDepth?(...args: unknown[]): void
      setStrokeStyle?(...args: unknown[]): void
    }
    ellipse?(...args: unknown[]): {
      setStrokeStyle?(...args: unknown[]): void
    }
    container?(...args: unknown[]): {
      y?: number
      add?(child: unknown): void
      setAngle?(...args: unknown[]): void
      setScale?(...args: unknown[]): void
      setAlpha?(...args: unknown[]): void
      setDepth?(...args: unknown[]): void
      setOrigin?(...args: unknown[]): void
      setStrokeStyle?(...args: unknown[]): void
      setPosition?(x: number, y: number): void
      setVisible?(visible: boolean): void
      destroy?(): void
    }
  }
  score: number
  scoreText: { setText(text: string): void; setScale?(scale: number): void }
  scene: { start(key: string, data?: unknown): void }
  collectibles: Array<{
    x: number
    spawnProgress: number
    phase: number
    sprite: {
      y?: number
      setPosition(x: number, y: number): void
      setVisible(visible: boolean): void
      setAngle(angle: number): void
      setScale(scale: number): void
    }
    collected: boolean
  }>
  obstacles: Array<{
    x: number
    spawnProgress: number
    sprite: {
      y?: number
      setPosition(x: number, y: number): void
      setVisible(visible: boolean): void
    }
    hit: boolean
  }>
  laneDashes: Array<{
    y: number
    setPosition(x: number, y: number): void
  }>
  init(data: { trackId?: string }): void
  drawRoad(): void
  createCar(): unknown
  createLaneDashes(): void
  createCollectibles(): void
  updateCollectibles(): void
  playCollectFeedback(x: number, y: number): void
  createObstacles(): void
  updateObstacles(): void
  playObstacleFeedback(): void
  resetObstacles(): void
  createFinishLine(): { setVisible(visible: boolean): void }
  createScoreCounter(): { setOrigin(...args: unknown[]): void; setDepth(...args: unknown[]): void }
  resetCollectibles(): void
  steerCar(pointer: { worldX: number }): void
  moveRoad(delta: number): void
  positionFinishLine(): void
  finishRace(): void
  update(time: number, delta: number): void
}

function createTestScene(): TestableRaceScene {
  return new RaceScene() as unknown as TestableRaceScene
}

describe('RaceScene', () => {
  it('uses the selected track road width and falls back safely', () => {
    const scene = createTestScene()

    scene.init({ trackId: 'beach' })

    expect(scene.track.id).toBe('beach')
    expect(scene.roadLeft).toBe(292)
    expect(scene.roadRight).toBe(732)

    scene.init({ trackId: 'moon' })
    expect(scene.track.id).toBe('backyard')
  })

  it('draws the selected track road and colorful shoulders without changing bounds', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'forest' })
    scene.add = { rectangle: vi.fn(() => ({ setStrokeStyle: vi.fn() })) } as TestableRaceScene['add']

    scene.drawRoad()

    expect(scene.add.rectangle).toHaveBeenCalledWith(512, 438, 496, 660, 0xa8e063)
    expect(scene.add.rectangle).toHaveBeenCalledWith(512, 438, 460, 660, 0x3f5149)
    expect(scene.roadLeft).toBe(282)
    expect(scene.roadRight).toBe(742)
  })

  it('creates six collectible emojis from the selected track set', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'forest' })
    const emoji = () => ({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
      setAlpha: vi.fn(),
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    })
    const addText = vi.fn((_x: number, _y: number, _value: string) => emoji())
    scene.add = {
      circle: vi.fn(() => ({ setDepth: vi.fn(), setStrokeStyle: vi.fn() })),
      text: addText,
      container: vi.fn(() => emoji()),
    } as TestableRaceScene['add']

    scene.createCollectibles()

    expect(addText).toHaveBeenCalledTimes(6)
    expect(scene.collectibles).toHaveLength(6)
    expect(addText.mock.calls.map((call) => call[2])).toEqual(['🍄', '🐦', '🌰', '🍄', '🐦', '🌰'])
    expect(scene.collectibles.map(({ x }) => x)).toEqual([
      383.2,
      640.8,
      512,
      640.8,
      383.2,
      512,
    ])
    expect(scene.collectibles.every(({ x }) => x >= scene.roadLeft && x <= scene.roadRight)).toBe(true)
  })

  it('moves an active collectible down the road as race progress increases', () => {
    const scene = createTestScene()
    const sprite = {
      y: -50,
      setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }),
      setVisible: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
    }
    scene.progress = 0.1
    scene.car = { x: 700, y: 620 }
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = [{ x: 372, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

    scene.updateCollectibles()
    const firstY = sprite.y
    scene.progress = 0.2
    scene.updateCollectibles()

    expect(sprite.y).toBeGreaterThan(firstY)
  })

  it('creates four obstacle emojis from the selected track set', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'beach' })
    const obstacleSprite = () => ({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
      setAlpha: vi.fn(),
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    })
    const addText = vi.fn((_x: number, _y: number, _value: string) => obstacleSprite())
    scene.add = {
      circle: vi.fn(() => ({ setDepth: vi.fn(), setStrokeStyle: vi.fn() })),
      text: addText,
      container: vi.fn(() => obstacleSprite()),
    } as TestableRaceScene['add']

    scene.createObstacles()

    expect(addText).toHaveBeenCalledTimes(4)
    expect(scene.obstacles).toHaveLength(4)
    expect(addText.mock.calls.map((call) => call[2])).toEqual(['🦀', '⚽', '🏰', '🦀'])
    expect(scene.obstacles.every(({ x }) => x >= scene.roadLeft && x <= scene.roadRight)).toBe(true)
  })

  it('moves an active obstacle down the road as race progress increases', () => {
    const scene = createTestScene()
    const sprite = {
      y: -50,
      setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }),
      setVisible: vi.fn(),
    }
    scene.progress = 0.16
    scene.car = { x: 700, y: 620 }
    scene.scoreText = { setText: vi.fn() }
    scene.obstacles = [{ x: 512, spawnProgress: 0.08, sprite, hit: false }]

    scene.updateObstacles()
    const firstY = sprite.y
    scene.progress = 0.22
    scene.updateObstacles()

    expect(sprite.y).toBeGreaterThan(firstY)
  })

  it('hides a hit obstacle and removes ten points only once', () => {
    const scene = createTestScene()
    const y = 620
    const sprite = { setPosition: vi.fn(), setVisible: vi.fn() }
    scene.state = 'racing'
    scene.progress = 0.08 + ((y + 50) / 868) * 0.3
    scene.car = { x: 512, y, setAngle: vi.fn(), setScale: vi.fn() }
    scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }
    scene.score = 20
    scene.scoreText = { setText: vi.fn() }
    scene.obstacles = [{ x: 512, spawnProgress: 0.08, sprite, hit: false }]

    scene.updateObstacles()
    scene.updateObstacles()

    expect(scene.obstacles[0].hit).toBe(true)
    expect(sprite.setVisible).toHaveBeenLastCalledWith(false)
    expect(scene.score).toBe(10)
    expect(scene.scoreText.setText).toHaveBeenCalledTimes(1)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 10')
    expect(scene.state).toBe('racing')
  })

  it('does not reduce the score below zero after hitting an obstacle', () => {
    const scene = createTestScene()
    const y = 620
    scene.progress = 0.08 + ((y + 50) / 868) * 0.3
    scene.car = { x: 512, y, setAngle: vi.fn(), setScale: vi.fn() }
    scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }
    scene.score = 5
    scene.scoreText = { setText: vi.fn() }
    scene.obstacles = [{
      x: 512,
      spawnProgress: 0.08,
      sprite: { setPosition: vi.fn(), setVisible: vi.fn() },
      hit: false,
    }]

    scene.updateObstacles()

    expect(scene.score).toBe(0)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 0')
  })

  it('plays brief car feedback without stopping the race', () => {
    const scene = createTestScene()
    scene.state = 'racing'
    scene.car = { x: 512, y: 620, setAngle: vi.fn(), setScale: vi.fn() }
    scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }

    scene.playObstacleFeedback()

    expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(scene.car)
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
      targets: scene.car,
      angle: { from: -10, to: 0 },
      duration: 260,
      ease: 'Bounce.Out',
    }))
    expect(scene.state).toBe('racing')
  })

  it('hides a collected star and adds ten points only once', () => {
    const scene = createTestScene()
    const y = 620
    const sprite = {
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
    }
    scene.progress = 0.02 + ((y + 50) / 868) * 0.3
    scene.car = { x: 512, y }
    scene.score = 0
    scene.scoreText = { setText: vi.fn() }
    scene.playCollectFeedback = vi.fn()
    scene.collectibles = [{ x: 512, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

    scene.updateCollectibles()
    scene.updateCollectibles()

    expect(scene.collectibles[0].collected).toBe(true)
    expect(sprite.setVisible).toHaveBeenLastCalledWith(false)
    expect(scene.score).toBe(10)
    expect(scene.scoreText.setText).toHaveBeenCalledTimes(1)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 10')
  })

  it('invokes finite collection feedback after awarding ten points once', () => {
    const scene = createTestScene()
    const y = 620
    const sprite = {
      setPosition: vi.fn(), setVisible: vi.fn(), setAngle: vi.fn(), setScale: vi.fn(),
    }
    scene.progress = 0.02 + ((y + 50) / 868) * 0.3
    scene.car = { x: 512, y }
    scene.score = 0
    scene.scoreText = { setText: vi.fn() }
    scene.playCollectFeedback = vi.fn()
    scene.collectibles = [{ x: 512, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

    scene.updateCollectibles()
    scene.updateCollectibles()

    expect(scene.score).toBe(10)
    expect(scene.playCollectFeedback).toHaveBeenCalledTimes(1)
    expect(scene.playCollectFeedback).toHaveBeenCalledWith(512, 620)
  })

  it('gives visible collectibles bounded sticker motion without changing travel y', () => {
    const scene = createTestScene()
    const sprite = {
      y: -50,
      setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }),
      setVisible: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
    }
    scene.progress = 0.1
    scene.car = { x: 700, y: 620 }
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = [{ x: 372, spawnProgress: 0.02, phase: 0, sprite, collected: false }]

    scene.updateCollectibles()

    expect(sprite.setAngle).toHaveBeenCalledWith(expect.any(Number))
    expect(sprite.setScale).toHaveBeenCalledWith(expect.any(Number))
    expect(sprite.y).toBeCloseTo(181.47, 1)
  })

  it('creates a large score counter with an initial zero score', () => {
    const scene = createTestScene()
    const counter = {
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      setPosition: vi.fn(),
      setVisible: vi.fn(),
    }
    const addText = vi.fn(() => counter)
    scene.add = {
      text: addText,
      rectangle: vi.fn(() => ({ setDepth: vi.fn(), setStrokeStyle: vi.fn() })),
      circle: vi.fn(() => ({ setDepth: vi.fn(), setStrokeStyle: vi.fn() })),
    } as TestableRaceScene['add']

    const result = scene.createScoreCounter()

    expect(addText).toHaveBeenCalledWith(
      990,
      54,
      '⭐ 0',
      expect.objectContaining({ fontSize: '52px', fontStyle: 'bold' }),
    )
    expect(counter.setOrigin).toHaveBeenCalledWith(1, 0.5)
    expect(counter.setDepth).toHaveBeenCalledWith(20)
    expect(result).toBe(counter)
  })

  it('resets the score and restores every collectible', () => {
    const scene = createTestScene()
    const layout = [
      { x: 372, spawnProgress: 0.02 },
      { x: 652, spawnProgress: 0.14 },
      { x: 512, spawnProgress: 0.26 },
      { x: 652, spawnProgress: 0.38 },
      { x: 372, spawnProgress: 0.5 },
      { x: 512, spawnProgress: 0.62 },
    ]
    scene.score = 20
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = layout.map(({ x, spawnProgress }) => ({
      x,
      spawnProgress,
      phase: 0,
      sprite: {
        setPosition: vi.fn(),
        setVisible: vi.fn(),
        setAngle: vi.fn(),
        setScale: vi.fn(),
      },
      collected: true,
    }))

    scene.resetCollectibles()

    expect(scene.score).toBe(0)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 0')
    expect(scene.collectibles.every((item) => !item.collected)).toBe(true)
    scene.collectibles.forEach(({ x, sprite }) => {
      expect(sprite.setPosition).toHaveBeenCalledWith(x, -50)
      expect(sprite.setVisible).toHaveBeenCalledWith(false)
    })
  })

  it('restores every obstacle and the car transform for replay', () => {
    const scene = createTestScene()
    const layout = [
      { x: 512, spawnProgress: 0.08 },
      { x: 372, spawnProgress: 0.2 },
      { x: 652, spawnProgress: 0.44 },
      { x: 512, spawnProgress: 0.56 },
    ]
    const car = { x: 400, y: 620, setAngle: vi.fn(), setScale: vi.fn() }
    scene.car = car
    scene.tweens = { killTweensOf: vi.fn(), add: vi.fn() }
    scene.obstacles = layout.map(({ x, spawnProgress }) => ({
      x,
      spawnProgress,
      sprite: { setPosition: vi.fn(), setVisible: vi.fn() },
      hit: true,
    }))

    scene.resetObstacles()

    expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(car)
    expect(car.setAngle).toHaveBeenCalledWith(0)
    expect(car.setScale).toHaveBeenCalledWith(1)
    expect(scene.obstacles.every((obstacle) => !obstacle.hit)).toBe(true)
    scene.obstacles.forEach(({ x, sprite }) => {
      expect(sprite.setPosition).toHaveBeenCalledWith(x, -50)
      expect(sprite.setVisible).toHaveBeenCalledWith(false)
    })
  })

  it('keeps the entire rendered car inside the selected road edges when steering', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'beach' })
    scene.state = 'racing'
    scene.car = { x: 0 }

    scene.steerCar({ worldX: 0 })
    expect(scene.car.x - 65).toBeGreaterThanOrEqual(292)

    scene.steerCar({ worldX: 1_024 })
    expect(scene.car.x + 65).toBeLessThanOrEqual(732)
  })

  it('replaces old lane-dash references when the race scene starts again', () => {
    const scene = createTestScene()
    scene.add = {
      rectangle: vi.fn((_x: number, y: number) => ({
        y,
        setStrokeStyle: vi.fn(),
        setPosition: vi.fn(),
      })),
    } as TestableRaceScene['add']

    scene.createLaneDashes()
    const firstRaceDashes = [...scene.laneDashes]
    scene.createLaneDashes()

    expect(firstRaceDashes).toHaveLength(10)
    expect(scene.laneDashes).toHaveLength(10)
    expect(scene.laneDashes[0]).not.toBe(firstRaceDashes[0])
  })

  it('moves lane dashes using the selected track speed', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'forest' })
    scene.laneDashes = [{ y: 100, setPosition: vi.fn() }]

    scene.moveRoad(1_000)

    expect(scene.laneDashes[0].y).toBe(580)
  })

  it('sizes the finish line to the selected road width', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'beach' })
    const finish = { add: vi.fn(), setVisible: vi.fn(), setPosition: vi.fn() }
    const rectangle = { setStrokeStyle: vi.fn() }
    const flag = { setOrigin: vi.fn() }
    scene.add = {
      container: vi.fn(() => finish),
      rectangle: vi.fn(() => rectangle),
      text: vi.fn(() => flag),
    } as TestableRaceScene['add']

    scene.createFinishLine()

    expect(scene.add.rectangle).toHaveBeenCalledTimes(24)
    expect(scene.add.rectangle).toHaveBeenCalledWith(
      expect.any(Number),
      0,
      440 / 12,
      30,
      expect.any(Number),
    )
    expect(scene.add.text).toHaveBeenCalledTimes(2)
    expect(scene.add.text).toHaveBeenNthCalledWith(
      1,
      -440 / 2 - 28,
      28,
      '🏁',
      { fontSize: '34px', fontFamily: 'Arial, sans-serif' },
    )
    expect(scene.add.text).toHaveBeenNthCalledWith(
      2,
      440 / 2 + 28,
      28,
      '🏁',
      { fontSize: '34px', fontFamily: 'Arial, sans-serif' },
    )
  })

  it('advances race progress using selected speed over the fixed track length', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'forest' })
    scene.state = 'racing'
    scene.progress = 0
    scene.moveRoad = vi.fn()
    scene.positionFinishLine = vi.fn()

    scene.update(0, 100)

    expect(scene.progress).toBeCloseTo(100 / 10_500, 10)
  })

  it('starts the results scene once with the final race totals', () => {
    const scene = createTestScene()
    scene.init({ trackId: 'forest' })
    const sprite = {
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      setAngle: vi.fn(),
      setScale: vi.fn(),
    }
    scene.state = 'racing'
    scene.score = 30
    scene.scene = { start: vi.fn() }
    scene.collectibles = [
      { x: 372, spawnProgress: 0.02, phase: 0, sprite, collected: true },
      { x: 652, spawnProgress: 0.14, phase: 0, sprite, collected: true },
      { x: 512, spawnProgress: 0.26, phase: 0, sprite, collected: false },
    ]
    scene.obstacles = [
      { x: 512, spawnProgress: 0.08, sprite, hit: true },
      { x: 372, spawnProgress: 0.2, sprite, hit: false },
    ]

    scene.finishRace()
    scene.finishRace()

    expect(scene.state).toBe('finished')
    expect(scene.scene.start).toHaveBeenCalledTimes(1)
    expect(scene.scene.start).toHaveBeenCalledWith('results', {
      trackId: 'forest',
      score: 30,
      collected: 2,
      obstaclesHit: 1,
    })
  })

  it('keeps the finished race frozen after collectibles are added', () => {
    const scene = createTestScene()
    scene.state = 'racing'
    scene.progress = 0.99
    scene.scene = { start: vi.fn() }
    scene.collectibles = []
    scene.obstacles = []
    scene.moveRoad = vi.fn()
    scene.positionFinishLine = vi.fn()
    scene.updateCollectibles = vi.fn()
    scene.updateObstacles = vi.fn()

    scene.update(0, 120)
    const finishedProgress = scene.progress
    scene.update(120, 1_000)

    expect(scene.state).toBe('finished')
    expect(scene.scene.start).toHaveBeenCalledTimes(1)
    expect(scene.progress).toBe(finishedProgress)
    expect(scene.moveRoad).toHaveBeenCalledTimes(1)
    expect(scene.positionFinishLine).toHaveBeenCalledTimes(1)
    expect(scene.updateCollectibles).toHaveBeenCalledTimes(1)
    expect(scene.updateObstacles).toHaveBeenCalledTimes(1)
  })
})
