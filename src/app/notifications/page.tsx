'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Trash2,
  Filter,
  X,
  Check,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  task?: {
    id: string
    title: string
    status: string
    endDate: string | null
    project: {
      id: string
      name: string
    }
  }
  project?: {
    id: string
    name: string
    status: string
    endDate: string | null
  }
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
  total: number
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'task' | 'project'>(
    'all'
  )
  const [selectedUserId] = useState('cmd8wjfwb0001o8mo9nx8h52u') // Demo user ID

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const unreadOnly = filter === 'unread'
      const response = await fetch(
        `/api/notifications?userId=${selectedUserId}&unreadOnly=${unreadOnly}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const result = await response.json()

      // Apply additional filters
      let filteredNotifications = result.notifications
      if (filter === 'task') {
        filteredNotifications = result.notifications.filter(
          (n: Notification) => n.type.includes('TASK') && n.task
        )
      } else if (filter === 'project') {
        filteredNotifications = result.notifications.filter(
          (n: Notification) => n.type.includes('PROJECT') && n.project
        )
      }

      setData({
        ...result,
        notifications: filteredNotifications,
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Bell className='w-5 h-5 text-blue-500' />
      case 'TASK_DUE_SOON':
        return <Clock className='w-5 h-5 text-yellow-500' />
      case 'TASK_OVERDUE':
        return <AlertTriangle className='w-5 h-5 text-red-500' />
      case 'TASK_COMPLETED':
        return <CheckCircle className='w-5 h-5 text-green-500' />
      case 'TASK_STATUS_CHANGED':
        return <Info className='w-5 h-5 text-blue-500' />
      case 'PROJECT_DUE_SOON':
        return <Clock className='w-5 h-5 text-yellow-500' />
      case 'PROJECT_OVERDUE':
        return <AlertTriangle className='w-5 h-5 text-red-500' />
      case 'PROJECT_STATUS_CHANGED':
        return <Info className='w-5 h-5 text-blue-500' />
      default:
        return <BellRing className='w-5 h-5 text-gray-500' />
    }
  }

  const getNotificationColor = (type: string) => {
    if (type.includes('OVERDUE')) return 'border-red-200 bg-red-50'
    if (type.includes('DUE_SOON')) return 'border-yellow-200 bg-yellow-50'
    if (type.includes('COMPLETED')) return 'border-green-200 bg-green-50'
    return 'border-blue-200 bg-blue-50'
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0'>
            <div className='space-y-2'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-indigo-600 rounded-xl'>
                  <BellRing className='w-7 h-7 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    Bildirimler
                    {data && data.unreadCount > 0 && (
                      <span className='ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
                        {data.unreadCount} okunmamış
                      </span>
                    )}
                  </h1>
                  <p className='text-gray-600'>
                    Görevler, projeler ve sistem bildirimleri
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              {/* Filter Buttons */}
              <div className='flex items-center space-x-2 bg-white rounded-lg p-1 shadow-md'>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Okunmamış
                </button>
                <button
                  onClick={() => setFilter('task')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'task'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Görevler
                </button>
                <button
                  onClick={() => setFilter('project')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'project'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Projeler
                </button>
              </div>

              {/* Mark All as Read Button */}
              {data && data.unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className='space-y-4'>
            {data && data.notifications.length === 0 ? (
              <div className='text-center py-12'>
                <BellRing className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>
                  Bildirim yok
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {filter === 'unread'
                    ? 'Okunmamış bildiriminiz bulunmuyor.'
                    : 'Henüz herhangi bir bildiriminiz yok.'}
                </p>
              </div>
            ) : (
              data?.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative bg-white rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${
                    notification.isRead
                      ? 'border-gray-200'
                      : getNotificationColor(notification.type)
                  } ${!notification.isRead ? 'ring-2 ring-indigo-200' : ''}`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-4 flex-1'>
                      {/* Icon */}
                      <div className='flex-shrink-0 mt-1'>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <h3
                            className={`text-lg font-semibold ${
                              notification.isRead
                                ? 'text-gray-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
                              Yeni
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm mb-3 ${
                            notification.isRead
                              ? 'text-gray-500'
                              : 'text-gray-700'
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* Context Info */}
                        {notification.task && (
                          <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-sm font-medium text-gray-900'>
                                  Görev: {notification.task.title}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  Proje: {notification.task.project.name}
                                </p>
                              </div>
                              {notification.task.endDate && (
                                <div className='text-right'>
                                  <p className='text-xs text-gray-500'>
                                    Bitiş Tarihi
                                  </p>
                                  <p className='text-sm font-medium text-gray-700'>
                                    {formatDate(
                                      new Date(notification.task.endDate)
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {notification.project && !notification.task && (
                          <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-sm font-medium text-gray-900'>
                                  Proje: {notification.project.name}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  Durum: {notification.project.status}
                                </p>
                              </div>
                              {notification.project.endDate && (
                                <div className='text-right'>
                                  <p className='text-xs text-gray-500'>
                                    Bitiş Tarihi
                                  </p>
                                  <p className='text-sm font-medium text-gray-700'>
                                    {formatDate(
                                      new Date(notification.project.endDate)
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <p className='text-xs text-gray-400'>
                          {formatDate(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center space-x-2 ml-4'>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className='p-2 text-gray-400 hover:text-green-600 transition-colors'
                          title='Okundu olarak işaretle'
                        >
                          <CheckCircle className='w-5 h-5' />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                        title='Bildirimi sil'
                      >
                        <Trash2 className='w-5 h-5' />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
