import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating enhanced calendar test project...')

  // Get existing users
  const users = await prisma.user.findMany()
  
  if (users.length === 0) {
    console.log('❌ No users found. Please add users first.')
    return
  }

  console.log(`✅ Found ${users.length} users`)

  // Create test project with enhanced features
  const project = await prisma.project.create({
    data: {
      name: 'Gelişmiş Proje Yönetim Sistemi',
      description: 'Enhanced calendar ve workload analysis özelliklerini test etmek için örnek proje',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-09-30'),
      originalEndDate: new Date('2025-09-15'),
      delayDays: 15,
      autoReschedule: true,
    }
  })

  // Create enhanced tasks with proper schema fields
  const task1 = await prisma.task.create({
    data: {
      title: 'Sistem Mimarisi Tasarımı',
      description: 'Gelişmiş kalendar sistemi için teknik mimari tasarımı',
      status: 'COMPLETED',
      priority: 'HIGH',
      projectId: project.id,
      assignedId: users[0].id, // Use correct field name
      createdById: users[2].id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-15'),
      completedAt: new Date('2025-07-17'),
      estimatedHours: 60,
      actualHours: 68,
      delayReason: 'Ek güvenlik gereksinimleri eklendi',
      delayDays: 2,
      workloadPercentage: 90,
      isBottleneck: false,
      originalEndDate: new Date('2025-07-15'),
    }
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Workload Analysis Algoritması',
      description: 'İş yükü analizi ve bottleneck detection algoritması geliştirme',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      assignedId: users[0].id,
      createdById: users[2].id,
      startDate: new Date('2025-07-16'),
      endDate: new Date('2025-08-15'),
      estimatedHours: 120,
      actualHours: 75,
      delayReason: '',
      delayDays: 0,
      workloadPercentage: 95,
      isBottleneck: true,
      originalEndDate: new Date('2025-08-15'),
    }
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Enhanced Calendar UI Tasarımı',
      description: 'Dinamik kalendar arayüzü ve görselleştirme tasarımı',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: project.id,
      assignedId: users[1].id,
      createdById: users[2].id,
      startDate: new Date('2025-07-20'),
      endDate: new Date('2025-08-20'),
      estimatedHours: 80,
      actualHours: 45,
      delayReason: '',
      delayDays: 0,
      workloadPercentage: 70,
      isBottleneck: false,
      originalEndDate: new Date('2025-08-20'),
    }
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'API Entegrasyonu',
      description: 'Enhanced calendar için backend API servislerini entegre etme',
      status: 'TODO',
      priority: 'HIGH',
      projectId: project.id,
      assignedId: users[0].id,
      createdById: users[2].id,
      startDate: new Date('2025-08-16'),
      endDate: new Date('2025-09-10'),
      estimatedHours: 100,
      actualHours: 0,
      delayReason: '',
      delayDays: 0,
      workloadPercentage: 85,
      isBottleneck: true,
      originalEndDate: new Date('2025-09-10'),
    }
  })

  const task5 = await prisma.task.create({
    data: {
      title: 'Test ve Optimizasyon',
      description: 'Performans testleri ve sistem optimizasyonu',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      assignedId: users[2].id,
      createdById: users[2].id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-30'),
      estimatedHours: 60,
      actualHours: 0,
      delayReason: '',
      delayDays: 0,
      workloadPercentage: 50,
      isBottleneck: false,
      originalEndDate: new Date('2025-09-30'),
    }
  })

  console.log('✅ Enhanced calendar test project created successfully!')
  console.log(`📊 Project: ${project.name}`)
  console.log(`📋 Tasks: 5 tasks with enhanced tracking`)
  console.log(`🌐 Test at: http://localhost:3004/projects/${project.id}`)
  console.log(`\nTasks summary:`)
  console.log(`- ${task1.title} (Completed) - ${users[0].name}`)
  console.log(`- ${task2.title} (In Progress) - ${users[0].name} [BOTTLENECK]`)
  console.log(`- ${task3.title} (In Progress) - ${users[1].name}`)
  console.log(`- ${task4.title} (Todo) - ${users[0].name} [BOTTLENECK]`)
  console.log(`- ${task5.title} (Todo) - ${users[2].name}`)
}

main()
  .catch((e) => {
    console.error('❌ Error creating test project:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
