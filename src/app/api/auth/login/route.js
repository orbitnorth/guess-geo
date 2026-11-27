import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { signUserToken } from '@/lib/auth/jwt'
import { verifyPassword } from '@/lib/auth/password'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username, password } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 })
    }
    const cleanUsername = username.trim().toLowerCase()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const user = db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.username})`, cleanUsername))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: 'No explorer found with this username. Please check or register.' },
        { status: 404 }
      )
    }

    if (user.password) {
      const isMatch = verifyPassword(password, user.password)
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Incorrect password. Please try again.' },
          { status: 401 }
        )
      }
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    }

    const token = await signUserToken(safeUser)

    return NextResponse.json({
      message: 'Logged in successfully.',
      user: safeUser,
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Failed to sign in.' }, { status: 500 })
  }
}
