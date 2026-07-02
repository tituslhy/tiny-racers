import { describe, expect, it } from 'vitest'

import { getTrack, raceDurationMs, TRACKS } from './tracks'

describe('track configuration', () => {
  it('defines exactly the three requested tracks', () => {
    expect(Object.keys(TRACKS)).toEqual(['backyard', 'forest', 'beach'])
  })

  it('keeps every track explicit and lightweight', () => {
    expect(TRACKS.backyard).toMatchObject({
      name: 'Backyard',
      emoji: '🌱',
      roadWidth: 504,
      speed: 420,
      collectibles: ['🌼', '🍌', '🦋'],
      obstacles: ['🧱', '🪣', '🧹'],
    })
    expect(TRACKS.forest).toMatchObject({
      name: 'Forest',
      emoji: '🌲',
      roadWidth: 460,
      speed: 480,
      collectibles: ['🍄', '🐦', '🌰'],
      obstacles: ['🪨', '🪵', '🌳'],
    })
    expect(TRACKS.beach).toMatchObject({
      name: 'Beach',
      emoji: '🏖️',
      roadWidth: 440,
      speed: 540,
      collectibles: ['🐚', '🥥', '⭐'],
      obstacles: ['🦀', '⚽', '🏰'],
    })
  })

  it('falls back to Backyard for missing or invalid track ids', () => {
    expect(getTrack()).toBe(TRACKS.backyard)
    expect(getTrack('moon')).toBe(TRACKS.backyard)
  })

  it('derives race duration from a fixed track length and selected speed', () => {
    expect(raceDurationMs(TRACKS.backyard.speed)).toBe(12_000)
    expect(raceDurationMs(TRACKS.forest.speed)).toBe(10_500)
    expect(raceDurationMs(TRACKS.beach.speed)).toBeCloseTo(9_333.33, 2)
  })
})
