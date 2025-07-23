import { NextResponse } from 'next/server'
import { prismaWithNotifications as prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // Mevcut görevleri bul
    const tasks = await prisma.task.findMany({
      take: 5,
      include: {
        project: true,
        assignedUsers: {
          include: {
            user: true,
          },
        },
      },
    })

    if (tasks.length === 0) {
      return NextResponse.json(
        {
          error: 'No tasks found to update',
        },
        { status: 404 }
      )
    }

    // Görevlere çeşitli deadline'lar ata
    const updates = []

    // 1. görev - yarın bitiyor (yaklaşan)
    if (tasks[0]) {
      updates.push(
        prisma.task.update({
          where: { id: tasks[0].id },
          data: {
            endDate: tomorrow,
            status: 'IN_PROGRESS',
          },
        })
      )
    }

    // 2. görev - 3 gün sonra bitiyor (yaklaşan)
    if (tasks[1]) {
      updates.push(
        prisma.task.update({
          where: { id: tasks[1].id },
          data: {
            endDate: threeDaysFromNow,
            status: 'TODO',
          },
        })
      )
    }

    // 3. görev - dün bitmeliydi (gecikmiş)
    if (tasks[2]) {
      updates.push(
        prisma.task.update({
          where: { id: tasks[2].id },
          data: {
            endDate: yesterday,
            status: 'IN_PROGRESS',
          },
        })
      )
    }

    // 4. görev - bugün bitiyor (acil)
    if (tasks[3]) {
      updates.push(
        prisma.task.update({
          where: { id: tasks[3].id },
          data: {
            endDate: now,
            status: 'TODO',
          },
        })
      )
    }

    // Tüm güncellemeleri uygula
    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: `${updates.length} görev deadline'ı güncellendi`,
      updatedTasks: updates.length,
    })
  } catch (error) {
    console.error('Task deadline update error:', error)
    return NextResponse.json(
      { error: "Görev deadline'ları güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}
