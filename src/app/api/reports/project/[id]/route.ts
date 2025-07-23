import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 })
    }

    // Proje analizini hazırla
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED')
    const inProgressTasks = project.tasks.filter(
      (t) => t.status === 'IN_PROGRESS'
    )
    const todoTasks = project.tasks.filter((t) => t.status === 'TODO')
    const reviewTasks = project.tasks.filter((t) => t.status === 'REVIEW')

    const overdueTasks = project.tasks.filter((task) => {
      if (!task.endDate || task.status === 'COMPLETED') return false
      return new Date(task.endDate) < new Date()
    })

    const progress =
      project.tasks.length > 0
        ? Math.round((completedTasks.length / project.tasks.length) * 100)
        : 0

    // Takım üyeleri analizi
    const teamAnalysis = project.members.map((member) => {
      const memberTasks = project.tasks.filter(
        (task) =>
          task.assignedUser?.id === member.user.id ||
          task.assignedUsers.some((au) => au.user.id === member.user.id)
      )

      return {
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          department: member.user.department,
          position: member.user.position,
        },
        role: member.role,
        tasks: {
          total: memberTasks.length,
          completed: memberTasks.filter((t) => t.status === 'COMPLETED').length,
          inProgress: memberTasks.filter((t) => t.status === 'IN_PROGRESS')
            .length,
          todo: memberTasks.filter((t) => t.status === 'TODO').length,
          overdue: memberTasks.filter((task) => {
            if (!task.endDate || task.status === 'COMPLETED') return false
            return new Date(task.endDate) < new Date()
          }).length,
        },
        completionRate:
          memberTasks.length > 0
            ? Math.round(
                (memberTasks.filter((t) => t.status === 'COMPLETED').length /
                  memberTasks.length) *
                  100
              )
            : 0,
      }
    })

    const projectReport = {
      generatedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        progress: progress,
      },
      statistics: {
        totalTasks: project.tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        todoTasks: todoTasks.length,
        reviewTasks: reviewTasks.length,
        overdueTasks: overdueTasks.length,
        progressPercentage: progress,
        teamSize: project.members.length,
      },
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate,
        endDate: task.endDate,
        assignedUser: task.assignedUser
          ? {
              name: task.assignedUser.name,
              email: task.assignedUser.email,
              department: task.assignedUser.department,
            }
          : null,
        assignedUsers: task.assignedUsers.map((au) => ({
          name: au.user.name,
          email: au.user.email,
          department: au.user.department,
        })),
        isOverdue:
          task.endDate &&
          task.status !== 'COMPLETED' &&
          new Date(task.endDate) < new Date(),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
      team: teamAnalysis,
      timeline: {
        projectDuration:
          project.startDate && project.endDate
            ? Math.ceil(
                (new Date(project.endDate).getTime() -
                  new Date(project.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        isOverdue:
          project.endDate &&
          project.status !== 'COMPLETED' &&
          new Date(project.endDate) < new Date(),
        estimatedCompletion: project.endDate,
        actualProgress: progress,
      },
    }

    // Format'a göre dosya adı ve content type belirle
    let filename: string
    let contentType: string
    let responseData: string

    switch (format) {
      case 'excel':
        filename = `proje-raporu-${project.name.replace(
          /[^a-zA-Z0-9]/g,
          '-'
        )}-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        responseData = JSON.stringify(projectReport, null, 2)
        break
      case 'pdf':
        filename = `proje-raporu-${project.name.replace(
          /[^a-zA-Z0-9]/g,
          '-'
        )}-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        responseData = JSON.stringify(projectReport, null, 2)
        break
      default:
        filename = `proje-raporu-${project.name.replace(
          /[^a-zA-Z0-9]/g,
          '-'
        )}-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        responseData = JSON.stringify(projectReport, null, 2)
    }

    const response = new NextResponse(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

    return response
  } catch (error) {
    console.error('Proje raporu oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Proje raporu oluşturulamadı' },
      { status: 500 }
    )
  }
}
