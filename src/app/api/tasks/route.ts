import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to calculate workload percentage
function calculateWorkloadPercentage(task: any, user: any): number {
  if (!task.startDate || !task.endDate || !task.estimatedHours) {
    return 0
  }

  const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
  if (workingDays === 0) return 0

  const dailyHours = task.estimatedHours / workingDays
  const standardDailyHours = 8 // Standard working hours per day
  
  return Math.round((dailyHours / standardDailyHours) * 100)
}

// Helper function to get working days between dates
function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let workingDays = 0

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const enhanced = searchParams.get('enhanced') === 'true'

    if (enhanced && projectId) {
      // Enhanced mode with workload and bottleneck data
      const tasks = await prisma.task.findMany({
        where: {
          projectId,
          ...(userId && { assignedId: userId }),
          ...(startDate && endDate && {
            OR: [
              {
                startDate: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              },
              {
                endDate: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              }
            ]
          })
        },
        include: {
          project: true,
          assignedUser: true,
          createdBy: true,
          workflowStep: true,
          timeTracking: {
            orderBy: { startTime: 'desc' }
          }
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      // Get workload analysis
      const workloadAnalysis = await prisma.workloadAnalysis.findMany({
        where: {
          projectId,
          ...(userId && { userId }),
          ...(startDate && endDate && {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          })
        },
        include: {
          user: true
        }
      })

      // Get bottlenecks
      const bottlenecks = await prisma.projectBottleneck.findMany({
        where: {
          projectId,
          ...(startDate && endDate && {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          })
        }
      })

      return NextResponse.json({
        tasks,
        workloadAnalysis,
        bottlenecks
      })
    }

    // Standard mode
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        assignedUser: true,
        createdBy: true,
        workflowStep: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a task update (has taskId) or task creation
    if (body.taskId && body.action === 'updateStatus') {
      return await updateTaskStatus(body)
    }

    // Create the task first
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || 'TODO',
        priority: body.priority || 'MEDIUM',
        projectId: body.projectId,
        assignedId: body.assignedId || null, // Legacy field
        createdById: body.createdById,
        workflowStepId: body.workflowStepId || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        estimatedHours: body.estimatedHours || null,
        delayReason: body.delayReason || null,
        delayDays: body.delayDays || 0,
        workloadPercentage: body.workloadPercentage || 0,
        isBottleneck: body.isBottleneck || false,
        originalEndDate: body.originalEndDate ? new Date(body.originalEndDate) : null,
      },
    })

    // Create task assignments for multiple users
    if (
      body.assignedUserIds &&
      Array.isArray(body.assignedUserIds) &&
      body.assignedUserIds.length > 0
    ) {
      await prisma.taskAssignment.createMany({
        data: body.assignedUserIds.map((userId: string) => ({
          taskId: task.id,
          userId: userId,
        })),
      })
    }

    // Fetch the complete task with relations
    const completeTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        project: true,
        assignedUser: true,
        createdBy: true,
        workflowStep: true,
        assignedUsers: {
          include: {
            user: true,
          },
        },
      },
    })

    // Auto-calculate workload percentage if task has all required fields
    if (completeTask && completeTask.assignedUser && completeTask.startDate && completeTask.endDate && completeTask.estimatedHours) {
      const newWorkloadPercentage = calculateWorkloadPercentage(completeTask, completeTask.assignedUser)
      
      // Update the task with calculated workload
      await prisma.task.update({
        where: { id: task.id },
        data: { workloadPercentage: newWorkloadPercentage }
      })
      
      // Update the returned task object
      completeTask.workloadPercentage = newWorkloadPercentage
    }

    return NextResponse.json(completeTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// Helper function to update task status with time tracking
async function updateTaskStatus(body: any) {
  try {
    const { taskId, status, delayReason, delayDays } = body

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        delayReason,
        delayDays: delayDays || 0,
        updatedAt: new Date()
      }
    })

    // Create time tracking entry
    await prisma.taskTimeTracking.create({
      data: {
        taskId,
        status,
        startTime: new Date(),
        endTime: null
      }
    })

    // End previous time tracking entry if exists
    const previousTracking = await prisma.taskTimeTracking.findFirst({
      where: {
        taskId,
        endTime: null,
        id: { not: updatedTask.id }
      },
      orderBy: { startTime: 'desc' }
    })

    if (previousTracking) {
      const now = new Date()
      const duration = Math.round((now.getTime() - previousTracking.startTime.getTime()) / 60000) // minutes

      await prisma.taskTimeTracking.update({
        where: { id: previousTracking.id },
        data: {
          endTime: now,
          duration
        }
      })
    }

    // Calculate workload impact
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedUser: true,
        project: true
      }
    })

    if (task && task.assignedUser && task.startDate && task.endDate) {
      await updateWorkloadAnalysis(task)
    }

    // Check for bottlenecks
    if (task && task.project) {
      await analyzeBottlenecks(task.project.id)
    }

    return NextResponse.json({ success: true, task: updatedTask })

  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// Helper function to update workload analysis
async function updateWorkloadAnalysis(task: any) {
  if (!task.assignedUser || !task.startDate || !task.endDate) return

  const startDate = new Date(task.startDate)
  const endDate = new Date(task.endDate)
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Skip weekends
    if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
      // Calculate daily workload for this user on this date
      const dailyTasks = await prisma.task.findMany({
        where: {
          assignedId: task.assignedUser.id,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        }
      })

      const hoursAllocated = dailyTasks.reduce((total, t) => total + (t.estimatedHours || 4), 0)
      const hoursAvailable = task.assignedUser.maxHoursPerDay || 8
      const workloadPercent = Math.round((hoursAllocated / hoursAvailable) * 100)

      await prisma.workloadAnalysis.upsert({
        where: {
          projectId_userId_date: {
            projectId: task.projectId,
            userId: task.assignedUser.id,
            date: currentDate
          }
        },
        update: {
          workloadPercent,
          hoursAllocated,
          hoursAvailable,
          isOverloaded: workloadPercent > 100
        },
        create: {
          projectId: task.projectId,
          userId: task.assignedUser.id,
          date: new Date(currentDate),
          workloadPercent,
          hoursAllocated,
          hoursAvailable,
          isOverloaded: workloadPercent > 100
        }
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }
}

// Helper function to analyze bottlenecks
async function analyzeBottlenecks(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true }
  })

  if (!project || !project.startDate || !project.endDate) return

  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Skip weekends
    if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
      // Get tasks for this date
      const dailyTasks = await prisma.task.findMany({
        where: {
          projectId,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        }
      })

      // Get workload analysis for this date
      const workloadData = await prisma.workloadAnalysis.findMany({
        where: {
          projectId,
          date: currentDate
        }
      })

      const maxWorkload = Math.max(...workloadData.map(w => w.workloadPercent), 0)
      const taskCount = dailyTasks.length
      const isBottleneck = maxWorkload > 80 || taskCount > 5

      if (isBottleneck) {
        await prisma.projectBottleneck.upsert({
          where: {
            projectId_date: {
              projectId,
              date: currentDate
            }
          },
          update: {
            maxWorkload,
            taskCount,
            isBottleneck: true
          },
          create: {
            projectId,
            date: new Date(currentDate),
            maxWorkload,
            taskCount,
            isBottleneck: true
          }
        })

        // Mark tasks as bottleneck
        await prisma.task.updateMany({
          where: {
            id: { in: dailyTasks.map(t => t.id) }
          },
          data: {
            isBottleneck: true
          }
        })
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }
}
