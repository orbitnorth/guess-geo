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
