const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCalendarConsistency() {
  console.log('🔍 Testing calendar consistency between Takvim and Doluluk views...')
  
  // Get all tasks with users
  const tasks = await prisma.task.findMany({
    include: {
      assignedUser: true
    },
    where: {
      startDate: { not: null },
      endDate: { not: null },
      assignedId: { not: null }
    }
  })

  // Get all users
  const users = await prisma.user.findMany()

  console.log(`\n📊 Data Summary:`)
  console.log(`   • Total Tasks: ${tasks.length}`)
  console.log(`   • Total Users: ${users.length}`)
  console.log(`   • Tasks with Dates: ${tasks.filter(t => t.startDate && t.endDate).length}`)

  // Test specific dates that should show workload
  const testDates = [
    new Date(2025, 6, 23), // July 23, 2025 (Wednesday)
    new Date(2025, 6, 24), // July 24, 2025 (Thursday) 
    new Date(2025, 6, 25), // July 25, 2025 (Friday)
    new Date(2025, 6, 26), // July 26, 2025 (Saturday)
    new Date(2025, 6, 27), // July 27, 2025 (Sunday)
    new Date(2025, 6, 28), // July 28, 2025 (Monday)
  ]

  console.log('\n🗓️  Calendar Consistency Test:')
  console.log('=' .repeat(80))

  function getWorkingDaysBetween(startDate, endDate) {
    let count = 0
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  function getTasksForDate(date) {
    return tasks.filter(task => {
      if (!task.startDate || !task.endDate) return false
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(date)
      
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      return checkDate >= taskStart && checkDate <= taskEnd
    })
  }

  function calculateUserWorkloadForDate(userId, date) {
    const userTasks = getTasksForDate(date).filter(task => task.assignedId === userId)
    
    const totalHours = userTasks.reduce((sum, task) => {
      if (!task.startDate || !task.endDate) {
        return sum + (task.estimatedHours || 4)
      }
      
      const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
      if (workingDays <= 0) {
        return sum + (task.estimatedHours || 4)
      }
      
      const totalTaskHours = task.estimatedHours || (workingDays * 4)
      const hoursPerWorkingDay = totalTaskHours / workingDays
      
      // Apply weekend reduction
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const hoursThisDay = isWeekend ? hoursPerWorkingDay * 0.3 : hoursPerWorkingDay
      
      return sum + hoursThisDay
    }, 0)

    const maxHours = 8
    const workloadPercentage = Math.round((totalHours / maxHours) * 100)

    return {
      totalHours,
      workloadPercentage,
      taskCount: userTasks.length,
      tasks: userTasks.map(t => t.title)
    }
  }

  for (const testDate of testDates) {
    const dayName = testDate.toLocaleDateString('tr-TR', { weekday: 'long' })
    console.log(`\n📅 ${dayName} (${testDate.toLocaleDateString('tr-TR')})`)
    
    const tasksOnDate = getTasksForDate(testDate)
    console.log(`   📝 Total tasks on this date: ${tasksOnDate.length}`)
    
    if (tasksOnDate.length > 0) {
      console.log(`   📋 Tasks:`)
      tasksOnDate.forEach(task => {
        console.log(`      • ${task.title} (${task.assignedUser?.name || 'Unassigned'})`)
      })
    }

    // Calculate workload for each user
    const userWorkloads = {}
    users.forEach(user => {
      const workload = calculateUserWorkloadForDate(user.id, testDate)
      if (workload.taskCount > 0) {
        userWorkloads[user.name] = workload
      }
    })

    if (Object.keys(userWorkloads).length > 0) {
      console.log(`   👥 User Workloads:`)
      Object.entries(userWorkloads).forEach(([userName, workload]) => {
        const status = workload.workloadPercentage <= 50 ? '🟢' : 
                     workload.workloadPercentage <= 80 ? '🟡' : 
                     workload.workloadPercentage <= 100 ? '🟠' : '🔴'
        console.log(`      ${status} ${userName}: ${workload.totalHours.toFixed(1)}h (${workload.workloadPercentage}%)`)
        console.log(`         Tasks: ${workload.tasks.join(', ')}`)
      })
    } else {
      console.log(`   👥 No active workloads on this date`)
    }
  }

  // Test for specific discrepancies
  console.log('\n🔍 Potential Issues Check:')
  console.log('=' .repeat(80))

  // Check for tasks without proper dates
  const tasksWithoutDates = tasks.filter(task => !task.startDate || !task.endDate)
  if (tasksWithoutDates.length > 0) {
    console.log(`❌ ${tasksWithoutDates.length} tasks missing start/end dates:`)
    tasksWithoutDates.forEach(task => {
      console.log(`   • ${task.title} (Start: ${task.startDate || 'NULL'}, End: ${task.endDate || 'NULL'})`)
    })
  } else {
    console.log(`✅ All tasks have proper start/end dates`)
  }

  // Check for tasks without users
  const tasksWithoutUsers = tasks.filter(task => !task.assignedId || !task.assignedUser)
  if (tasksWithoutUsers.length > 0) {
    console.log(`❌ ${tasksWithoutUsers.length} tasks without assigned users:`)
    tasksWithoutUsers.forEach(task => {
      console.log(`   • ${task.title} (Assigned ID: ${task.assignedId || 'NULL'})`)
    })
  } else {
    console.log(`✅ All tasks have assigned users`)
  }

  // Check for estimated hours consistency
  const tasksWithoutHours = tasks.filter(task => !task.estimatedHours)
  if (tasksWithoutHours.length > 0) {
    console.log(`⚠️  ${tasksWithoutHours.length} tasks without estimated hours (using defaults):`)
    tasksWithoutHours.forEach(task => {
      console.log(`   • ${task.title}`)
    })
  } else {
    console.log(`✅ All tasks have estimated hours`)
  }

  console.log('\n🎉 Calendar consistency test completed!')
  console.log('\n💡 If you see different data in Takvim vs Doluluk views:')
  console.log('   1. Check browser developer console for debug logs')
  console.log('   2. Verify both views are using the same currentDate')
  console.log('   3. Ensure workload calculations are consistent')
}

testCalendarConsistency()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
