import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getAuthUser } from '@/lib/auth/jwt'

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required. Bearer token missing or invalid.' }, { status: 401 })
    }

    const user = db
      .select()
      .from(users)
      .where(eq(users.id, Number(authUser.id)))
      .get()

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Auth /me error:', err)
    return NextResponse.json({ error: 'Failed to retrieve profile.' }, { status: 500 })
  }
}
