import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { signUserToken } from '@/lib/auth/jwt'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }
    const cleanEmail = email.trim().toLowerCase()

    const user = db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, cleanEmail))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please create one.' },
        { status: 404 }
      )
    }

    const token = await signUserToken(user)

    return NextResponse.json({
      message: 'Logged in successfully.',
      user,
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Failed to sign in.' }, { status: 500 })
  }
}
