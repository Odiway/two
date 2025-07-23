const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTaskHours() {
  console.log('🔄 Updating task estimated hours for better workload distribution...')

  // Update tasks with realistic estimated hours
  const tasks = await prisma.task.findMany({
    where: {
      title: {
        in: [
          'Batarya Hücre Testi',
          'BMS Entegrasyonu',
          'Termal Yönetim Sistemi',
          'Batarya Paketleme',
          'Kalite Kontrol Testi',
          'Performans Analizi',
          'Güvenlik Testi',
          'Montaj İşlemleri',
          'Final Test'
        ]
      }
    }
  })

  const taskHours = {
    'Batarya Hücre Testi': 16, // 2 days * 8 hours
    'BMS Entegrasyonu': 24, // 3 days * 8 hours
    'Termal Yönetim Sistemi': 32, // 4 days * 8 hours
    'Batarya Paketleme': 24, // 3 days * 8 hours
    'Kalite Kontrol Testi': 16, // 2 days * 8 hours
    'Performans Analizi': 24, // 3 days * 8 hours
    'Güvenlik Testi': 16, // 2 days * 8 hours
    'Montaj İşlemleri': 32, // 4 days * 8 hours
    'Final Test': 8 // 1 day * 8 hours
  }

  for (const task of tasks) {
    const hours = taskHours[task.title] || 16 // Default 16 hours (2 days)
    
    await prisma.task.update({
      where: { id: task.id },
      data: {
        estimatedHours: hours,
        workloadPercentage: 100 // Full capacity
      }
    })
    
    console.log(`✅ Updated "${task.title}" with ${hours} estimated hours`)
  }

  console.log('🎉 All task hours updated successfully!')
}

updateTaskHours()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
