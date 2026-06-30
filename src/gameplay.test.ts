import { describe, expect, it } from 'vitest'

import {
  advanceRace,
  centeredBoundsOverlap,
  clampCarX,
  collectibleY,
  isRaceFinished,
} from './gameplay'

describe('clampCarX', () => {
  it('keeps the whole car inside the left road edge', () => {
    expect(clampCarX(100, 260, 764, 52)).toBe(312)
  })

  it('keeps the whole car inside the right road edge', () => {
    expect(clampCarX(900, 260, 764, 52)).toBe(712)
  })

  it('leaves positions within the road unchanged', () => {
    expect(clampCarX(500, 260, 764, 52)).toBe(500)
  })
})

describe('advanceRace', () => {
  it('advances progress by elapsed time as a fraction of race duration', () => {
    expect(advanceRace(0.25, 1_000, 10_000)).toBeCloseTo(0.35)
  })

  it('caps progress at the finish', () => {
    expect(advanceRace(0.95, 1_000, 10_000)).toBe(1)
  })
})

describe('isRaceFinished', () => {
  it('is false before the finish', () => {
    expect(isRaceFinished(0.999)).toBe(false)
  })

  it('is true at the finish', () => {
    expect(isRaceFinished(1)).toBe(true)
  })
})

describe('collectibleY', () => {
  it('places a collectible at its start position when it spawns', () => {
    expect(collectibleY(0.25, 0.25, -50, 818, 0.3)).toBe(-50)
  })

  it('moves a collectible according to race progress', () => {
    expect(collectibleY(0.4, 0.25, -50, 818, 0.3)).toBeCloseTo(384)
  })
})

describe('centeredBoundsOverlap', () => {
  const car = { x: 512, y: 620, halfWidth: 65, halfHeight: 88 }

  it('detects a collectible inside the car bounds', () => {
    const star = { x: 540, y: 650, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(true)
  })

  it('does not detect a horizontally separated collectible', () => {
    const star = { x: 700, y: 620, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(false)
  })

  it('does not detect a vertically separated collectible', () => {
    const star = { x: 512, y: 400, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(false)
  })

  it('counts touching edges as a forgiving collection', () => {
    const star = { x: 605, y: 620, halfWidth: 28, halfHeight: 28 }
    expect(centeredBoundsOverlap(car, star)).toBe(true)
  })
})
