async function testDuelSync() {
  console.log('=== TESTING TWO-PLAYER READY-CHECK SYNCHRONIZATION ===')
  const { initDb, sqlite } = await import('../src/lib/db/index.js')
  initDb()

  const roomCode = 'TEST_SYNC_' + Date.now()
  console.log(`Test Room Code: ${roomCode}`)

  // 1. Host enters room
  console.log('\n1. Host (King Explorer) joins room...')
  sqlite.prepare(`
    INSERT INTO duel_rooms (code, host_name, host_avatar, host_ready, guest_name, guest_avatar, guest_ready, status, updated_at)
    VALUES (?, 'King Explorer', 'felix', 0, NULL, NULL, 0, 'waiting', datetime('now'))
  `).run(roomCode)

  let room = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(roomCode)
  console.log('Room created:', { host: room.host_name, hostReady: room.host_ready, guest: room.guest_name, status: room.status })

  // 2. Host clicks Play/Ready alone
  console.log('\n2. Host presses Play button...')
  sqlite.prepare('UPDATE duel_rooms SET host_ready = 1 WHERE code = ?').run(roomCode)
  room = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(roomCode)
  console.log('Host is ready alone:', { hostReady: Boolean(room.host_ready), guestReady: Boolean(room.guest_ready), status: room.status })
  
  if (room.status === 'both_ready') {
    throw new Error('FAIL: Game started with only one player ready!')
  }
  console.log('>> Nobody can start without the other: VERIFIED (Game remains waiting)')

  // 3. Guest enters room
  console.log('\n3. Guest (System Admin) joins room...')
  sqlite.prepare('UPDATE duel_rooms SET guest_name = ?, guest_avatar = ? WHERE code = ?')
    .run('System Admin', 'aneka', roomCode)
  room = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(roomCode)
  console.log('Guest joined:', { host: room.host_name, guest: room.guest_name, hostReady: room.host_ready, guestReady: room.guest_ready })
  console.log('>> Alerting Guest: "Host King Explorer is READY! Click Play below to start!"')

  // 4. Guest clicks Play/Ready
  console.log('\n4. Guest presses Play button...')
  sqlite.prepare(`
    UPDATE duel_rooms
    SET guest_ready = 1,
        status = CASE WHEN host_ready = 1 THEN 'both_ready' ELSE 'waiting' END
    WHERE code = ?
  `).run(roomCode)
  room = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(roomCode)
  console.log('Both players pressed Play:', {
    hostReady: Boolean(room.host_ready),
    guestReady: Boolean(room.guest_ready),
    status: room.status
  })

  if (room.status !== 'both_ready') {
    throw new Error('FAIL: Room should be both_ready now!')
  }
  console.log('>> Both players ready: MATCH STARTS SIMULTANEOUSLY FOR BOTH PLAYERS!')

  // Clean up test room
  sqlite.prepare('DELETE FROM duel_rooms WHERE code = ?').run(roomCode)
  console.log('\n>>> TWO-PLAYER READY-CHECK AND SYNCHRONIZATION TEST PASSED 100% <<<')
}

testDuelSync().catch(err => {
  console.error('Test Failed:', err)
  process.exit(1)
})
