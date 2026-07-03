import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

vi.mock('./offlineReady', () => ({
  waitForOfflineReady: vi.fn(() => Promise.resolve(true)),
}))

import { waitForOfflineReady } from './offlineReady'
import { TrackSelectScene } from './TrackSelectScene'

type Handler = () => void

type TestObject = {
  active: boolean
  handlers: Record<string, Handler>
  setOrigin: ReturnType<typeof vi.fn>
  setText: ReturnType<typeof vi.fn>
  setStrokeStyle: ReturnType<typeof vi.fn>
  setInteractive: ReturnType<typeof vi.fn>
  setScale: ReturnType<typeof vi.fn>
  setSize: ReturnType<typeof vi.fn>
  add: ReturnType<typeof vi.fn>
  on(event: string, handler: Handler): TestObject
}

type TestableTrackSelectScene = {
  scene: { start: ReturnType<typeof vi.fn> }
  add: {
    rectangle: ReturnType<typeof vi.fn>
    circle: ReturnType<typeof vi.fn>
    text: ReturnType<typeof vi.fn>
    container: ReturnType<typeof vi.fn>
  }
  tweens: { add: ReturnType<typeof vi.fn> }
  create(): void
}

function createDisplayObject(): TestObject {
  return {
    active: true,
    handlers: {},
    setOrigin: vi.fn(),
    setText: vi.fn(),
    setStrokeStyle: vi.fn(),
    setInteractive: vi.fn(),
    setScale: vi.fn(),
    setSize: vi.fn(),
    add: vi.fn(),
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
  let accentStrokes: unknown[][]
  let status: TestObject | undefined

  beforeEach(() => {
    scene = new TrackSelectScene() as unknown as TestableTrackSelectScene
    scene.scene = { start: vi.fn() }
    textValues = []
    cards = []
    accentStrokes = []
    status = undefined
    scene.add = {
      rectangle: vi.fn(() => {
        const object = createDisplayObject()
        object.setStrokeStyle.mockImplementation((...args: unknown[]) => {
          accentStrokes.push(args)
          return object
        })
        return object
      }),
      container: vi.fn(() => {
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
        const object = createDisplayObject()
        if (value === 'Getting travel-ready…') status = object
        return object
      }),
    }
    scene.tweens = { add: vi.fn() }
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
    expect(accentStrokes).toEqual([
      [10, 0xffd43b],
      [10, 0xa8e063],
      [10, 0xff7f66],
    ])
  })

  it('makes each whole toy card a large pressable target', () => {
    scene.create()

    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(card.setSize).toHaveBeenCalledWith(280, 450)
      card.handlers.pointerdown()
      expect(card.setScale).toHaveBeenLastCalledWith(0.96)
      card.handlers.pointerout()
      expect(card.setScale).toHaveBeenLastCalledWith(1)
    }
  })

  it('adds one finite entrance tween for each card', () => {
    scene.create()

    expect(scene.tweens.add).toHaveBeenCalledTimes(3)
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
      duration: 180,
      ease: 'Back.Out',
    }))
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

  it('shows offline readiness only after the service worker is ready', async () => {
    scene.create()

    expect(textValues).toContain('Getting travel-ready…')
    await vi.waitFor(() => expect(status?.setText).toHaveBeenCalledWith('✅ Ready to play offline'))
  })

  it('does not update an inactive status after the service worker is ready', async () => {
    let resolveReady: (ready: boolean) => void = () => {}
    const readiness = new Promise<boolean>((resolve) => {
      resolveReady = resolve
    })
    vi.mocked(waitForOfflineReady).mockReturnValueOnce(readiness)

    scene.create()
    expect(status).toBeDefined()
    status!.active = false

    resolveReady(true)
    await readiness
    await Promise.resolve()

    expect(status!.setText).not.toHaveBeenCalled()
  })
})
