import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface UserStats {
  id: string
  name: string
  email: string
  department: string
  position: string
  completionRate: number
  efficiency: number
  totalTasks: number
  completed: number
  inProgress: number
  overdue: number
  avgCompletionTime: number
  tasks?: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  activeProjects?: number
}

interface DepartmentStats {
  totalUsers: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  activeProjects: Set<string>
  completedProjects: Set<string>
}

interface DepartmentAnalysis {
  name: string
  users: UserStats[]
  statistics: DepartmentStats
  averages?: {
    completionRate: number
    efficiency: number
    tasksPerUser: number
  }
  riskAnalysis?: {
    highRiskUsers: number
    mediumRiskUsers: number
    lowRiskUsers: number
    riskLevel: string
  }
}

export async function GET() {
  try {
    const [users, tasks, projects] = await Promise.all([
      prisma.user.findMany({
        include: {
          assignedTasks: {
            include: {
              project: true,
            },
          },
          taskAssignments: {
            include: {
              task: {
                include: {
                  project: true,
                },
              },
            },
          },
          projects: {
            include: {
              project: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        include: {
          project: true,
          assignedUser: true,
        },
      }),
      prisma.project.findMany({
        include: {
          tasks: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      }),
    ])

    // Departman bazlı analiz
    const departmentAnalysis = users.reduce((acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = {
          name: user.department,
          users: [],
          statistics: {
            totalUsers: 0,
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0,
            activeProjects: new Set(),
            completedProjects: new Set(),
          },
        }
      }

      // Kullanıcının görevlerini topla
      const allUserTasks = [
        ...user.assignedTasks,
        ...user.taskAssignments.map((assignment) => assignment.task),
      ]

      // Tekrar eden görevleri filtrele
      const uniqueTasks = allUserTasks.filter(
        (task, index, self) => index === self.findIndex((t) => t.id === task.id)
      )

      const userCompletedTasks = uniqueTasks.filter(
        (t) => t.status === 'COMPLETED'
      )
      const userInProgressTasks = uniqueTasks.filter(
        (t) => t.status === 'IN_PROGRESS'
      )
      const userOverdueTasks = uniqueTasks.filter((task) => {
        if (!task.endDate || task.status === 'COMPLETED') return false
        return new Date(task.endDate) < new Date()
      })

      // Kullanıcının projelerini analiz et
      uniqueTasks.forEach((task) => {
        if (task.project) {
          if (
            task.project.status === 'IN_PROGRESS' ||
            task.project.status === 'PLANNING'
          ) {
            acc[user.department].statistics.activeProjects.add(task.project.id)
          } else if (task.project.status === 'COMPLETED') {
            acc[user.department].statistics.completedProjects.add(
              task.project.id
            )
          }
        }
      })

      // Kullanıcı bilgilerini ekle
      acc[user.department].users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        tasks: {
          total: uniqueTasks.length,
          completed: userCompletedTasks.length,
          inProgress: userInProgressTasks.length,
          overdue: userOverdueTasks.length,
        },
        totalTasks: uniqueTasks.length,
        completed: userCompletedTasks.length,
        inProgress: userInProgressTasks.length,
        overdue: userOverdueTasks.length,
        avgCompletionTime: 0, // Calculate if needed
        completionRate:
          uniqueTasks.length > 0
            ? Math.round((userCompletedTasks.length / uniqueTasks.length) * 100)
            : 0,
        efficiency:
          userOverdueTasks.length === 0
            ? 100
            : Math.max(0, 100 - userOverdueTasks.length * 20),
        activeProjects: user.projects.filter(
          (p) =>
            p.project.status === 'IN_PROGRESS' ||
            p.project.status === 'PLANNING'
        ).length,
      })

      // Departman istatistiklerini güncelle
      acc[user.department].statistics.totalUsers++
      acc[user.department].statistics.totalTasks += uniqueTasks.length
      acc[user.department].statistics.completedTasks +=
        userCompletedTasks.length
      acc[user.department].statistics.inProgressTasks +=
        userInProgressTasks.length
      acc[user.department].statistics.overdueTasks += userOverdueTasks.length

      return acc
    }, {} as Record<string, DepartmentAnalysis>)

    // Set'leri sayıya çevir ve ortalama hesapla
    const departmentReport = Object.values(departmentAnalysis).map(
      (dept: DepartmentAnalysis) => {
        const activeProjectsCount = dept.statistics.activeProjects.size
        const completedProjectsCount = dept.statistics.completedProjects.size

        // Departman ortalamaları
        dept.averages = {
          completionRate:
            dept.users.length > 0
              ? Math.round(
                  dept.users.reduce(
                    (sum: number, user: UserStats) => sum + user.completionRate,
                    0
                  ) / dept.users.length
                )
              : 0,
          efficiency:
            dept.users.length > 0
              ? Math.round(
                  dept.users.reduce(
                    (sum: number, user: UserStats) => sum + user.efficiency,
                    0
                  ) / dept.users.length
                )
              : 0,
          tasksPerUser:
            dept.statistics.totalUsers > 0
              ? Math.round(
                  dept.statistics.totalTasks / dept.statistics.totalUsers
                )
              : 0,
        }

        // Risk analizi
        dept.riskAnalysis = {
          highRiskUsers: dept.users.filter(
            (user: UserStats) => user.overdue >= 3 || user.efficiency < 60
          ).length,
          mediumRiskUsers: dept.users.filter(
            (user: UserStats) =>
              user.overdue >= 1 && user.overdue < 3 && user.efficiency >= 60
          ).length,
          lowRiskUsers: dept.users.filter(
            (user: UserStats) => user.overdue === 0 && user.efficiency >= 80
          ).length,
          riskLevel:
            dept.statistics.overdueTasks >= 10
              ? 'high'
              : dept.statistics.overdueTasks >= 5
              ? 'medium'
              : 'low',
        }

        return {
          name: dept.name,
          users: dept.users,
          statistics: {
            ...dept.statistics,
            activeProjects: activeProjectsCount,
            completedProjects: completedProjectsCount,
          },
          averages: dept.averages!,
          riskAnalysis: dept.riskAnalysis!,
        }
      }
    )

    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDepartments: departmentReport.length,
        totalUsers: users.length,
        totalTasks: tasks.length,
        totalProjects: projects.length,
        overallCompletionRate: Math.round(
          departmentReport.reduce(
            (sum, dept) => sum + dept.averages!.completionRate,
            0
          ) / departmentReport.length
        ),
        overallEfficiency: Math.round(
          departmentReport.reduce(
            (sum, dept) => sum + dept.averages!.efficiency,
            0
          ) / departmentReport.length
        ),
      },
      departments: departmentReport.sort(
        (a, b) => b.statistics.totalTasks - a.statistics.totalTasks
      ),
    }

    const response = new NextResponse(JSON.stringify(reportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="departman-raporu-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    })

    return response
  } catch (error) {
    console.error('Departman raporu oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Departman raporu oluşturulamadı' },
      { status: 500 }
    )
  }
}
