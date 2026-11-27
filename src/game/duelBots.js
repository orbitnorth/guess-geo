import { distanceKm } from './geo.js'

export const INITIAL_HP = 5000

export const DUEL_BOTS = [
  {
    id: 'felix',
    name: 'Felix Scout',
    title: 'Rookie Explorer',
    avatar: 'felix',
    difficulty: 'Easy',
    badgeVariant: 'green',
    desc: 'Still learning continent outlines. Sometimes guesses the wrong coast!',
    minErrorKm: 750,
    maxErrorKm: 3400,
    minTimeSec: 14,
    maxTimeSec: 28,
  },
  {
    id: 'aneka',
    name: 'Aneka Skyfarer',
    title: 'Aerial Navigator',
    avatar: 'aneka',
    difficulty: 'Medium',
    badgeVariant: 'yellow',
    desc: 'Skilled at identifying mountain ranges, biomes, and architectural cues.',
    minErrorKm: 220,
    maxErrorKm: 1400,
    minTimeSec: 9,
    maxTimeSec: 20,
  },
  {
    id: 'captain',
    name: 'Captain Magellan',
    title: 'Master Cartographer',
    avatar: 'leo',
    difficulty: 'Hard',
    badgeVariant: 'purple',
    desc: 'Sailed every sea and mapped almost every world landmark by memory.',
    minErrorKm: 40,
    maxErrorKm: 550,
    minTimeSec: 6,
    maxTimeSec: 15,
  },
]

export function getRoundMultiplier(roundNumber) {
  if (roundNumber <= 2) return 1.0
  if (roundNumber <= 4) return 1.5
  return 2.0 // Sudden Death
}

/**
 * Calculates a plausible geographic guess coordinate offset by a target distance in km.
 */
export function generateBotGuess(bot, targetLocation) {
  const earthRadiusKm = 6371.0
  const minErr = bot.minErrorKm || 400
  const maxErr = bot.maxErrorKm || 2000

  // Random distance within bot's accuracy tier
  const distance = minErr + Math.random() * (maxErr - minErr)

  // Random compass bearing (0 to 2*PI radians)
  const bearing = Math.random() * 2 * Math.PI

  const phi1 = (targetLocation.lat * Math.PI) / 180
  const lambda1 = (targetLocation.lon * Math.PI) / 180
  const angularDist = distance / earthRadiusKm

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(angularDist) +
      Math.cos(phi1) * Math.sin(angularDist) * Math.cos(bearing),
  )

  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDist) * Math.cos(phi1),
      Math.cos(angularDist) - Math.sin(phi1) * Math.sin(phi2),
    )

  const degLat = Math.max(-84, Math.min(84, (phi2 * 180) / Math.PI))
  let degLon = (lambda2 * 180) / Math.PI

  // Normalize longitude to [-180, 180]
  degLon = ((degLon + 180) % 360 + 360) % 360 - 180

  // Compute simulated response time in seconds (must be within 15-second round)
  const minTime = bot.minTimeSec || bot.minSec || 3
  const maxTime = Math.min(12, bot.maxTimeSec || bot.maxSec || 10)
  const thinkTimeSec = Math.max(2, Math.round(minTime + Math.random() * (maxTime - minTime)))

  return {
    lat: degLat,
    lon: degLon,
    targetDistanceKm: distance,
    thinkTimeSec,
  }
}

/**
 * Evaluates the outcome of a duel round between Player 1 and Player 2 (Bot or human).
 */
export function calculateDuelRound({
  p1Guess,
  p2Guess,
  location,
  roundNumber = 1,
}) {
  const p1Km = p1Guess ? distanceKm(p1Guess.lat, p1Guess.lon, location.lat, location.lon) : 20000
  const p2Km = p2Guess ? distanceKm(p2Guess.lat, p2Guess.lon, location.lat, location.lon) : 20000

  const multiplier = getRoundMultiplier(roundNumber)
  const diffKm = Math.abs(p1Km - p2Km)
  const rawDamage = Math.round(diffKm * multiplier)

  let winner = 'tie'
  let p1Damage = 0
  let p2Damage = 0

  if (p1Km < p2Km) {
    winner = 'p1'
    p2Damage = rawDamage
  } else if (p2Km < p1Km) {
    winner = 'p2'
    p1Damage = rawDamage
  }

  return {
    roundNumber,
    multiplier,
    p1Km: Math.round(p1Km),
    p2Km: Math.round(p2Km),
    diffKm: Math.round(diffKm),
    winner,
    p1Damage,
    p2Damage,
  }
}
