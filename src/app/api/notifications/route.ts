import { NextRequest, NextResponse } from 'next/server'
import { prismaWithNotifications as prisma } from '@/lib/prisma'

// Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    const whereClause: any = { userId }
    if (unreadOnly) {
      whereClause.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.notification.count({
      where: whereClause,
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, taskId, projectId } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        taskId,
        projectId,
        isRead: false,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: true,
      },
    })

    return NextResponse.json({
      notification,
      unreadCount: unreadCount + 1,
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
