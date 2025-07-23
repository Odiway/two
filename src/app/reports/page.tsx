'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  FileText,
  Download,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Award,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  status: string
}

interface Member {
  user: {
    id: string
    name: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  updatedAt: string
  tasks: Task[]
  members: Member[]
}

interface ReportsData {
  generatedAt: string
  summary: {
    totalProjects: number
    totalTasks: number
    totalUsers: number
    completedProjects: number
    completedTasks: number
    overdueTasks: number
  }
  projects: Project[]
  departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
    }
  >
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/general')
        if (!response.ok) {
          throw new Error('Failed to fetch reports data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDownloadProject = (projectId: string) => {
    window.open(`/api/reports/project/${projectId}/pdf`, '_blank')
  }

  const handleDownloadGeneral = () => {
    window.open('/api/reports/general/pdf', '_blank')
  }

  const handleDownloadDepartments = () => {
    window.open('/api/reports/departments/pdf', '_blank')
  }

  const handleDownloadPerformance = () => {
    window.open('/api/reports/performance/pdf', '_blank')
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

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-red-800 mb-2'>
                Hata Oluştu
              </h3>
              <p className='text-red-600'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { projects, summary, departments } = data

  // Convert the API response to match component expectations
  const statistics = {
    totalProjects: summary?.totalProjects || 0,
    completedProjects: summary?.completedProjects || 0,
    inProgressProjects:
      (summary?.totalProjects || 0) - (summary?.completedProjects || 0),
    totalTasks: summary?.totalTasks || 0,
    completedTasks: summary?.completedTasks || 0,
    overdueTasks: summary?.overdueTasks || 0,
    totalUsers: summary?.totalUsers || 0,
    activeDepartments: Object.keys(departments || {}).length,
  }

  // Convert departments object to array format
  const departmentsArray = Object.values(departments || {}).map(
    (dept: ReportsData['departments'][string]) => ({
      name: dept.name,
      users: dept.userCount,
      projectCount: 0, // This would need to be calculated separately
      taskCount: dept.totalTasks,
      completedTasks: dept.completedTasks,
    })
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Raporlar ve Analizler
              </h1>
              <p className='text-gray-600 mt-1'>
                Proje dokümantasyonları ve performans raporları
              </p>
            </div>
            <div className='text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow'>
              Rapor tarihi: {formatDate(new Date())}
            </div>
          </div>

          {/* Statistics Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Target className='h-8 w-8 text-blue-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Proje
                      </dt>
                      <dd className='text-2xl font-bold text-gray-900'>
                        {statistics.totalProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <BarChart3 className='h-8 w-8 text-green-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Tamamlanan Proje
                      </dt>
                      <dd className='text-2xl font-bold text-green-600'>
                        {statistics.completedProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Users className='h-8 w-8 text-purple-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Çalışan
                      </dt>
                      <dd className='text-2xl font-bold text-purple-600'>
                        {statistics.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <TrendingUp className='h-8 w-8 text-indigo-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Görev Tamamlama
                      </dt>
                      <dd className='text-2xl font-bold text-indigo-600'>
                        %
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.completedTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100 mb-8'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <BarChart3 className='w-5 h-5 mr-2' />
                Departman Performans Analizi
              </h3>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                {departmentsArray.map((dept) => (
                  <div
                    key={dept.name}
                    className='border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow'
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h4 className='text-lg font-semibold text-gray-900'>
                          {dept.name}
                        </h4>
                        <p className='text-sm text-gray-500'>
                          {dept.users} çalışan
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='text-2xl font-bold text-indigo-600'>
                          {dept.projectCount || 0}
                        </div>
                        <div className='text-xs text-gray-500'>Proje</div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        <div className='text-xl font-bold text-blue-600'>
                          {dept.taskCount}
                        </div>
                        <div className='text-xs text-gray-600'>
                          Toplam Görev
                        </div>
                      </div>
                      <div className='text-center p-3 bg-green-50 rounded-lg'>
                        <div className='text-xl font-bold text-green-600'>
                          %
                          {dept.taskCount > 0
                            ? Math.round(
                                (dept.completedTasks / dept.taskCount) * 100
                              )
                            : 0}
                        </div>
                        <div className='text-xs text-gray-600'>Tamamlama</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Reports Table */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100 mb-8'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-900'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Proje Dokümantasyon İndirmeleri
              </h3>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Proje Adı
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Durum
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Görevler
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Ekip Üyeleri
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Son Güncelleme
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {data?.projects?.map((project) => {
                    const completedTasks =
                      project.tasks?.filter((t) => t.status === 'COMPLETED')
                        .length || 0
                    const totalTasks = project.tasks?.length || 0
                    const progressPercentage =
                      totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0

                    return (
                      <tr key={project.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {project.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {project.description}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              project.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : project.status === 'PLANNING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status === 'COMPLETED'
                              ? 'Tamamlandı'
                              : project.status === 'IN_PROGRESS'
                              ? 'Devam Ediyor'
                              : project.status === 'PLANNING'
                              ? 'Planlanıyor'
                              : 'Beklemede'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900'>
                            {completedTasks}/{totalTasks} (%{progressPercentage}
                            )
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                            <div
                              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {project.members?.length || 0} üye
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(new Date(project.updatedAt))}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <button
                            onClick={() => handleDownloadProject(project.id)}
                            className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2'
                          >
                            <Download className='w-4 h-4 mr-1' />
                            PDF İndir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Reports */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <Award className='w-5 h-5 mr-2' />
                Genel Raporlar
              </h3>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div
                  className='bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadGeneral}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <FileText className='w-8 h-8 text-blue-600' />
                    <Download className='w-5 h-5 text-blue-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-blue-900 mb-2'>
                    Genel PDF Raporu
                  </h4>
                  <p className='text-sm text-blue-700'>
                    Tüm projeler ve görevlerin PDF raporu
                  </p>
                </div>

                <div
                  className='bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadDepartments}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <Users className='w-8 h-8 text-green-600' />
                    <Download className='w-5 h-5 text-green-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-green-900 mb-2'>
                    Departman Analizi
                  </h4>
                  <p className='text-sm text-green-700'>
                    Departman bazında performans analizi
                  </p>
                </div>

                <div
                  className='bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadPerformance}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <TrendingUp className='w-8 h-8 text-purple-600' />
                    <Download className='w-5 h-5 text-purple-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-purple-900 mb-2'>
                    Performans Raporu
                  </h4>
                  <p className='text-sm text-purple-700'>
                    Kullanıcı ve proje performans metrikleri
                  </p>
                </div>

                <div className='bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer'>
                  <div className='flex items-center justify-between mb-4'>
                    <AlertTriangle className='w-8 h-8 text-orange-600' />
                    <Download className='w-5 h-5 text-orange-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-orange-900 mb-2'>
                    Risk Analizi
                  </h4>
                  <p className='text-sm text-orange-700'>
                    Gecikmiş görevler ve risk faktörleri
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
