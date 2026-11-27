import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getAuthUser, signUserToken } from '@/lib/auth/jwt'

export async function PUT(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, avatar } = body

    const updates = { updatedAt: new Date().toISOString() }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updates.name = name.trim()
    }
    if (avatar && typeof avatar === 'string' && avatar.trim().length > 0) {
      updates.avatar = avatar.trim()
    }

    const updatedUser = db
      .update(users)
      .set(updates)
      .where(eq(users.id, Number(authUser.id)))
      .returning()
      .get()

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
    }

    const token = await signUserToken(safeUser)

    return NextResponse.json({
      message: 'Profile updated successfully.',
      user: safeUser,
      token,
    })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }
}
