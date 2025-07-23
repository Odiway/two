import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import TeamView from '@/components/TeamView'

async function getTeamData() {
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
    },
    orderBy: {
      department: 'asc',
    },
  })

  // Calculate stats for each user
  const usersWithStats = users.map((user) => {
    const activeTasks = user.assignedTasks.filter(
      (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS'
    )
    const completedTasks = user.assignedTasks.filter(
      (task) => task.status === 'COMPLETED'
    )
    const activeProjects = user.projects.filter(
      (membership) =>
        membership.project.status === 'IN_PROGRESS' ||
        membership.project.status === 'PLANNING'
    )

    return {
      ...user,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      activeProjects: activeProjects.length,
      totalTasks: user.assignedTasks.length,
    }
  })

  // Group by department
  const departments = usersWithStats.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = []
    }
    acc[user.department].push(user)
    return acc
  }, {} as Record<string, typeof usersWithStats>)

  return {
    users: usersWithStats,
    departments,
    totalUsers: users.length,
    departmentCount: Object.keys(departments).length,
  }
}

export default async function TeamPage() {
  const { users, totalUsers, departmentCount } = await getTeamData()

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Takım Yönetimi
              </h1>
              <p className='text-gray-600 mt-1'>
                {totalUsers} çalışan, {departmentCount} departman
              </p>
            </div>
          </div>

          {/* Team Stats Overview */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {totalUsers}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Çalışan
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {totalUsers}
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
                    <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {departmentCount}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Departman
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {departmentCount}
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
                    <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {users.reduce((sum, user) => sum + user.activeTasks, 0)}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Görevler
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {users.reduce((sum, user) => sum + user.activeTasks, 0)}
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
                    <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {users.reduce(
                          (sum, user) => sum + user.activeProjects,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Projeler
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {users.reduce(
                          (sum, user) => sum + user.activeProjects,
                          0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Filter and View */}
          <div className='bg-white shadow rounded-lg'>
            <TeamView initialUsers={users} initialTeams={[]} />
          </div>
        </div>
      </div>
    </div>
  )
}
