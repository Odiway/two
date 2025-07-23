import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
        workflowSteps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status || 'PLANNING',
        priority: body.priority || 'MEDIUM',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      include: {
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    // Create default workflow steps
    await prisma.workflowStep.createMany({
      data: [
        { name: 'Tasarım', order: 1, color: '#EF4444', projectId: project.id },
        { name: 'Prototip', order: 2, color: '#F59E0B', projectId: project.id },
        { name: 'Test', order: 3, color: '#3B82F6', projectId: project.id },
        { name: 'Üretim', order: 4, color: '#10B981', projectId: project.id },
      ],
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
