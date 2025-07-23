import { NextResponse } from 'next/server'
import { prismaWithNotifications as prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export async function POST() {
  try {
    // Önce bir user bulalım
    const user = await prisma.user.findFirst()

    if (!user) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 404 }
      )
    }

    // Test bildirimleri oluştur
    const testNotifications = [
      {
        userId: user.id,
        type: 'TASK_DUE_SOON' as NotificationType,
        title: 'Görev Yaklaşıyor',
        message: 'Batarya kalite kontrol görevi 2 gün içinde tamamlanmalı.',
        isRead: false,
      },
      {
        userId: user.id,
        type: 'TASK_OVERDUE' as NotificationType,
        title: 'Görev Gecikmiş',
        message: 'Üretim hattı bakım görevi gecikmiş. Acilen tamamlanmalı!',
        isRead: false,
      },
      {
        userId: user.id,
        type: 'PROJECT_DUE_SOON' as NotificationType,
        title: "Proje Deadline'ı Yaklaşıyor",
        message: 'Q3 Batarya Geliştirme projesi 1 hafta içinde tamamlanmalı.',
        isRead: false,
      },
      {
        userId: user.id,
        type: 'TASK_ASSIGNED' as NotificationType,
        title: 'Yeni Görev Atandı',
        message: 'Size yeni bir kalite kontrol görevi atandı.',
        isRead: true,
      },
      {
        userId: user.id,
        type: 'TASK_STATUS_CHANGED' as NotificationType,
        title: 'Görev Durumu Değişti',
        message: 'Üretim planlaması görevi tamamlandı olarak işaretlendi.',
        isRead: true,
      },
    ]

    // Tüm bildirimleri oluştur
    const createdNotifications = await prisma.notification.createMany({
      data: testNotifications,
    })

    return NextResponse.json({
      success: true,
      message: `${createdNotifications.count} test bildirimi oluşturuldu`,
      userId: user.id,
    })
  } catch (error) {
    console.error('Test notification creation error:', error)
    return NextResponse.json(
      { error: 'Test bildirimleri oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
