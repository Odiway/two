const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function validateWeekendWorkload() {
  console.log('🔍 Validating weekend workload calculations...')
  
  // Get all tasks with their assigned users
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

  // Function to get working days between two dates
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

  // Test weekend dates specifically
  console.log('\n🗓️  Weekend Workload Analysis:')
  console.log('=' .repeat(80))

  const weekendDates = [
    new Date(2025, 6, 26), // Saturday, July 26, 2025
    new Date(2025, 6, 27), // Sunday, July 27, 2025
  ]

  for (const testDate of weekendDates) {
    const dayName = testDate.toLocaleDateString('tr-TR', { weekday: 'long' })
    console.log(`\n📅 ${dayName} (${testDate.toLocaleDateString('tr-TR')})`)
    
    // Group tasks by user for this date
    const userWorkloads = {}
    
    tasks.forEach(task => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(testDate)
      
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      if (checkDate >= taskStart && checkDate <= taskEnd) {
        const userId = task.assignedId
        const userName = task.assignedUser?.name || 'Unknown'
        
        if (!userWorkloads[userId]) {
          userWorkloads[userId] = {
            name: userName,
            totalHours: 0,
            tasks: []
          }
        }
        
        const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
        const totalHours = task.estimatedHours || (workingDays * 4)
        const hoursPerWorkingDay = workingDays > 0 ? totalHours / workingDays : totalHours
        
        // For weekend days, show reduced hours (30% of normal workload)
        const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6
        const hoursThisDay = isWeekend ? hoursPerWorkingDay * 0.3 : hoursPerWorkingDay
        
        userWorkloads[userId].totalHours += hoursThisDay
        userWorkloads[userId].tasks.push({
          title: task.title,
          hoursThisDay: hoursThisDay,
          fullWorkingDayHours: hoursPerWorkingDay,
          isWeekendReduced: isWeekend
        })
      }
    })
    
    // Display workloads for this weekend date
    if (Object.keys(userWorkloads).length === 0) {
      console.log('   📝 Bu hafta sonu gününde aktif görev yok')
    } else {
      Object.values(userWorkloads).forEach(user => {
        const workloadPercentage = Math.round((user.totalHours / 8) * 100)
        const status = workloadPercentage <= 50 ? '🟢' : workloadPercentage <= 80 ? '🟡' : workloadPercentage <= 100 ? '🟠' : '🔴'
        
        console.log(`   ${status} ${user.name}: ${user.totalHours.toFixed(1)}h (${workloadPercentage}% hafta sonu doluluk)`)
        user.tasks.forEach(task => {
          const reductionNote = task.isWeekendReduced ? ` (${task.fullWorkingDayHours.toFixed(1)}h → ${task.hoursThisDay.toFixed(1)}h hafta sonu indirimli)` : ''
          console.log(`      └─ ${task.title}: ${task.hoursThisDay.toFixed(1)}h${reductionNote}`)
        })
      })
    }
  }

  // Also check the days around weekend for comparison
  console.log('\n📊 Hafta Sonu Öncesi/Sonrası Karşılaştırma:')
  console.log('=' .repeat(80))

  const comparisonDates = [
    { date: new Date(2025, 6, 25), label: 'Cuma (Hafta Sonu Öncesi)' },
    { date: new Date(2025, 6, 26), label: 'Cumartesi (Hafta Sonu)' },
    { date: new Date(2025, 6, 27), label: 'Pazar (Hafta Sonu)' },
    { date: new Date(2025, 6, 28), label: 'Pazartesi (Hafta Sonu Sonrası)' }
  ]

  comparisonDates.forEach(({ date, label }) => {
    console.log(`\n${label}:`)
    
    // Find users with tasks on this date
    const dailyUserWorkloads = {}
    
    tasks.forEach(task => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(date)
      
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      if (checkDate >= taskStart && checkDate <= taskEnd) {
        const userName = task.assignedUser?.name || 'Unknown'
        
        if (!dailyUserWorkloads[userName]) {
          dailyUserWorkloads[userName] = 0
        }
        
        const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
        const totalHours = task.estimatedHours || (workingDays * 4)
        const hoursPerWorkingDay = workingDays > 0 ? totalHours / workingDays : totalHours
        
        // Apply weekend reduction
        const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6
        const hoursThisDay = isWeekend ? hoursPerWorkingDay * 0.3 : hoursPerWorkingDay
        
        dailyUserWorkloads[userName] += hoursThisDay
      }
    })
    
    Object.entries(dailyUserWorkloads).forEach(([userName, hours]) => {
      const workloadPercentage = Math.round((hours / 8) * 100)
      console.log(`   • ${userName}: ${hours.toFixed(1)}h (${workloadPercentage}%)`)
    })
    
    if (Object.keys(dailyUserWorkloads).length === 0) {
      console.log('   • Aktif görev yok')
    }
  })

  console.log('\n🎉 Weekend workload validation completed!')
}

validateWeekendWorkload()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
