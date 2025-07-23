import { NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function POST() {
  try {
    // Tüm bildirimler için kontrol yap
    await NotificationService.checkDueTasks()
    await NotificationService.checkOverdueTasks()

    return NextResponse.json({
      success: true,
      message: 'Bildirimler kontrol edildi ve oluşturuldu',
    })
  } catch (error) {
    console.error('Notification check error:', error)
    return NextResponse.json(
      { error: 'Bildirimler kontrol edilirken hata oluştu' },
      { status: 500 }
    )
  }
}
