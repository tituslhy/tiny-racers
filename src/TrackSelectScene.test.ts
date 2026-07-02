import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

import { TrackSelectScene } from './TrackSelectScene'

type Handler = () => void

type TestObject = {
  handlers: Record<string, Handler>
  setOrigin: ReturnType<typeof vi.fn>
  setStrokeStyle: ReturnType<typeof vi.fn>
  setInteractive: ReturnType<typeof vi.fn>
  setScale: ReturnType<typeof vi.fn>
  on(event: string, handler: Handler): TestObject
}

type TestableTrackSelectScene = {
  scene: { start: ReturnType<typeof vi.fn> }
  add: {
    rectangle: ReturnType<typeof vi.fn>
    circle: ReturnType<typeof vi.fn>
    text: ReturnType<typeof vi.fn>
  }
  create(): void
}

function createDisplayObject(): TestObject {
  return {
    handlers: {},
    setOrigin: vi.fn(),
    setStrokeStyle: vi.fn(),
    setInteractive: vi.fn(),
    setScale: vi.fn(),
    on(event: string, handler: Handler) {
      this.handlers[event] = handler
      return this
    },
  }
}

describe('TrackSelectScene', () => {
  let scene: TestableTrackSelectScene
  let textValues: string[]
  let cards: TestObject[]

  beforeEach(() => {
    scene = new TrackSelectScene() as unknown as TestableTrackSelectScene
    scene.scene = { start: vi.fn() }
    textValues = []
    cards = []
    scene.add = {
      rectangle: vi.fn(() => {
        const object = createDisplayObject()
        object.setInteractive.mockImplementation(() => {
          cards.push(object)
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

  it('shows three large child-friendly track choices', () => {
    scene.create()

    expect(textValues).toEqual(expect.arrayContaining([
      'Choose Your Track!',
      '🌱 Backyard',
      '🌲 Forest',
      '🏖️ Beach',
    ]))
    expect(cards).toHaveLength(3)
  })

  it('starts a race immediately with the tapped track id', () => {
    scene.create()

    cards[0].handlers.pointerup()
    cards[1].handlers.pointerup()
    cards[2].handlers.pointerup()

    expect(scene.scene.start).toHaveBeenNthCalledWith(1, 'race', { trackId: 'backyard' })
    expect(scene.scene.start).toHaveBeenNthCalledWith(2, 'race', { trackId: 'forest' })
    expect(scene.scene.start).toHaveBeenNthCalledWith(3, 'race', { trackId: 'beach' })
  })
})
