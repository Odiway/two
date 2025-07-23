const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
  console.log('🌱 Creating enhanced calendar test data...')

  try {
    // Clean existing test data first
    console.log('🧹 Cleaning existing test data...')
    await prisma.taskTimeTracking.deleteMany()
    await prisma.projectBottleneck.deleteMany()
    await prisma.workloadAnalysis.deleteMany()
    await prisma.workflowStep.deleteMany()
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ Cleaned existing data')

    // Create test users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Ahmet Yılmaz',
          email: 'ahmet@example.com',
          department: 'Yazılım Geliştirme',
          position: 'Senior Developer',
          maxHoursPerDay: 8,
          workingDays: '1,2,3,4,5',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Ayşe Demir',
          email: 'ayse@example.com',
          department: 'Tasarım',
          position: 'UI/UX Designer',
          maxHoursPerDay: 8,
          workingDays: '1,2,3,4,5',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Mehmet Kaya',
          email: 'mehmet@example.com',
          department: 'Proje Yönetimi',
          position: 'Project Manager',
          maxHoursPerDay: 8,
          workingDays: '1,2,3,4,5',
        },
      }),
    ])

    console.log(`✅ Created ${users.length} test users`)

    // Create a comprehensive test project
    const project = await prisma.project.create({
      data: {
        name: 'Enhanced Calendar Test Project',
        description: 'A comprehensive project to test all enhanced calendar features including workload analysis, bottleneck detection, and automatic rescheduling.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        originalEndDate: new Date('2024-03-01'),
        delayDays: 14,
        autoReschedule: true,
        members: {
          create: users.map(user => ({
            userId: user.id,
            role: 'MEMBER',
          })),
        },
      },
    })

    console.log(`✅ Created test project: ${project.name}`)

    // Create comprehensive test tasks with different characteristics
    const tasks = await Promise.all([
      // Task 1: Normal task
      prisma.task.create({
        data: {
          title: 'Database Schema Design',
          description: 'Design and implement the enhanced database schema with tracking capabilities',
          status: 'COMPLETED',
          priority: 'HIGH',
          projectId: project.id,
          assignedId: users[0].id,
          createdById: users[2].id, // Project manager creates tasks
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-25'),
          estimatedHours: 40,
          actualHours: 35,
          delayDays: 0,
          workloadPercentage: 85,
          isBottleneck: false,
          originalEndDate: new Date('2024-01-25'),
        },
      }),
      
      // Task 2: Task with delay
      prisma.task.create({
        data: {
          title: 'Workload Analysis Implementation',
          description: 'Implement comprehensive workload analysis utilities',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          projectId: project.id,
          assignedId: users[0].id,
          createdById: users[2].id,
          startDate: new Date('2024-01-26'),
          endDate: new Date('2024-02-10'),
          estimatedHours: 60,
          actualHours: 45,
          delayReason: 'Complex requirements needed additional research',
          delayDays: 3,
          workloadPercentage: 95,
          isBottleneck: true,
          originalEndDate: new Date('2024-02-07'),
        },
      }),
      
      // Task 3: Bottleneck task
      prisma.task.create({
        data: {
          title: 'Enhanced Calendar Component',
          description: 'Create the advanced calendar component with multiple view modes',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          projectId: project.id,
          assignedId: users[1].id,
          createdById: users[2].id,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-20'),
          estimatedHours: 80,
          actualHours: 60,
          delayDays: 0,
          workloadPercentage: 90,
          isBottleneck: true,
          originalEndDate: new Date('2024-02-20'),
        },
      }),
      
      // Task 4: Dependent task
      prisma.task.create({
        data: {
          title: 'API Integration',
          description: 'Integrate enhanced calendar with project management APIs',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          assignedId: users[0].id,
          createdById: users[2].id,
          startDate: new Date('2024-02-21'),
          endDate: new Date('2024-03-05'),
          estimatedHours: 50,
          actualHours: 0,
          delayDays: 0,
          workloadPercentage: 0,
          isBottleneck: false,
          originalEndDate: new Date('2024-03-05'),
        },
      }),
      
      // Task 5: Testing task
      prisma.task.create({
        data: {
          title: 'System Testing & QA',
          description: 'Comprehensive testing of enhanced calendar functionality',
          status: 'TODO',
          priority: 'HIGH',
          projectId: project.id,
          assignedId: users[2].id,
          createdById: users[2].id,
          startDate: new Date('2024-03-06'),
          endDate: new Date('2024-03-15'),
          estimatedHours: 40,
          actualHours: 0,
          delayDays: 0,
          workloadPercentage: 0,
          isBottleneck: false,
          originalEndDate: new Date('2024-03-15'),
        },
      }),
    ])

    console.log(`✅ Created ${tasks.length} test tasks`)

    console.log('✅ Task time tracking data included with tasks')

    // Create project bottleneck analysis
    await prisma.projectBottleneck.create({
      data: {
        projectId: project.id,
        date: new Date('2024-02-01'),
        maxWorkload: 95,
        taskCount: 3,
        isBottleneck: true,
      },
    })

    // Create workload analysis
    await prisma.workloadAnalysis.create({
      data: {
        projectId: project.id,
        userId: users[0].id,
        date: new Date('2024-02-01'),
        workloadPercent: 84,
        hoursAllocated: 7,
        hoursAvailable: 8,
        isOverloaded: false,
      },
    })

    await prisma.workloadAnalysis.create({
      data: {
        projectId: project.id,
        userId: users[1].id,
        date: new Date('2024-02-01'),
        workloadPercent: 50,
        hoursAllocated: 4,
        hoursAvailable: 8,
        isOverloaded: false,
      },
    })

    console.log('✅ Created bottleneck and workload analysis records')

    // Create workflow steps
    await Promise.all([
      prisma.workflowStep.create({
        data: {
          name: 'Planning',
          order: 1,
          color: '#10B981',
          projectId: project.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          name: 'Development',
          order: 2,
          color: '#3B82F6',
          projectId: project.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          name: 'Testing',
          order: 3,
          color: '#F59E0B',
          projectId: project.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          name: 'Deployment',
          order: 4,
          color: '#8B5CF6',
          projectId: project.id,
        },
      }),
    ])

    console.log('✅ Created workflow steps')

    console.log('\n🎉 Enhanced calendar test data creation complete!')
    console.log(`Project ID: ${project.id}`)
    console.log(`You can now test the enhanced calendar at: http://localhost:3000/projects/${project.id}`)

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
