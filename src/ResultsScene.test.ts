import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

import { ResultsScene } from './ResultsScene'

type Handler = () => void

type TestButton = {
  handlers: Record<string, Handler>
  setOrigin: ReturnType<typeof vi.fn>
  setStrokeStyle: ReturnType<typeof vi.fn>
  setInteractive: ReturnType<typeof vi.fn>
  setScale: ReturnType<typeof vi.fn>
  on(event: string, handler: Handler): TestButton
}

type TestableResultsScene = {
  scene: { start: ReturnType<typeof vi.fn> }
  add: {
    rectangle: ReturnType<typeof vi.fn>
    circle: ReturnType<typeof vi.fn>
    text: ReturnType<typeof vi.fn>
  }
  init(data: { trackId: string; score: number; collected: number; obstaclesHit: number }): void
  create(): void
}

function createDisplayObject() {
  return {
    setOrigin: vi.fn(),
    setStrokeStyle: vi.fn(),
    setInteractive: vi.fn(),
    setScale: vi.fn(),
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
    scene.add = {
      rectangle: vi.fn(() => {
        const object = createDisplayObject()
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
      'Score: 30',
      'Collected: 4 items',
      'Obstacles Hit: 2',
      'Race Again',
      'Choose Track',
    ]))
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
