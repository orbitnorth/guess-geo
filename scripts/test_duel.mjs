import fs from 'node:fs'

async function runTest() {
  console.log('=== 1. TESTING PRESEEDED USERS AUTHENTICATION ===')
  const { initDb, sqlite } = await import('../src/lib/db/index.js')
  initDb()

  const users = sqlite
    .prepare("SELECT id, username, name, avatar FROM users WHERE username IN ('king', 'admin')")
    .all()
  console.log('Preseeded users found:', users)

  const { verifyPassword } = await import('../src/lib/auth/password.js')
  for (const u of users) {
    const row = sqlite.prepare('SELECT password FROM users WHERE id = ?').get(u.id)
    const ok = verifyPassword('1234', row.password)
    console.log(`User '${u.username}' (password: 1234) valid: ${ok ? 'YES' : 'NO'}`)
    if (!ok) throw new Error(`Auth check failed for user: ${u.username}`)
  }

  console.log('\n=== 2. TESTING 1v1 ROOM DECK SYNCHRONIZATION ===')
  const { buildDeckFromSeed } = await import('../src/data/locations.js')
  const roomCode = '708caa73-c865-41cd-93at-193ce105b387'

  const deckPlayer1 = buildDeckFromSeed(roomCode, 7)
  const deckPlayer2 = buildDeckFromSeed(roomCode, 7)

  console.log(`Room Code: ${roomCode}`)
  console.log('Player 1 (king) Deck:', deckPlayer1.map((l) => l.name))
  console.log('Player 2 (admin) Deck:', deckPlayer2.map((l) => l.name))

  const isIdentical =
    JSON.stringify(deckPlayer1.map((l) => l.id)) === JSON.stringify(deckPlayer2.map((l) => l.id))
  console.log('Both players get identical 7 locations in identical order:', isIdentical ? 'PASS' : 'FAIL')
  if (!isIdentical) throw new Error('Location decks did not match!')

  console.log('\n=== 3. TESTING 1V1 MATCH SIMULATION (ROUNDS, DAMAGE & KNOCKOUT) ===')
  const { calculateDuelRound, generateBotGuess } = await import('../src/game/duelBots.js')

  let p1Hp = 5000
  let p2Hp = 5000

  for (let round = 1; round <= 7; round += 1) {
    const loc = deckPlayer1[round - 1]

    // Simulate King Explorer's pin
    const p1Pin = { lat: loc.lat + 0.3 * round, lon: loc.lon + 0.4 * round }
    // Simulate Host/Opponent's pin
    const bot = {
      id: `friend_${roomCode}`,
      minTimeSec: 3,
      maxTimeSec: 9,
      baseErrorKm: 450,
      varianceKm: 280,
    }
    const p2Pin = generateBotGuess(bot, loc)

    const outcome = calculateDuelRound({
      p1Guess: p1Pin,
      p2Guess: p2Pin,
      location: loc,
      roundNumber: round,
    })

    if (outcome.winner === 'p1') {
      p2Hp = Math.max(0, p2Hp - outcome.p2Damage)
    } else if (outcome.winner === 'p2') {
      p1Hp = Math.max(0, p1Hp - outcome.p1Damage)
    }

    console.log(
      `Round ${round} (${loc.name}): Multiplier ${outcome.multiplier}x | King: ${outcome.p1Km} km | Host: ${outcome.p2Km} km | Winner: ${outcome.winner} | King HP: ${p1Hp} | Host HP: ${p2Hp}`
    )

    if (p1Hp <= 0 || p2Hp <= 0) {
      console.log(
        `\n>> MATCH OVER BY KNOCKOUT in Round ${round}! Winner: ${p1Hp > p2Hp ? 'King Explorer (P1)' : 'System Admin (P2)'}`
      )
      break
    }
  }

  console.log('\n>>> ALL 1v1 DUEL TESTS PASSED WITH 100% SUCCESS! <<<')
}

runTest().catch((err) => {
  console.error('Test Failed:', err)
  process.exit(1)
})
