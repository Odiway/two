import { NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'
import { prismaWithNotifications as prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Bir görevi tamamlanmış olarak işaretle
    const task = await prisma.task.findFirst({
      where: {
        status: {
          in: ['TODO', 'IN_PROGRESS'],
        },
      },
      include: {
        assignedUsers: {
          include: {
            user: true,
          },
        },
        project: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        {
          error: 'No task found to complete',
        },
        { status: 404 }
      )
    }

    // Görevi tamamla
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Tamamlanma bildirimi oluştur
    const notifications = []
    for (const assignment of task.assignedUsers) {
      notifications.push({
        userId: assignment.user.id,
        type: 'TASK_COMPLETED' as const,
        title: 'Görev Tamamlandı',
        message: `"${task.title}" görevi başarıyla tamamlandı. Proje: ${task.project.name}`,
        taskId: task.id,
        projectId: task.projectId,
      })
    }

    // Bildirimleri oluştur
    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(notifications)
    }

    // Başka bir görevi IN_PROGRESS yap
    const anotherTask = await prisma.task.findFirst({
      where: {
        status: 'TODO',
        id: { not: task.id },
      },
      include: {
        assignedUsers: {
          include: {
            user: true,
          },
        },
        project: true,
      },
    })

    if (anotherTask) {
      await prisma.task.update({
        where: { id: anotherTask.id },
        data: { status: 'IN_PROGRESS' },
      })

      // Durum değişikliği bildirimi
      const statusChangeNotifications = []
      for (const assignment of anotherTask.assignedUsers) {
        statusChangeNotifications.push({
          userId: assignment.user.id,
          type: 'TASK_STATUS_CHANGED' as const,
          title: 'Görev Durumu Değişti',
          message: `"${anotherTask.title}" görevi devam ediyor olarak işaretlendi. Proje: ${anotherTask.project.name}`,
          taskId: anotherTask.id,
          projectId: anotherTask.projectId,
        })
      }

      if (statusChangeNotifications.length > 0) {
        await NotificationService.createBulkNotifications(
          statusChangeNotifications
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Görev durumları güncellendi ve bildirimler oluşturuldu',
        completedTask: task.title,
        inProgressTask: anotherTask.title,
        notificationsCreated:
          notifications.length + statusChangeNotifications.length,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Görev durumları güncellendi ve bildirimler oluşturuldu',
      completedTask: task.title,
      inProgressTask: 'None',
      notificationsCreated: notifications.length,
    })
  } catch (error) {
    console.error('Task status simulation error:', error)
    return NextResponse.json(
      { error: 'Görev durumu simülasyonu sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
