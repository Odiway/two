import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ProjectsList from '@/components/ProjectsList'
import { Plus, Briefcase, Users, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

async function getProjects() {
  return await prisma.project.findMany({
    include: {
      tasks: true,
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  // İstatistikler
  const totalProjects = projects.length
  const activeProjects = projects.filter(
    (p) => p.status === 'IN_PROGRESS'
  ).length
  const completedProjects = projects.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Enhanced Header */}
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0'>
            <div className='space-y-2'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-600 rounded-xl'>
                  <Briefcase className='w-7 h-7 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Projeler</h1>
                  <p className='text-gray-600'>
                    Tüm projelerinizi yönetin ve takip edin
                  </p>
                </div>
              </div>
            </div>

            <Link
              href='/projects/new'
              className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
            >
              <Plus className='w-5 h-5 mr-2' />
              Yeni Proje Oluştur
            </Link>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Toplam Proje
                  </p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {totalProjects}
                  </p>
                </div>
                <div className='p-3 bg-blue-100 rounded-full'>
                  <Briefcase className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Aktif Proje
                  </p>
                  <p className='text-3xl font-bold text-blue-600'>
                    {activeProjects}
                  </p>
                </div>
                <div className='p-3 bg-blue-100 rounded-full'>
                  <TrendingUp className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Tamamlanan
                  </p>
                  <p className='text-3xl font-bold text-green-600'>
                    {completedProjects}
                  </p>
                </div>
                <div className='p-3 bg-green-100 rounded-full'>
                  <Target className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Toplam Görev
                  </p>
                  <p className='text-3xl font-bold text-purple-600'>
                    {totalTasks}
                  </p>
                </div>
                <div className='p-3 bg-purple-100 rounded-full'>
                  <Users className='w-6 h-6 text-purple-600' />
                </div>
              </div>
            </div>
          </div>

          <ProjectsList projects={projects} />
        </div>
      </div>
    </div>
  )
}
