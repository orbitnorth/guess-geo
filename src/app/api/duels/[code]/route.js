import { NextResponse } from 'next/server'
import { sqlite, initDb } from '@/lib/db'

export async function GET(request, context) {
  try {
    initDb()
    const { code } = await context.params
    const cleanCode = (code || '').trim()

    if (!cleanCode) {
      return NextResponse.json({ error: 'Room code required' }, { status: 400 })
    }

    const row = sqlite
      .prepare('SELECT * FROM duel_rooms WHERE code = ?')
      .get(cleanCode)

    if (!row) {
      return NextResponse.json({ room: null })
    }

    return NextResponse.json({
      room: {
        code: row.code,
        hostName: row.host_name,
        hostAvatar: row.host_avatar,
        hostReady: Boolean(row.host_ready),
        guestName: row.guest_name,
        guestAvatar: row.guest_avatar,
        guestReady: Boolean(row.guest_ready),
        status: row.status,
        updatedAt: row.updated_at,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request, context) {
  try {
    initDb()
    const { code } = await context.params
    const cleanCode = (code || '').trim()

    if (!cleanCode) {
      return NextResponse.json({ error: 'Room code required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { action = 'join', role = 'host', name = 'Explorer', avatar = 'felix' } = body
    const now = new Date().toISOString()

    let row = sqlite
      .prepare('SELECT * FROM duel_rooms WHERE code = ?')
      .get(cleanCode)

    if (!row) {
      // Create room
      sqlite
        .prepare(`
          INSERT INTO duel_rooms (code, host_name, host_avatar, host_ready, guest_name, guest_avatar, guest_ready, status, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          cleanCode,
          role === 'host' ? name : null,
          role === 'host' ? avatar : null,
          0,
          role === 'guest' ? name : null,
          role === 'guest' ? avatar : null,
          0,
          'waiting',
          now
        )
      row = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(cleanCode)
    }

    let hostName = row.host_name
    let hostAvatar = row.host_avatar
    let hostReady = row.host_ready
    let guestName = row.guest_name
    let guestAvatar = row.guest_avatar
    let guestReady = row.guest_ready
    let status = row.status

    if (action === 'join') {
      if (role === 'host') {
        hostName = name
        hostAvatar = avatar
      } else {
        guestName = name
        guestAvatar = avatar
      }
    } else if (action === 'ready') {
      if (role === 'host') {
        hostReady = 1
        if (name) hostName = name
        if (avatar) hostAvatar = avatar
      } else {
        guestReady = 1
        if (name) guestName = name
        if (avatar) guestAvatar = avatar
      }
    } else if (action === 'unready') {
      if (role === 'host') hostReady = 0
      else guestReady = 0
      status = 'waiting'
    }

    // Check if both players are present and ready
    if (hostName && guestName && hostReady === 1 && guestReady === 1) {
      status = 'both_ready'
    } else if (status === 'both_ready' && (hostReady === 0 || guestReady === 0)) {
      status = 'waiting'
    }

    sqlite
      .prepare(`
        UPDATE duel_rooms
        SET host_name = ?, host_avatar = ?, host_ready = ?,
            guest_name = ?, guest_avatar = ?, guest_ready = ?,
            status = ?, updated_at = ?
        WHERE code = ?
      `)
      .run(hostName, hostAvatar, hostReady, guestName, guestAvatar, guestReady, status, now, cleanCode)

    const updated = sqlite.prepare('SELECT * FROM duel_rooms WHERE code = ?').get(cleanCode)

    return NextResponse.json({
      success: true,
      room: {
        code: updated.code,
        hostName: updated.host_name,
        hostAvatar: updated.host_avatar,
        hostReady: Boolean(updated.host_ready),
        guestName: updated.guest_name,
        guestAvatar: updated.guest_avatar,
        guestReady: Boolean(updated.guest_ready),
        status: updated.status,
        updatedAt: updated.updated_at,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
