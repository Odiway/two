const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function validateWorkloadCalculations() {
  console.log('🔍 Validating workload calculations...')
  
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

  console.log('\n📊 Task Workload Analysis:')
  console.log('=' .repeat(80))

  for (const task of tasks) {
    const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
    const totalHours = task.estimatedHours || (workingDays * 4)
    const hoursPerDay = workingDays > 0 ? totalHours / workingDays : totalHours
    
    console.log(`\n📝 Task: ${task.title}`)
    console.log(`   👤 Assigned to: ${task.assignedUser?.name || 'Unknown'}`)
    console.log(`   📅 Duration: ${task.startDate.toISOString().split('T')[0]} → ${task.endDate.toISOString().split('T')[0]}`)
    console.log(`   📊 Working Days: ${workingDays}`)
    console.log(`   ⏱️  Total Hours: ${totalHours}`)
    console.log(`   📈 Hours per Day: ${hoursPerDay.toFixed(1)}`)
    console.log(`   💪 Daily Workload: ${Math.round((hoursPerDay / 8) * 100)}%`)
  }

  // Test specific dates
  console.log('\n\n🗓️  Daily Workload Summary for Key Dates:')
  console.log('=' .repeat(80))

  const testDates = [
    new Date(2025, 6, 23), // July 23, 2025
    new Date(2025, 6, 24), // July 24, 2025
    new Date(2025, 6, 25), // July 25, 2025
    new Date(2025, 6, 28), // July 28, 2025 (Monday)
    new Date(2025, 6, 29), // July 29, 2025 (Tuesday)
  ]

  for (const testDate of testDates) {
    console.log(`\n📅 Date: ${testDate.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    
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
        const hoursPerDay = workingDays > 0 ? totalHours / workingDays : totalHours
        
        userWorkloads[userId].totalHours += hoursPerDay
        userWorkloads[userId].tasks.push({
          title: task.title,
          hoursThisDay: hoursPerDay
        })
      }
    })
    
    // Display workloads for this date
    Object.values(userWorkloads).forEach(user => {
      const workloadPercentage = Math.round((user.totalHours / 8) * 100)
      const status = workloadPercentage <= 50 ? '🟢' : workloadPercentage <= 80 ? '🟡' : workloadPercentage <= 100 ? '🟠' : '🔴'
      
      console.log(`   ${status} ${user.name}: ${user.totalHours.toFixed(1)}h (${workloadPercentage}% doluluk)`)
      user.tasks.forEach(task => {
        console.log(`      └─ ${task.title}: ${task.hoursThisDay.toFixed(1)}h`)
      })
    })
    
    if (Object.keys(userWorkloads).length === 0) {
      console.log('   📝 Bu tarihte aktif görev yok')
    }
  }

  console.log('\n🎉 Workload validation completed!')
}

validateWorkloadCalculations()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
