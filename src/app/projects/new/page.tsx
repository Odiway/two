'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const project = await response.json()
        router.push(`/projects/${project.id}`)
      } else {
        console.error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-3xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center mb-6'>
            <Link
              href='/projects'
              className='mr-4 p-2 text-gray-400 hover:text-gray-600'
            >
              <ArrowLeft className='w-5 h-5' />
            </Link>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Yeni Proje Oluştur
              </h1>
              <p className='text-gray-500 mt-1'>
                Batarya üretim departmanı için yeni bir proje oluşturun
              </p>
            </div>
          </div>

          {/* Form */}
          <div className='bg-white shadow rounded-lg'>
            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
              {/* Project Name */}
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Proje Adı *
                </label>
                <input
                  type='text'
                  name='name'
                  id='name'
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Proje adını girin'
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700'
                >
                  Açıklama
                </label>
                <textarea
                  name='description'
                  id='description'
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Proje açıklamasını girin'
                />
              </div>

              {/* Status and Priority */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='status'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Durum
                  </label>
                  <select
                    name='status'
                    id='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='PLANNING'>Planlama</option>
                    <option value='IN_PROGRESS'>Devam Ediyor</option>
                    <option value='REVIEW'>İnceleme</option>
                    <option value='COMPLETED'>Tamamlandı</option>
                    <option value='ON_HOLD'>Beklemede</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='priority'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Öncelik
                  </label>
                  <select
                    name='priority'
                    id='priority'
                    value={formData.priority}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='LOW'>Düşük</option>
                    <option value='MEDIUM'>Orta</option>
                    <option value='HIGH'>Yüksek</option>
                    <option value='URGENT'>Acil</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='startDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Başlangıç Tarihi
                  </label>
                  <input
                    type='date'
                    name='startDate'
                    id='startDate'
                    value={formData.startDate}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='endDate'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Bitiş Tarihi
                  </label>
                  <input
                    type='date'
                    name='endDate'
                    id='endDate'
                    value={formData.endDate}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              {/* Actions */}
              <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
                <Link
                  href='/projects'
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </Link>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  <Save className='w-4 h-4 mr-2' />
                  {isLoading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
