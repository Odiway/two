const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestTasksForRealUsers() {
  try {
    // Get some real users
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: '@batarya.com'
        }
      },
      take: 10
    })

    if (users.length === 0) {
      console.log('Gerçek kullanıcılar bulunamadı')
      return
    }

    // Get an existing project
    const project = await prisma.project.findFirst()
    
    if (!project) {
      console.log('Proje bulunamadı')
      return
    }

    console.log(`${users.length} kullanıcı ve "${project.name}" projesi bulundu`)

    // Create some test tasks for July 2025
    const taskTemplates = [
      {
        title: 'Batarya Hücre Testi',
        description: 'Li-ion hücrelerin performans testlerinin yapılması',
        priority: 'HIGH',
        estimatedHours: 6
      },
      {
        title: 'Paket Montaj İşlemi',
        description: 'Batarya paketinin montaj işlemlerinin tamamlanması',
        priority: 'MEDIUM',
        estimatedHours: 8
      },
      {
        title: 'Kalite Kontrol',
        description: 'Üretilen bataryaların kalite kontrol süreçlerinden geçirilmesi',
        priority: 'HIGH',
        estimatedHours: 4
      },
      {
        title: 'Termal Yönetim Sistemi',
        description: 'Batarya paketinin termal yönetim sisteminin geliştirilmesi',
        priority: 'URGENT',
        estimatedHours: 10
      },
      {
        title: 'BMS Entegrasyonu',
        description: 'Battery Management System entegrasyonu ve testleri',
        priority: 'HIGH',
        estimatedHours: 12
      },
      {
        title: 'Güvenlik Testleri',
        description: 'Batarya paketinin güvenlik testlerinin yapılması',
        priority: 'URGENT',
        estimatedHours: 8
      },
      {
        title: 'Performans Optimizasyonu',
        description: 'Batarya performansının optimize edilmesi',
        priority: 'MEDIUM',
        estimatedHours: 6
      },
      {
        title: 'Dokümantasyon',
        description: 'Proje dokümantasyonunun hazırlanması',
        priority: 'LOW',
        estimatedHours: 4
      }
    ]

    const createdTasks = []

    // Create tasks for July 23-31, 2025
    for (let day = 23; day <= 31; day++) {
      const taskIndex = (day - 23) % taskTemplates.length
      const userIndex = (day - 23) % users.length
      const template = taskTemplates[taskIndex]
      const user = users[userIndex]

      const startDate = new Date(2025, 6, day) // July day, 2025
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Math.ceil(template.estimatedHours / 8)) // Assume 8 hours per day

      const task = await prisma.task.create({
        data: {
          title: `${template.title} - ${day} Temmuz`,
          description: template.description,
          status: day <= 25 ? 'COMPLETED' : day <= 27 ? 'IN_PROGRESS' : 'TODO',
          priority: template.priority,
          projectId: project.id,
          assignedId: user.id,
          createdById: user.id,
          startDate: startDate,
          endDate: endDate,
          estimatedHours: template.estimatedHours,
          actualHours: day <= 25 ? template.estimatedHours + Math.floor(Math.random() * 3) : 0,
          workloadPercentage: Math.round((template.estimatedHours / 8) * 100),
          delayDays: day <= 25 && Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
          isBottleneck: template.priority === 'URGENT'
        }
      })

      createdTasks.push(task)
      console.log(`✅ "${task.title}" görevi ${user.name} kullanıcısına atandı`)
    }

    console.log(`\n🎉 ${createdTasks.length} görev başarıyla oluşturuldu!`)
    console.log('📅 Görevler 23-31 Temmuz 2025 tarihleri arasında dağıtıldı')
    console.log('👥 Görevler gerçek takım üyelerine atandı')
    
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestTasksForRealUsers()
