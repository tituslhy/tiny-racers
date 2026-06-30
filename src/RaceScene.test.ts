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

type TestableRaceScene = {
  state: 'racing' | 'finished'
  progress: number
  car: { x: number; y?: number }
  add: {
    star(...args: unknown[]): {
      setStrokeStyle(...args: unknown[]): void
      setPosition(x: number, y: number): void
      setVisible(visible: boolean): void
    }
    text(...args: unknown[]): {
      setOrigin(...args: unknown[]): void
      setDepth(...args: unknown[]): void
    }
  }
  score: number
  scoreText: { setText(text: string): void }
  finishOverlay: { setVisible(visible: boolean): void }
  collectibles: Array<{
    x: number
    spawnProgress: number
    sprite: {
      y?: number
      setPosition(x: number, y: number): void
      setVisible(visible: boolean): void
    }
    collected: boolean
  }>
  createCollectibles(): void
  updateCollectibles(): void
  createScoreCounter(): { setOrigin(...args: unknown[]): void; setDepth(...args: unknown[]): void }
  resetCollectibles(): void
  steerCar(pointer: { worldX: number }): void
  moveRoad(delta: number): void
  positionFinishLine(): void
  update(time: number, delta: number): void
}

function createTestScene(): TestableRaceScene {
  return new RaceScene() as unknown as TestableRaceScene
}

describe('RaceScene', () => {
  it('creates exactly six collectible stars', () => {
    const scene = createTestScene()
    const star = () => ({ setStrokeStyle: vi.fn(), setPosition: vi.fn(), setVisible: vi.fn() })
    const addStar = vi.fn(star)
    scene.add = { star: addStar } as TestableRaceScene['add']

    scene.createCollectibles()

    expect(addStar).toHaveBeenCalledTimes(6)
    expect(scene.collectibles).toHaveLength(6)
  })

  it('moves an active collectible down the road as race progress increases', () => {
    const scene = createTestScene()
    const sprite = { y: -50, setPosition: vi.fn((_x: number, y: number) => { sprite.y = y }), setVisible: vi.fn() }
    scene.progress = 0.1
    scene.car = { x: 700, y: 620 }
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = [{ x: 372, spawnProgress: 0.02, sprite, collected: false }]

    scene.updateCollectibles()
    const firstY = sprite.y
    scene.progress = 0.2
    scene.updateCollectibles()

    expect(sprite.y).toBeGreaterThan(firstY)
  })

  it('hides a collected star and adds ten points only once', () => {
    const scene = createTestScene()
    const y = 620
    const sprite = { setPosition: vi.fn(), setVisible: vi.fn() }
    scene.progress = 0.02 + ((y + 50) / 868) * 0.3
    scene.car = { x: 512, y }
    scene.score = 0
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = [{ x: 512, spawnProgress: 0.02, sprite, collected: false }]

    scene.updateCollectibles()
    scene.updateCollectibles()

    expect(scene.collectibles[0].collected).toBe(true)
    expect(sprite.setVisible).toHaveBeenLastCalledWith(false)
    expect(scene.score).toBe(10)
    expect(scene.scoreText.setText).toHaveBeenCalledTimes(1)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 10')
  })

  it('creates a large score counter with an initial zero score', () => {
    const scene = createTestScene()
    const counter = { setOrigin: vi.fn(), setDepth: vi.fn() }
    const addText = vi.fn(() => counter)
    scene.add = { text: addText } as TestableRaceScene['add']

    const result = scene.createScoreCounter()

    expect(addText).toHaveBeenCalledWith(
      990,
      54,
      '⭐ 0',
      expect.objectContaining({ fontSize: '46px', fontStyle: 'bold' }),
    )
    expect(counter.setOrigin).toHaveBeenCalledWith(1, 0.5)
    expect(counter.setDepth).toHaveBeenCalledWith(20)
    expect(result).toBe(counter)
  })

  it('resets the score and restores every collectible', () => {
    const scene = createTestScene()
    const firstSprite = { setPosition: vi.fn(), setVisible: vi.fn() }
    const secondSprite = { setPosition: vi.fn(), setVisible: vi.fn() }
    scene.score = 20
    scene.scoreText = { setText: vi.fn() }
    scene.collectibles = [
      { x: 372, spawnProgress: 0.02, sprite: firstSprite, collected: true },
      { x: 652, spawnProgress: 0.14, sprite: secondSprite, collected: true },
    ]

    scene.resetCollectibles()

    expect(scene.score).toBe(0)
    expect(scene.scoreText.setText).toHaveBeenCalledWith('⭐ 0')
    expect(scene.collectibles.every((item) => !item.collected)).toBe(true)
    expect(firstSprite.setVisible).toHaveBeenCalledWith(false)
    expect(secondSprite.setVisible).toHaveBeenCalledWith(false)
  })

  it('keeps the entire rendered car inside both road edges when steering', () => {
    const scene = createTestScene()
    scene.state = 'racing'
    scene.car = { x: 0 }

    scene.steerCar({ worldX: 0 })
    expect(scene.car.x - 65).toBeGreaterThanOrEqual(260)

    scene.steerCar({ worldX: 1_024 })
    expect(scene.car.x + 65).toBeLessThanOrEqual(764)
  })

  it('advances race progress using the full frame delta', () => {
    const scene = createTestScene()
    scene.state = 'racing'
    scene.progress = 0
    scene.moveRoad = vi.fn()
    scene.positionFinishLine = vi.fn()

    scene.update(0, 100)

    expect(scene.progress).toBeCloseTo(100 / 12_000, 10)
  })

  it('keeps the finished race frozen after collectibles are added', () => {
    const scene = createTestScene()
    const overlay = { setVisible: vi.fn() }
    scene.state = 'racing'
    scene.progress = 0.99
    scene.finishOverlay = overlay
    scene.moveRoad = vi.fn()
    scene.positionFinishLine = vi.fn()
    scene.updateCollectibles = vi.fn()

    scene.update(0, 120)
    const finishedProgress = scene.progress
    scene.update(120, 1_000)

    expect(scene.state).toBe('finished')
    expect(overlay.setVisible).toHaveBeenCalledWith(true)
    expect(scene.progress).toBe(finishedProgress)
    expect(scene.updateCollectibles).toHaveBeenCalledTimes(1)
  })
})
