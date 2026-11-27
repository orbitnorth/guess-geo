import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { signUserToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, username, password, avatar } = body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name must be at least 2 characters long.' }, { status: 400 })
    }
    const cleanName = name.trim()

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 })
    }
    const cleanUsername = username.trim().toLowerCase()
    const usernameRegex = /^[a-z0-9_.-]{3,24}$/
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username must be 3-24 characters and only contain letters, numbers, dots, or underscores.' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long.' }, { status: 400 })
    }

    // Validate avatar
    if (!avatar || typeof avatar !== 'string') {
      return NextResponse.json({ error: 'Please choose your cartoon explorer avatar.' }, { status: 400 })
    }
    const cleanAvatar = avatar.trim()

    // Check if username is already taken
    const existing = db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.username})`, cleanUsername))
      .get()

    if (existing) {
      return NextResponse.json(
        { error: 'This username is already taken. Please choose another.', existing: true },
        { status: 409 }
      )
    }

    const hashedPassword = hashPassword(password)
    const now = new Date().toISOString()

    const newUser = db
      .insert(users)
      .values({
        username: cleanUsername,
        password: hashedPassword,
        name: cleanName,
        avatar: cleanAvatar,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()

    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
    }

    const token = await signUserToken(safeUser)

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: safeUser,
        token,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }
}
