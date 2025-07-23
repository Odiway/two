'use client'

import { useState } from 'react'
import TeamFilter from '@/components/TeamFilter'
import { Users, Badge, Clock } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  department: string
  position: string
  assignedTasks: Array<{
    id: string
    title: string
    status: string
    endDate: Date | string | null
  }>
  projects?: Array<any>
}

interface Team {
  id: string
  name: string
  department: string
}

interface TeamViewProps {
  initialUsers: User[]
  initialTeams: Team[]
}

export default function TeamView({
  initialUsers,
  initialTeams,
}: TeamViewProps) {
  const [filteredData, setFilteredData] = useState({
    users: initialUsers,
    teams: initialTeams,
  })

  const handleFilterChange = (newFilteredData: {
    users: any[]
    teams: any[]
  }) => {
    setFilteredData(newFilteredData)
  }

  // Group users by department
  const departments = filteredData.users.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = []
    }
    acc[user.department].push(user)
    return acc
  }, {} as Record<string, any[]>)

  const getRoleColor = (position: string) => {
    if (!position) return 'bg-gray-100 text-gray-800'

    switch (position.toLowerCase()) {
      case 'manager':
      case 'müdür':
      case 'yönetici':
        return 'bg-purple-100 text-purple-800'
      case 'engineer':
      case 'mühendis':
      case 'elektrik mühendisi':
        return 'bg-blue-100 text-blue-800'
      case 'technician':
      case 'teknisyen':
      case 'batarya teknisyeni':
        return 'bg-green-100 text-green-800'
      case 'specialist':
      case 'uzman':
      case 'kalite uzmanı':
        return 'bg-yellow-100 text-yellow-800'
      case 'operator':
      case 'operatör':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <TeamFilter
        users={initialUsers}
        teams={initialTeams}
        onFilterChange={handleFilterChange}
      />

      {/* Team Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Users className='h-8 w-8 text-blue-500' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Toplam Takım Üyesi
                  </dt>
                  <dd className='text-2xl font-bold text-gray-900'>
                    {filteredData.users.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Badge className='h-8 w-8 text-green-500' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Departman Sayısı
                  </dt>
                  <dd className='text-2xl font-bold text-gray-900'>
                    {Object.keys(departments).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='p-5'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Clock className='h-8 w-8 text-yellow-500' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Aktif Görevler
                  </dt>
                  <dd className='text-2xl font-bold text-gray-900'>
                    {filteredData.users.reduce(
                      (sum, user) => sum + user.assignedTasks.length,
                      0
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department View */}
      <div className='space-y-8'>
        {Object.entries(departments).map(([department, departmentUsers]) => {
          const users = departmentUsers as any[]
          return (
            <div key={department} className='bg-white shadow rounded-lg'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    {department}
                  </h2>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {users.length} üye
                  </span>
                </div>
              </div>
              <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {users.map((user: User) => (
                    <div
                      key={user.id}
                      className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-center mb-4'>
                        <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                          <span className='text-white text-lg font-medium'>
                            {user.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div className='ml-4'>
                          <h3 className='text-sm font-medium text-gray-900'>
                            {user.name}
                          </h3>
                          <p className='text-sm text-gray-500'>{user.email}</p>
                        </div>
                      </div>

                      <div className='mb-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                            user.position
                          )}`}
                        >
                          {user.position}
                        </span>
                      </div>

                      <div className='space-y-3'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Aktif Görevler</span>
                          <span className='font-medium text-blue-600'>
                            {user.assignedTasks.length}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Projeler</span>
                          <span className='font-medium text-green-600'>
                            {user.projects?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Recent Tasks */}
                      {user.assignedTasks.length > 0 && (
                        <div className='mt-4 pt-4 border-t border-gray-100'>
                          <h4 className='text-xs font-medium text-gray-500 mb-2'>
                            Son Görevler
                          </h4>
                          <div className='space-y-1'>
                            {user.assignedTasks
                              .slice(0, 2)
                              .map((task: User['assignedTasks'][0]) => (
                                <div
                                  key={task.id}
                                  className='text-xs text-gray-600 truncate'
                                >
                                  {task.title}
                                </div>
                              ))}
                            {user.assignedTasks.length > 2 && (
                              <div className='text-xs text-gray-500'>
                                +{user.assignedTasks.length - 2} daha fazla
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className='mt-4 pt-4 border-t border-gray-100'>
                        <button className='w-full text-sm text-blue-600 hover:text-blue-800 font-medium'>
                          Profili Görüntüle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredData.users.length === 0 && (
        <div className='text-center py-12'>
          <Users className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            Takım üyesi bulunamadı
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            Filtrelere uygun takım üyesi bulunmuyor.
          </p>
        </div>
      )}
    </>
  )
}
