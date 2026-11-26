import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { scores, users } from '@/lib/db/schema'

export async function GET() {
  try {
    const topScores = db
      .select({
        id: scores.id,
        totalScore: scores.totalScore,
        maxScore: scores.maxScore,
        createdAt: scores.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(scores)
      .leftJoin(users, eq(scores.userId, users.id))
      .orderBy(desc(scores.totalScore), desc(scores.createdAt))
      .limit(20)
      .all()

    return NextResponse.json({ leaderboard: topScores })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Failed to retrieve leaderboard.' }, { status: 500 })
  }
}
