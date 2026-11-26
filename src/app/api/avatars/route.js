import { NextResponse } from 'next/server'
import { AVATARS } from '@/lib/data/avatars'

export async function GET() {
  return NextResponse.json({ avatars: AVATARS })
}
