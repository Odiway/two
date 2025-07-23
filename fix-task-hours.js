const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTaskHours() {
  try {
    console.log('=== FIXING MISSING ESTIMATED HOURS ===')
    
    // Get all tasks without estimated hours
    const tasksWithoutHours = await prisma.task.findMany({
      where: {
        estimatedHours: null
      },
      include: {
        project: true
      }
    })
    
    console.log(`Found ${tasksWithoutHours.length} tasks without estimated hours`)
    
    // Add default estimated hours based on task complexity
    for (let task of tasksWithoutHours) {
      // Estimate hours based on task title/complexity
      let estimatedHours = 16 // Default 2 days
      
      if (task.title.toLowerCase().includes('tasarım') || task.title.toLowerCase().includes('design')) {
        estimatedHours = 32 // 4 days for design tasks
      } else if (task.title.toLowerCase().includes('test') || task.title.toLowerCase().includes('protokol')) {
        estimatedHours = 24 // 3 days for testing
      } else if (task.title.toLowerCase().includes('optimiz') || task.title.toLowerCase().includes('analiz')) {
        estimatedHours = 40 // 5 days for optimization/analysis
      } else if (task.title.toLowerCase().includes('üretim') || task.title.toLowerCase().includes('produc')) {
        estimatedHours = 48 // 6 days for production tasks
      }
      
      await prisma.task.update({
        where: { id: task.id },
        data: { estimatedHours }
      })
      
      console.log(`✅ Updated "${task.title}" → ${estimatedHours} hours`)
    }
    
    // Also update project dates to current period for testing
    const projects = await prisma.project.findMany()
    
    for (let project of projects) {
      if (project.name !== 'Gelişmiş Proje Yönetim Sistemi') {
        const startDate = new Date('2025-07-01')
        const endDate = new Date('2025-09-30')
        
        await prisma.project.update({
          where: { id: project.id },
          data: { 
            startDate,
            endDate
          }
        })
        
        console.log(`📅 Updated project "${project.name}" dates to July-September 2025`)
      }
    }
    
    console.log('\n=== VERIFICATION ===')
    
    const updatedProjects = await prisma.project.findMany({
      include: {
        tasks: true
      }
    })
    
    updatedProjects.forEach(project => {
      const tasksWithHours = project.tasks.filter(t => t.estimatedHours)
      console.log(`📊 ${project.name}: ${tasksWithHours.length}/${project.tasks.length} tasks now have estimated hours`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTaskHours()
