const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createLongTermTasks() {
  console.log('🔄 Creating long-term tasks for workload persistence testing...')

  // Get some users for assignment
  const users = await prisma.user.findMany({
    take: 5,
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

  // Create long-term tasks spanning multiple weeks
  const longTermTasks = [
    {
      title: 'Uzun Vadeli Araştırma Projesi',
      description: 'Yeni nesil batarya teknolojisi araştırması',
      startDate: new Date(2025, 6, 23), // July 23, 2025
      endDate: new Date(2025, 7, 15), // August 15, 2025 (23 days)
      estimatedHours: 184, // 23 working days * 8 hours
      assignedId: users[0].id,
      priority: 'HIGH'
    },
    {
      title: 'Sürekli Kalite İzleme',
      description: 'Günlük kalite kontrol ve izleme işlemleri',
      startDate: new Date(2025, 6, 24), // July 24, 2025  
      endDate: new Date(2025, 7, 8), // August 8, 2025 (11 days)
      estimatedHours: 88, // 11 working days * 8 hours
      assignedId: users[1].id,
      priority: 'MEDIUM'
    },
    {
      title: 'Haftalık Performans Analizi',
      description: 'Haftalık batarya performans değerlendirmesi',
      startDate: new Date(2025, 6, 25), // July 25, 2025
      endDate: new Date(2025, 7, 1), // August 1, 2025 (5 days)
      estimatedHours: 40, // 5 working days * 8 hours
      assignedId: users[2].id,
      priority: 'LOW'
    }
  ]

  for (const taskData of longTermTasks) {
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
    
    console.log(`✅ Created long-term task: "${taskData.title}" (${taskData.estimatedHours} hours over ${Math.ceil((taskData.endDate - taskData.startDate) / (1000 * 60 * 60 * 24))} days)`)
  }

  console.log('🎉 Long-term tasks created successfully!')
  console.log('📊 These tasks will help test workload persistence across multiple days/weeks')
}

createLongTermTasks()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
