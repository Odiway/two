const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createWeekendTasks() {
  console.log('🔄 Creating tasks that span over weekends...')

  // Get some users for assignment
  const users = await prisma.user.findMany({
    take: 3,
    where: {
      department: 'Batarya Geliştirme Ekibi'
    }
  })

  // Get the first project
  const project = await prisma.project.findFirst()

  if (!project || users.length === 0) {
    console.log('❌ No project or users found')
    return
  }

  // Create tasks that span over weekends
  const weekendTasks = [
    {
      title: 'Hafta Sonu Kritik Bakım',
      description: 'Hafta sonu acil bakım ve izleme işlemleri',
      startDate: new Date(2025, 6, 25), // Friday, July 25, 2025
      endDate: new Date(2025, 6, 28), // Monday, July 28, 2025 (includes weekend)
      estimatedHours: 24, // 3 working days * 8 hours
      assignedId: users[0].id,
      priority: 'HIGH'
    },
    {
      title: 'Sürekli Sistem İzleme',
      description: 'Hafta sonu dahil sürekli sistem izleme',
      startDate: new Date(2025, 6, 26), // Saturday, July 26, 2025
      endDate: new Date(2025, 6, 29), // Tuesday, July 29, 2025
      estimatedHours: 16, // 2 working days * 8 hours
      assignedId: users[1].id,
      priority: 'MEDIUM'
    },
    {
      title: 'Pazar Günü Test Prosedürü',
      description: 'Pazar günü özel test ve kalibrasyon',
      startDate: new Date(2025, 6, 27), // Sunday, July 27, 2025
      endDate: new Date(2025, 6, 27), // Sunday, July 27, 2025 (weekend only)
      estimatedHours: 6, // Weekend special work
      assignedId: users[2].id,
      priority: 'URGENT'
    }
  ]

  for (const taskData of weekendTasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        status: 'TODO',
        projectId: project.id,
        createdById: users[0].id,
        workloadPercentage: 100,
        isBottleneck: false,
        delayDays: 0
      }
    })
    
    const startDay = taskData.startDate.toLocaleDateString('tr-TR', { weekday: 'long' })
    const endDay = taskData.endDate.toLocaleDateString('tr-TR', { weekday: 'long' })
    console.log(`✅ Created weekend task: "${taskData.title}"`)
    console.log(`   📅 ${startDay} → ${endDay}`)
    console.log(`   ⏱️  ${taskData.estimatedHours} hours`)
  }

  console.log('🎉 Weekend tasks created successfully!')
  console.log('📊 These tasks will test workload visibility on Cumartesi (Saturday) and Pazar (Sunday)')
}

createWeekendTasks()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
