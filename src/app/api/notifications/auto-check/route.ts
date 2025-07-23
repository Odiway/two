import { NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function POST() {
  try {
    console.log('Starting automated notification check...')

    // Due tasks kontrolü
    const dueTasksCount = await NotificationService.checkDueTasks()
    console.log(`Created ${dueTasksCount} due task notifications`)

    // Overdue tasks kontrolü
    const overdueTasksCount = await NotificationService.checkOverdueTasks()
    console.log(`Created ${overdueTasksCount} overdue task notifications`)

    // Project deadline kontrolü
    const projectsCount = await NotificationService.checkDueProjects()
    console.log(`Created ${projectsCount} project notifications`)

    const totalCreated = dueTasksCount + overdueTasksCount + projectsCount

    return NextResponse.json({
      success: true,
      message: 'Otomatik bildirim kontrolü tamamlandı',
      statistics: {
        dueTaskNotifications: dueTasksCount,
        overdueTaskNotifications: overdueTasksCount,
        projectNotifications: projectsCount,
        totalCreated: totalCreated,
      },
    })
  } catch (error) {
    console.error('Automated notification check error:', error)
    return NextResponse.json(
      {
        error: 'Otomatik bildirim kontrolü sırasında hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
