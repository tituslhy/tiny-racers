export type TrackId = 'backyard' | 'forest' | 'beach'

export interface TrackConfig {
  id: TrackId
  name: string
  emoji: string
  skyColor: number
  groundColor: number
  accentColor: number
  roadWidth: number
  speed: number
  collectibles: readonly string[]
  obstacles: readonly string[]
}

export const TRACK_LENGTH = 5_040

export const TRACKS = {
  backyard: {
    id: 'backyard',
    name: 'Backyard',
    emoji: '🌱',
    skyColor: 0x38bdf8,
    groundColor: 0x65c466,
    accentColor: 0xffd43b,
    roadWidth: 504,
    speed: 420,
    collectibles: ['🌼', '🍌', '🦋'],
    obstacles: ['🧱', '🪣', '🧹'],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    skyColor: 0xa7e4d1,
    groundColor: 0x277a45,
    accentColor: 0xa8e063,
    roadWidth: 460,
    speed: 480,
    collectibles: ['🍄', '🐦', '🌰'],
    obstacles: ['🪨', '🪵', '🌳'],
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    skyColor: 0x54d6dd,
    groundColor: 0xf4cf79,
    accentColor: 0xff7f66,
    roadWidth: 440,
    speed: 540,
    collectibles: ['🐚', '🥥', '⭐'],
    obstacles: ['🦀', '⚽', '🏰'],
  },
} as const satisfies Record<TrackId, TrackConfig>

export function getTrack(trackId?: string): TrackConfig {
  return TRACKS[trackId as TrackId] ?? TRACKS.backyard
}

export function raceDurationMs(speed: number): number {
  return (TRACK_LENGTH / speed) * 1000
}
