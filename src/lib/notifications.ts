import { prismaWithNotifications as prisma } from '@/lib/prisma'

type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_COMPLETED'
  | 'TASK_STATUS_CHANGED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_DUE_SOON'
  | 'PROJECT_OVERDUE'
  | 'REMINDER'

interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  taskId?: string
  projectId?: string
}

export class NotificationService {
  // Create a single notification
  static async createNotification(data: CreateNotificationData) {
    try {
      // Type assertion to handle Prisma client type issue temporarily
      const notification = await (prisma as any).notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          taskId: data.taskId || null,
          projectId: data.projectId || null,
        },
      })
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Create notifications for multiple users
  static async createBulkNotifications(
    notifications: CreateNotificationData[]
  ) {
    try {
      const createdNotifications = await Promise.all(
        notifications.map((notification) =>
          this.createNotification(notification)
        )
      )
      return createdNotifications
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }
  }

  // Check for due tasks and create notifications
  static async checkDueTasks() {
    try {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const threeDaysFromNow = new Date(now)
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      // Get tasks due within 3 days
      const dueSoonTasks = await prisma.task.findMany({
        where: {
          endDate: {
            gte: now,
            lte: threeDaysFromNow,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
      })

      // Get overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          endDate: {
            lt: now,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
      })

      const notifications: CreateNotificationData[] = []

      // Create due soon notifications
      for (const task of dueSoonTasks) {
        const daysUntilDue = Math.ceil(
          (new Date(task.endDate!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )

        for (const assignment of task.assignedUsers) {
          notifications.push({
            userId: assignment.user.id,
            type: 'TASK_DUE_SOON',
            title: 'Görev Yaklaşıyor',
            message: `"${task.title}" görevi ${daysUntilDue} gün içinde tamamlanmalı. Proje: ${task.project.name}`,
            taskId: task.id,
            projectId: task.projectId,
          })
        }
      }

      // Create all notifications
      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications)
        console.log(`Created ${notifications.length} due task notifications`)
      }

      return notifications.length
    } catch (error) {
      console.error('Error checking due tasks:', error)
      throw error
    }
  }

  // Check for overdue tasks and create notifications
  static async checkOverdueTasks() {
    try {
      const now = new Date()

      // Get overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          endDate: {
            lt: now,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
      })

      const notifications: CreateNotificationData[] = []

      for (const task of overdueTasks) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(task.endDate!).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        for (const assignment of task.assignedUsers) {
          notifications.push({
            userId: assignment.user.id,
            type: 'TASK_OVERDUE',
            title: 'Görev Gecikmiş',
            message: `"${task.title}" görevi ${daysOverdue} gündür gecikmiş. Acilen tamamlanmalı! Proje: ${task.project.name}`,
            taskId: task.id,
            projectId: task.projectId,
          })
        }
      }

      // Create all notifications
      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications)
        console.log(
          `Created ${notifications.length} overdue task notifications`
        )
      }

      return notifications.length
    } catch (error) {
      console.error('Error checking overdue tasks:', error)
      throw error
    }
  }

  // Check for due projects and create notifications
  static async checkDueProjects() {
    try {
      const now = new Date()
      const oneWeekFromNow = new Date(now)
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

      // Get projects due within a week
      const dueSoonProjects = await prisma.project.findMany({
        where: {
          endDate: {
            gte: now,
            lte: oneWeekFromNow,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      // Get overdue projects
      const overdueProjects = await prisma.project.findMany({
        where: {
          endDate: {
            lt: now,
          },
          status: {
            not: 'COMPLETED',
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      const notifications: CreateNotificationData[] = []

      // Create project due soon notifications
      for (const project of dueSoonProjects) {
        const daysUntilDue = Math.ceil(
          (new Date(project.endDate!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )

        for (const member of project.members) {
          notifications.push({
            userId: member.user.id,
            type: 'PROJECT_DUE_SOON',
            title: 'Proje Yaklaşıyor',
            message: `"${project.name}" projesi ${daysUntilDue} gün içinde tamamlanmalı.`,
            projectId: project.id,
          })
        }
      }

      // Create overdue project notifications
      for (const project of overdueProjects) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(project.endDate!).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        for (const member of project.members) {
          notifications.push({
            userId: member.user.id,
            type: 'PROJECT_OVERDUE',
            title: 'Proje Gecikmiş',
            message: `"${project.name}" projesi ${daysOverdue} gündür gecikmiş. Acilen tamamlanmalı!`,
            projectId: project.id,
          })
        }
      }

      // Create all notifications
      if (notifications.length > 0) {
        await this.createBulkNotifications(notifications)
        console.log(
          `Created ${notifications.length} project due/overdue notifications`
        )
      }

      return notifications.length
    } catch (error) {
      console.error('Error checking due projects:', error)
      throw error
    }
  }

  // Notify when task is assigned
  static async notifyTaskAssigned(taskId: string, assignedUserIds: string[]) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!task) return

      const notifications: CreateNotificationData[] = assignedUserIds.map(
        (userId) => ({
          userId,
          type: 'TASK_ASSIGNED',
          title: 'Yeni Görev Atandı',
          message: `"${task.title}" görevi size atandı. Proje: ${task.project.name}`,
          taskId: task.id,
          projectId: task.projectId,
        })
      )

      await this.createBulkNotifications(notifications)
      return notifications.length
    } catch (error) {
      console.error('Error notifying task assigned:', error)
      throw error
    }
  }

  // Notify when task status changes
  static async notifyTaskStatusChanged(
    taskId: string,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
          project: {
            select: {
              name: true,
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })

      if (!task) return

      const statusTexts: { [key: string]: string } = {
        TODO: 'Yapılacak',
        IN_PROGRESS: 'Devam Ediyor',
        REVIEW: 'İnceleme',
        COMPLETED: 'Tamamlandı',
      }

      const notifications: CreateNotificationData[] = []

      // Notify assigned users
      for (const assignment of task.assignedUsers) {
        notifications.push({
          userId: assignment.user.id,
          type: 'TASK_STATUS_CHANGED',
          title: 'Görev Durumu Değişti',
          message: `"${task.title}" görevinin durumu "${statusTexts[oldStatus]}" iken "${statusTexts[newStatus]}" olarak değiştirildi.`,
          taskId: task.id,
          projectId: task.projectId,
        })
      }

      // If task is completed, notify all project members
      if (newStatus === 'COMPLETED') {
        for (const member of task.project.members) {
          // Don't duplicate notification for assigned users
          if (
            !task.assignedUsers.some((a: any) => a.user.id === member.user.id)
          ) {
            notifications.push({
              userId: member.user.id,
              type: 'TASK_COMPLETED',
              title: 'Görev Tamamlandı',
              message: `"${task.title}" görevi tamamlandı. Proje: ${task.project.name}`,
              taskId: task.id,
              projectId: task.projectId,
            })
          }
        }
      }

      await this.createBulkNotifications(notifications)
      return notifications.length
    } catch (error) {
      console.error('Error notifying task status changed:', error)
      throw error
    }
  }

  // Run all checks (can be called by a cron job)
  static async runAllChecks() {
    try {
      const taskNotifications = await this.checkDueTasks()
      const projectNotifications = await this.checkDueProjects()

      console.log(
        `Total notifications created: ${
          taskNotifications + projectNotifications
        }`
      )
      return taskNotifications + projectNotifications
    } catch (error) {
      console.error('Error running notification checks:', error)
      throw error
    }
  }
}
