import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ProjectsList from '@/components/ProjectsList'
import { Plus } from 'lucide-react'
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Projeler</h1>
            <Link
              href='/projects/new'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='w-4 h-4 mr-2' />
              Yeni Proje
            </Link>
          </div>

          <ProjectsList projects={projects} />
        </div>
      </div>
    </div>
  )
}
