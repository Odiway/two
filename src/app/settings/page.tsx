import Navbar from '@/components/Navbar'
import { Settings, Database, Users, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Ayarlar</h1>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Navigation */}
            <div className='lg:col-span-1'>
              <div className='bg-white shadow rounded-lg'>
                <div className='p-6'>
                  <nav className='space-y-1'>
                    <a
                      href='#general'
                      className='bg-blue-50 border-blue-500 text-blue-700 border-l-4 group flex items-center px-3 py-2 text-sm font-medium'
                    >
                      <Settings className='text-blue-500 mr-3 h-5 w-5' />
                      Genel Ayarlar
                    </a>
                    <a
                      href='#users'
                      className='border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium'
                    >
                      <Users className='text-gray-400 mr-3 h-5 w-5' />
                      Kullanıcı Yönetimi
                    </a>
                    <a
                      href='#notifications'
                      className='border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium'
                    >
                      <Bell className='text-gray-400 mr-3 h-5 w-5' />
                      Bildirimler
                    </a>
                    <a
                      href='#security'
                      className='border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium'
                    >
                      <Shield className='text-gray-400 mr-3 h-5 w-5' />
                      Güvenlik
                    </a>
                    <a
                      href='#database'
                      className='border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium'
                    >
                      <Database className='text-gray-400 mr-3 h-5 w-5' />
                      Veritabanı
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* General Settings */}
              <div id='general' className='bg-white shadow rounded-lg'>
                <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Genel Ayarlar
                  </h2>
                </div>
                <div className='p-6'>
                  <div className='space-y-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Departman Adı
                      </label>
                      <input
                        type='text'
                        defaultValue='Batarya Üretim Departmanı'
                        className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Şirket Adı
                      </label>
                      <input
                        type='text'
                        defaultValue='Temsada'
                        className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Çalışma Saatleri
                      </label>
                      <div className='mt-1 grid grid-cols-2 gap-3'>
                        <input
                          type='time'
                          defaultValue='08:00'
                          className='block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                        <input
                          type='time'
                          defaultValue='17:00'
                          className='block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Zaman Dilimi
                      </label>
                      <select className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500'>
                        <option value='Europe/Istanbul'>Türkiye (UTC+3)</option>
                        <option value='Europe/London'>Londra (UTC+0)</option>
                        <option value='America/New_York'>
                          New York (UTC-5)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className='bg-white shadow rounded-lg'>
                <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Sistem Bilgileri
                  </h2>
                </div>
                <div className='p-6'>
                  <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2'>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Sistem Versiyonu
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>v1.0.0</dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Son Güncelleme
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>
                        18 Temmuz 2025
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Veritabanı
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>SQLite</dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Toplam Kullanıcı
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>
                        22 kullanıcı
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Toplam Proje
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>3 proje</dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500'>
                        Toplam Görev
                      </dt>
                      <dd className='mt-1 text-sm text-gray-900'>8 görev</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Workflow Settings */}
              <div className='bg-white shadow rounded-lg'>
                <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    İş Akışı Ayarları
                  </h2>
                </div>
                <div className='p-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-900'>
                          Otomatik Görev Atama
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Yeni görevleri otomatik olarak takım üyelerine ata
                        </p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input type='checkbox' className='sr-only peer' />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-900'>
                          E-posta Bildirimleri
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Önemli güncellemeler için e-posta gönder
                        </p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-900'>
                          Otomatik Yedekleme
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Veritabanını günlük olarak yedekle
                        </p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className='flex justify-end'>
                <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'>
                  Ayarları Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
