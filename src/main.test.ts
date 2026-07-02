import { describe, expect, it, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    AUTO: 'AUTO',
    Game: vi.fn(),
    Math: {
      Linear: (start: number, end: number, amount: number) =>
        start + (end - start) * amount,
    },
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
    Scene: class {},
  },
}))

import { RaceScene } from './RaceScene'
import { ResultsScene } from './ResultsScene'
import { TrackSelectScene } from './TrackSelectScene'
import { gameConfig } from './main'

describe('game configuration', () => {
  it('starts with track selection before race and results', () => {
    expect(gameConfig.scene).toEqual([TrackSelectScene, RaceScene, ResultsScene])
  })
})
