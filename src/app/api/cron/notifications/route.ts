import { NextResponse } from 'next/server'

// Bu endpoint bir cron job tarafından düzenli olarak çağrılabilir
export async function GET() {
  try {
    // 1. Otomatik bildirim kontrolü
    const autoCheckResponse = await fetch(
      `${
        process.env.NEXTAUTH_URL || 'http://localhost:3002'
      }/api/notifications/auto-check`,
      {
        method: 'POST',
      }
    )

    if (!autoCheckResponse.ok) {
      throw new Error('Auto check failed')
    }

    const autoCheckResult = await autoCheckResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Scheduled notification check completed',
      timestamp: new Date().toISOString(),
      results: autoCheckResult,
    })
  } catch (error) {
    console.error('Scheduled notification check error:', error)
    return NextResponse.json(
      {
        error: 'Scheduled notification check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  // Manuel trigger için POST method
  return GET()
}
