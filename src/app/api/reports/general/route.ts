import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface DepartmentSummary {
  name: string
  userCount: number
  totalTasks: number
  completedTasks: number
}

export async function GET() {
  try {
    const [projects, tasks, users] = await Promise.all([
      prisma.project.findMany({
        include: {
          tasks: {
            include: {
              assignedUser: true,
              assignedUsers: {
                include: {
                  user: true,
                },
              },
            },
          },
          members: {
            include: {
              user: true,
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
      prisma.user.findMany({
        include: {
          assignedTasks: true,
          taskAssignments: true,
        },
      }),
    ])

    // Rapor verilerini hazırla
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        totalUsers: users.length,
        completedProjects: projects.filter((p) => p.status === 'COMPLETED')
          .length,
        completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
        overdueTasks: tasks.filter((t) => {
          if (!t.endDate || t.status === 'COMPLETED') return false
          return new Date(t.endDate) < new Date()
        }).length,
      },
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        progress:
          project.tasks.length > 0
            ? Math.round(
                (project.tasks.filter((t) => t.status === 'COMPLETED').length /
                  project.tasks.length) *
                  100
              )
            : 0,
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter((t) => t.status === 'COMPLETED')
          .length,
        teamSize: project.members.length,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
      departments: users.reduce((acc, user) => {
        if (!acc[user.department]) {
          acc[user.department] = {
            name: user.department,
            userCount: 0,
            totalTasks: 0,
            completedTasks: 0,
          }
        }
        acc[user.department].userCount++

        const userTasks = [
          ...user.assignedTasks,
          ...user.taskAssignments
            .map((ta) => tasks.find((t) => t.id === ta.taskId))
            .filter(Boolean),
        ]

        userTasks.forEach((task) => {
          if (task) {
            acc[user.department].totalTasks++
            if (task.status === 'COMPLETED') {
              acc[user.department].completedTasks++
            }
          }
        })

        return acc
      }, {} as Record<string, DepartmentSummary>),
    }

    // PDF veya Excel formatında indir
    const response = new NextResponse(JSON.stringify(reportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="genel-rapor-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    })

    return response
  } catch (error) {
    console.error('Rapor oluşturulurken hata:', error)
    return NextResponse.json({ error: 'Rapor oluşturulamadı' }, { status: 500 })
  }
}
