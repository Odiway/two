import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedTasks: {
          include: {
            project: true,
          },
        },
        projects: {
          include: {
            project: true,
          },
        },
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        department: body.department,
        position: body.position,
        photo: body.photo || null,
        studentId: body.studentId || null,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
