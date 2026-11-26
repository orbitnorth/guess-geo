import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { signUserToken } from '@/lib/auth/jwt'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, name, avatar } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }
    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long.' }, { status: 400 })
    }
    const cleanName = name.trim()

    if (!avatar || typeof avatar !== 'string') {
      return NextResponse.json({ error: 'Please select an avatar.' }, { status: 400 })
    }
    const cleanAvatar = avatar.trim()

    const existing = db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, cleanEmail))
      .get()

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.', existing: true },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const newUser = db
      .insert(users)
      .values({
        email: cleanEmail,
        name: cleanName,
        avatar: cleanAvatar,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()

    const token = await signUserToken(newUser)

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: newUser,
        token,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }
}
