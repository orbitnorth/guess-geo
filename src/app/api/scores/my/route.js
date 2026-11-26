import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { scores } from '@/lib/db/schema'
import { getAuthUser } from '@/lib/auth/jwt'

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const userId = Number(authUser.id)

    const userScores = db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(desc(scores.createdAt))
      .all()

    const gamesPlayed = userScores.length
    const highestScore = gamesPlayed > 0 ? Math.max(...userScores.map((s) => s.totalScore)) : 0
    const averageScore =
      gamesPlayed > 0 ? Math.round(userScores.reduce((acc, s) => acc + s.totalScore, 0) / gamesPlayed) : 0

    return NextResponse.json({
      stats: {
        gamesPlayed,
        highestScore,
        averageScore,
      },
      scores: userScores,
    })
  } catch (err) {
    console.error('My scores error:', err)
    return NextResponse.json({ error: 'Failed to retrieve scores.' }, { status: 500 })
  }
}
