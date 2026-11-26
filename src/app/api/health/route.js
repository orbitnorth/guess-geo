import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'GeoGuess Globe Next.js API',
    time: new Date().toISOString(),
  })
}
