'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  department: string
  position: string
}

interface Team {
  id: string
  name: string
  department: string
}

interface TeamFilterProps {
  users: User[]
  teams: Team[]
  onFilterChange: (filteredData: { users: User[]; teams: Team[] }) => void
}

export default function TeamFilter({
  users,
  teams,
  onFilterChange,
}: TeamFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Get unique departments and positions
  const departments = [...new Set(users.map((user) => user.department))]
  const positions = [...new Set(users.map((user) => user.position))]

  const applyFilters = () => {
    let filteredUsers = users

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedDepartment) {
      filteredUsers = filteredUsers.filter(
        (user) => user.department === selectedDepartment
      )
    }

    if (selectedRole) {
      filteredUsers = filteredUsers.filter(
        (user) => user.position === selectedRole
      )
    }

    onFilterChange({ users: filteredUsers, teams })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setTimeout(applyFilters, 300) // Debounce
  }

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value)
    applyFilters()
  }

  const handlePositionChange = (value: string) => {
    setSelectedRole(value)
    applyFilters()
  }

  return (
    <div className='bg-white shadow rounded-lg mb-6'>
      <div className='p-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Takım üyesi ara...'
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>
          <div className='flex gap-3'>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tüm Departmanlar</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => handlePositionChange(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tüm Pozisyonlar</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedDepartment('')
                setSelectedRole('')
                onFilterChange({ users, teams })
              }}
              className='px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
            >
              <Filter className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
