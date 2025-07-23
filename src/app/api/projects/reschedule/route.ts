import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Reschedule API called with body:', body)

    const { projectId, rescheduleType, delayDays } = body

    if (!projectId || !rescheduleType) {
      console.error('Missing required parameters:', {
        projectId,
        rescheduleType,
      })
      return NextResponse.json(
        { error: 'Project ID and reschedule type required' },
        { status: 400 }
      )
    }

    console.log('Fetching project:', projectId)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedUser: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    })

    if (!project) {
      console.error('Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('Project found, executing reschedule type:', rescheduleType)
    let rescheduleResult

    switch (rescheduleType) {
      case 'sequential':
        rescheduleResult = await sequentialReschedule(project, delayDays || 0)
        break
      case 'parallel':
        rescheduleResult = await parallelReschedule(project, delayDays || 0)
        break
      case 'critical':
        rescheduleResult = await criticalPathReschedule(project, delayDays || 0)
        break
      case 'auto':
        rescheduleResult = await autoReschedule(project)
        break
      default:
        console.error('Invalid reschedule type:', rescheduleType)
        return NextResponse.json(
          { error: 'Invalid reschedule type' },
          { status: 400 }
        )
    }

    console.log('Reschedule completed successfully:', rescheduleResult)
    return NextResponse.json({
      success: true,
      rescheduleType,
      affectedTasks: rescheduleResult.affectedTasks,
      newProjectEndDate: rescheduleResult.newEndDate,
      delayDays: rescheduleResult.delayDays,
    })
  } catch (error) {
    console.error('Project reschedule error:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule project' },
      { status: 500 }
    )
  }
}

// Sequential reschedule - safe but longest duration
async function sequentialReschedule(project: any, delayDays: number) {
  const tasks = project.tasks
  let affectedTasks = 0
  let currentDate = new Date()

  if (delayDays > 0) {
    currentDate.setDate(currentDate.getDate() + delayDays)
  }

  for (const task of tasks) {
    if (task.status !== 'COMPLETED') {
      const taskDuration = calculateTaskDuration(task)
      const newStartDate = new Date(currentDate)
      const newEndDate = addWorkingDays(newStartDate, taskDuration)

      await prisma.task.update({
        where: { id: task.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      })

      currentDate = new Date(newEndDate)
      currentDate.setDate(currentDate.getDate() + 1) // Add buffer day
      affectedTasks++
    }
  }

  // Update project end date
  const newProjectEndDate = new Date(currentDate)
  await prisma.project.update({
    where: { id: project.id },
    data: {
      endDate: newProjectEndDate,
      delayDays: Math.max(project.delayDays || 0, delayDays),
    },
  })

  return {
    affectedTasks,
    newEndDate: newProjectEndDate,
    delayDays,
  }
}

// Parallel reschedule - optimize by running tasks in parallel where possible
async function parallelReschedule(project: any, delayDays: number) {
  const tasks = project.tasks.filter((t: any) => t.status !== 'COMPLETED')
  const users = [
    ...new Set(tasks.map((t: any) => t.assignedUser).filter(Boolean)),
  ]
  const userTasks: { [userId: string]: any[] } = {}

  // Group tasks by user
  users.forEach((user: any) => {
    userTasks[user.id] = tasks.filter((t: any) => t.assignedId === user.id)
  })

  let maxEndDate = new Date()
  let affectedTasks = 0

  // Schedule tasks for each user in parallel
  for (const userId in userTasks) {
    let userCurrentDate = new Date()
    if (delayDays > 0) {
      userCurrentDate.setDate(userCurrentDate.getDate() + delayDays)
    }

    for (const task of userTasks[userId]) {
      const taskDuration = calculateTaskDuration(task)
      const newStartDate = new Date(userCurrentDate)
      const newEndDate = addWorkingDays(newStartDate, taskDuration)

      await prisma.task.update({
        where: { id: task.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      })

      userCurrentDate = new Date(newEndDate)
      userCurrentDate.setDate(userCurrentDate.getDate() + 1)

      if (newEndDate > maxEndDate) {
        maxEndDate = newEndDate
      }

      affectedTasks++
    }
  }

  // Update project end date
  await prisma.project.update({
    where: { id: project.id },
    data: {
      endDate: maxEndDate,
      delayDays: Math.max(project.delayDays || 0, delayDays),
    },
  })

  return {
    affectedTasks,
    newEndDate: maxEndDate,
    delayDays,
  }
}

// Critical path reschedule - only reschedule high priority tasks
async function criticalPathReschedule(project: any, delayDays: number) {
  const criticalTasks = project.tasks.filter(
    (t: any) =>
      (t.priority === 'HIGH' || t.priority === 'URGENT') &&
      t.status !== 'COMPLETED'
  )

  let currentDate = new Date()
  if (delayDays > 0) {
    currentDate.setDate(currentDate.getDate() + delayDays)
  }

  let affectedTasks = 0

  for (const task of criticalTasks) {
    const taskDuration = calculateTaskDuration(task)
    const newStartDate = new Date(currentDate)
    const newEndDate = addWorkingDays(newStartDate, taskDuration)

    await prisma.task.update({
      where: { id: task.id },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
      },
    })

    currentDate = new Date(newEndDate)
    currentDate.setDate(currentDate.getDate() + 1)
    affectedTasks++
  }

  // Update project end date based on critical path
  const newProjectEndDate = new Date(currentDate)
  await prisma.project.update({
    where: { id: project.id },
    data: {
      endDate: newProjectEndDate,
      delayDays: Math.max(project.delayDays || 0, delayDays),
    },
  })

  return {
    affectedTasks,
    newEndDate: newProjectEndDate,
    delayDays,
  }
}

// Auto reschedule - intelligent rescheduling based on current status
async function autoReschedule(project: any) {
  const now = new Date()
  const incompleteTasks = project.tasks.filter(
    (t: any) => t.status !== 'COMPLETED'
  )
  const delayedTasks = incompleteTasks.filter(
    (t: any) => t.endDate && new Date(t.endDate) < now
  )

  let totalDelayDays = 0

  // Calculate total delay from all delayed tasks
  for (const task of delayedTasks) {
    const delayDays = Math.ceil(
      (now.getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    totalDelayDays = Math.max(totalDelayDays, delayDays)

    // Update task delay information - remove delayDays and delayReason for now
    await prisma.task.update({
      where: { id: task.id },
      data: {
        // Will add these fields later when schema is updated
        updatedAt: new Date(),
      },
    })
  }

  // Choose best reschedule strategy based on project state
  if (delayedTasks.length > project.tasks.length * 0.5) {
    // If more than 50% of tasks are delayed, use sequential
    return await sequentialReschedule(project, totalDelayDays)
  } else if (delayedTasks.length > 0) {
    // If some tasks are delayed, use parallel optimization
    return await parallelReschedule(project, totalDelayDays)
  } else {
    // If no delays, optimize current schedule
    return await parallelReschedule(project, 0)
  }
}

// Helper functions
function calculateTaskDuration(task: any): number {
  if (task.startDate && task.endDate) {
    const start = new Date(task.startDate)
    const end = new Date(task.endDate)
    return getWorkingDaysBetween(start, end)
  }
  return task.estimatedHours ? Math.ceil(task.estimatedHours / 8) : 1
}

function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
      count++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return count
}

function addWorkingDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  let addedDays = 0

  while (addedDays < days) {
    result.setDate(result.getDate() + 1)
    if (result.getDay() >= 1 && result.getDay() <= 5) {
      addedDays++
    }
  }

  return result
}
