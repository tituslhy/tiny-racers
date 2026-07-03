import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

import { ResultsScene } from './ResultsScene'

type Handler = () => void

type TestButton = {
  width: number
  height: number
  handlers: Record<string, Handler>
  setOrigin: ReturnType<typeof vi.fn>
  setStrokeStyle: ReturnType<typeof vi.fn>
  setInteractive: ReturnType<typeof vi.fn>
  setScale: ReturnType<typeof vi.fn>
  setDepth: ReturnType<typeof vi.fn>
  setAlpha: ReturnType<typeof vi.fn>
  setAngle: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  on(event: string, handler: Handler): TestButton
}

type TestableResultsScene = {
  scene: { start: ReturnType<typeof vi.fn> }
  add: {
    rectangle: ReturnType<typeof vi.fn>
    circle: ReturnType<typeof vi.fn>
    text: ReturnType<typeof vi.fn>
  }
  tweens: { add: ReturnType<typeof vi.fn> }
  init(data: { trackId: string; score: number; collected: number; obstaclesHit: number }): void
  create(): void
}

function createDisplayObject(width = 0, height = 0) {
  return {
    width,
    height,
    setOrigin: vi.fn(),
    setStrokeStyle: vi.fn(),
    setInteractive: vi.fn(),
    setScale: vi.fn(),
    setDepth: vi.fn(),
    setAlpha: vi.fn(),
    setAngle: vi.fn(),
    destroy: vi.fn(),
    handlers: {} as Record<string, Handler>,
    on(event: string, handler: Handler) {
      this.handlers[event] = handler
      return this
    },
  }
}

describe('ResultsScene', () => {
  let scene: TestableResultsScene
  let textValues: string[]
  let interactiveButtons: TestButton[]

  beforeEach(() => {
    scene = new ResultsScene() as unknown as TestableResultsScene
    scene.scene = { start: vi.fn() }
    textValues = []
    interactiveButtons = []
    scene.tweens = { add: vi.fn() }
    scene.add = {
      rectangle: vi.fn((_x: number, _y: number, width: number, height: number) => {
        const object = createDisplayObject(width, height)
        object.setInteractive.mockImplementation(() => {
          interactiveButtons.push(object)
          return object
        })
        return object
      }),
      circle: vi.fn(createDisplayObject),
      text: vi.fn((_x: number, _y: number, value: string) => {
        textValues.push(value)
        return createDisplayObject()
      }),
    }
  })

  it('shows a cheerful completion message and every final total', () => {
    scene.init({ trackId: 'beach', score: 30, collected: 4, obstaclesHit: 2 })

    scene.create()

    expect(textValues).toEqual(expect.arrayContaining([
      'Amazing Driving!',
      '🏆',
      'SCORE',
      '30',
      '4',
      'Collected',
      '2',
      'Silly Bumps',
      'Race Again',
      'Choose Track',
    ]))
  })

  it('uses two immediate child-sized action targets', () => {
    scene.init({ trackId: 'backyard', score: 0, collected: 0, obstaclesHit: 0 })
    scene.create()

    expect(interactiveButtons).toHaveLength(2)
    for (const button of interactiveButtons) {
      expect(button.width).toBeGreaterThanOrEqual(480)
      expect(button.height).toBeGreaterThanOrEqual(96)
    }
  })

  it('keeps score zero cheerful and starts only finite celebration tweens', () => {
    scene.init({ trackId: 'backyard', score: -10, collected: 0, obstaclesHit: 0 })
    scene.create()

    expect(textValues).toContain('Amazing Driving!')
    expect(textValues).toContain('0')
    expect(textValues).not.toEqual(expect.arrayContaining(['Game Over', 'You Lost']))
    expect(scene.tweens.add).toHaveBeenCalled()
    for (const [config] of scene.tweens.add.mock.calls) {
      expect(config).not.toEqual(expect.objectContaining({ repeat: -1 }))
    }
  })

  it('starts a fresh race from the large replay button', () => {
    scene.init({ trackId: 'forest', score: 0, collected: 0, obstaclesHit: 0 })
    scene.create()

    interactiveButtons[0].handlers.pointerup()

    expect(scene.scene.start).toHaveBeenCalledWith('race', { trackId: 'forest' })
  })

  it('returns to track selection from the second large button', () => {
    scene.init({ trackId: 'backyard', score: 0, collected: 0, obstaclesHit: 0 })
    scene.create()

    interactiveButtons[1].handlers.pointerup()

    expect(scene.scene.start).toHaveBeenCalledWith('track-select')
  })
})
