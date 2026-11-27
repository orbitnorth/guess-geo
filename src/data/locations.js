// ---------------------------------------------------------------------
//  ROUND DATA
//  Locations live in ./locations.json. Every location has a photo plus
//  the real latitude / longitude used for scoring. Photos come from
//  Wikimedia Commons; the URLs request a resized version so the panel
//  loads quickly.
// ---------------------------------------------------------------------
import locationsData from './locations.json' with { type: 'json' }

export const ROUNDS = 5
export const MAX_POINTS = 5000
export const MAX_TOTAL = ROUNDS * MAX_POINTS

export const LOCATIONS = locationsData

export function buildDeck(excludeIds = []) {
  const excluded = new Set(excludeIds)
  const fresh = LOCATIONS.filter((loc) => !excluded.has(loc.id))
  const pool = fresh.length >= ROUNDS ? fresh : [...LOCATIONS]
  // Fisher-Yates shuffle - unbiased and easy to read.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, ROUNDS)
}

/**
 * Builds a deterministic deck using a seed string (e.g. room code)
 * so all players in the same room get the identical locations in identical order.
 */
export function buildDeckFromSeed(seedString = 'DUEL', count = 7) {
  let s = 0
  const cleanSeed = (seedString || 'DUEL').trim().toUpperCase()
  for (let i = 0; i < cleanSeed.length; i += 1) {
    s = (s << 5) - s + cleanSeed.charCodeAt(i)
    s |= 0
  }

  // Mulberry32 deterministic PRNG
  const random = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const pool = [...LOCATIONS]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

// Exponential falloff: a perfect guess earns MAX_POINTS, a guess 1,500 km
// away earns roughly 37% of that. Matches the original game's scoring.
export function scoreForDistance(km) {
  return Math.round(MAX_POINTS * Math.exp(-km / 1500))
}

export function tierForPoints(points) {
  if (points > 3500) return 'great'
  if (points > 1000) return 'okay'
  return 'bad'
}

export const TIER_LABEL = {
  great: 'Pinpoint',
  okay: 'Solid find',
  bad: 'Far from home',
}
