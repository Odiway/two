import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params
    const { markAsCompleted } = await request.json()

    // Workflow adımındaki tüm görevleri tamamla
    if (markAsCompleted) {
      await prisma.task.updateMany({
        where: {
          projectId: id,
          workflowStepId: stepId,
          status: {
            not: 'COMPLETED',
          },
        },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      })

      // Proje durumunu güncelle - eğer tüm adımlar tamamlandıysa projeyi tamamla
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          workflowSteps: {
            orderBy: { order: 'asc' },
          },
          tasks: true,
        },
      })

      if (project) {
        const allStepsCompleted = await Promise.all(
          project.workflowSteps.map(async (step) => {
            const stepTasks = project.tasks.filter(
              (task) => task.workflowStepId === step.id
            )
            const completedTasks = stepTasks.filter(
              (task) => task.status === 'COMPLETED'
            )
            return (
              stepTasks.length > 0 && stepTasks.length === completedTasks.length
            )
          })
        )

        if (allStepsCompleted.every(Boolean)) {
          await prisma.project.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              updatedAt: new Date(),
            },
          })
        } else if (project.status === 'PLANNING') {
          await prisma.project.update({
            where: { id },
            data: {
              status: 'IN_PROGRESS',
              updatedAt: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating workflow step:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow step' },
      { status: 500 }
    )
  }
}
