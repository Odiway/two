import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to calculate workload percentage
function calculateWorkloadPercentage(task: any, user: any): number {
  if (!task.startDate || !task.endDate || !task.estimatedHours) {
    return 0
  }

  const startDate = new Date(task.startDate)
  const endDate = new Date(task.endDate)
  const workingDays = getWorkingDaysBetween(startDate, endDate)
  
  if (workingDays <= 0) return 0
  
  const hoursPerDay = task.estimatedHours / workingDays
  const maxHoursPerDay = user?.maxHoursPerDay || 8
  
  return Math.min(Math.round((hoursPerDay / maxHoursPerDay) * 100), 100)
}

// Helper function to calculate working days between dates
function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
        assignedUser: true,
        createdBy: true,
        workflowStep: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('PUT request body:', body) // Debug log
    const {
      title,
      description,
      status,
      priority,
      assignedId,
      workflowStepId,
      endDate,
      delayDays,
      delayReason,
      estimatedHours,
      actualHours,
      workloadPercentage,
      isBottleneck,
    } = body

    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedId !== undefined) updateData.assignedId = assignedId
    if (workflowStepId !== undefined) updateData.workflowStepId = workflowStepId
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (delayDays !== undefined) updateData.delayDays = delayDays
    if (delayReason !== undefined) updateData.delayReason = delayReason
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
    if (actualHours !== undefined) updateData.actualHours = actualHours
    if (workloadPercentage !== undefined) updateData.workloadPercentage = workloadPercentage
    if (isBottleneck !== undefined) updateData.isBottleneck = isBottleneck

    console.log('Update data:', updateData) // Debug log

    // Get the current task and assigned user for workload calculation
    const currentTask = await prisma.task.findUnique({
      where: { id: id },
      include: { assignedUser: true }
    })

    const task = await prisma.task.update({
      where: {
        id: id,
      },
      data: updateData,
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

    // Auto-calculate workload percentage if assignment changed or task details updated
    if (assignedId !== undefined || estimatedHours !== undefined || task.startDate || task.endDate) {
      let newWorkloadPercentage = task.workloadPercentage

      if (task.assignedUser && task.startDate && task.endDate && task.estimatedHours) {
        newWorkloadPercentage = calculateWorkloadPercentage(task, task.assignedUser)
        
        // Update the task with calculated workload
        await prisma.task.update({
          where: { id: id },
          data: { workloadPercentage: newWorkloadPercentage }
        })
        
        // Update the returned task object
        task.workloadPercentage = newWorkloadPercentage
      }
    }

    console.log('Task updated successfully:', task.id, task.status) // Debug log
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Only update provided fields
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assignedId !== undefined)
      updateData.assignedId = body.assignedId || null
    if (body.workflowStepId !== undefined)
      updateData.workflowStepId = body.workflowStepId || null
    if (body.endDate !== undefined)
      updateData.endDate = body.endDate ? new Date(body.endDate) : null

    const task = await prisma.task.update({
      where: {
        id: id,
      },
      data: updateData,
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
