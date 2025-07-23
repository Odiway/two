import { NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'
import { prismaWithNotifications as prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Rastgele bir user seç
    const users = await prisma.user.findMany({ take: 3 })
    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    // Rastgele bir proje seç
    const project = await prisma.project.findFirst()
    if (!project) {
      return NextResponse.json({ error: 'No projects found' }, { status: 404 })
    }

    const now = new Date()
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + 7) // 1 hafta sonra

    // Yeni görev oluştur
    const newTask = await prisma.task.create({
      data: {
        title: 'Kalite Kontrol Test Prosedürü',
        description:
          'Yeni batarya modeli için kapsamlı kalite kontrol testlerinin yapılması ve raporlanması.',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        createdById: users[0].id,
        startDate: now,
        endDate: futureDate,
      },
    })

    // Görevü kullanıcılara ata
    const assignments = []
    for (let i = 0; i < Math.min(2, users.length); i++) {
      assignments.push(
        prisma.taskAssignment.create({
          data: {
            taskId: newTask.id,
            userId: users[i].id,
            assignedAt: now,
          },
        })
      )
    }

    await Promise.all(assignments)

    // Atama bildirimleri oluştur
    const notifications = []
    for (let i = 0; i < Math.min(2, users.length); i++) {
      notifications.push({
        userId: users[i].id,
        type: 'TASK_ASSIGNED' as const,
        title: 'Yeni Görev Atandı',
        message: `Size "${newTask.title}" görevi atandı. Proje: ${
          project.name
        }. Bitiş tarihi: ${futureDate.toLocaleDateString('tr-TR')}`,
        taskId: newTask.id,
        projectId: project.id,
      })
    }

    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(notifications)
    }

    return NextResponse.json({
      success: true,
      message: 'Yeni görev oluşturuldu ve atandı',
      task: {
        id: newTask.id,
        title: newTask.title,
        assignedUsers: users.slice(0, 2).map((u: any) => u.name),
        project: project.name,
      },
      notificationsCreated: notifications.length,
    })
  } catch (error) {
    console.error('Task assignment simulation error:', error)
    return NextResponse.json(
      { error: 'Görev atama simülasyonu sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
