import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scores } from '@/lib/db/schema'
import { getAuthUser } from '@/lib/auth/jwt'

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request)
    const body = await request.json().catch(() => ({}))
    const { totalScore, maxScore = 25000, roundsPlayed = 5, details = null } = body

    if (typeof totalScore !== 'number' || totalScore < 0) {
      return NextResponse.json({ error: 'Valid totalScore number is required.' }, { status: 400 })
    }

    const userId = authUser ? Number(authUser.id) : null
    const playerName = authUser ? authUser.name : (body.playerName?.trim() || 'Guest Explorer')
    const playerAvatar = authUser ? authUser.avatar : (body.playerAvatar?.trim() || 'felix')
    const detailsStr = typeof details === 'string' ? details : details ? JSON.stringify(details) : null

    const saved = db
      .insert(scores)
      .values({
        userId,
        playerName,
        playerAvatar,
        totalScore: Math.round(totalScore),
        maxScore: Number(maxScore),
        roundsPlayed: Number(roundsPlayed),
        details: detailsStr,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get()

    return NextResponse.json(
      {
        message: 'Score recorded.',
        score: saved,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Score recording error:', err)
    return NextResponse.json({ error: 'Failed to record score.' }, { status: 500 })
  }
}
