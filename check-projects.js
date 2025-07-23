const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedUser: true
          }
        },
        workflowSteps: true
      }
    })
    
    console.log('=== PROJECT COMPARISON ===')
    projects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}: ${project.name}`)
      console.log(`- Tasks: ${project.tasks.length}`)
      console.log(`- Workflow Steps: ${project.workflowSteps.length}`)
      console.log(`- Project dates: ${project.startDate} to ${project.endDate}`)
      
      const tasksWithDates = project.tasks.filter(t => t.startDate && t.endDate)
      const tasksWithUsers = project.tasks.filter(t => t.assignedId)
      const tasksWithHours = project.tasks.filter(t => t.estimatedHours)
      
      console.log(`- Tasks with dates: ${tasksWithDates.length}/${project.tasks.length}`)
      console.log(`- Tasks with users: ${tasksWithUsers.length}/${project.tasks.length}`)
      console.log(`- Tasks with hours: ${tasksWithHours.length}/${project.tasks.length}`)
      
      if (tasksWithDates.length > 0) {
        console.log(`- Sample task dates:`)
        tasksWithDates.slice(0, 2).forEach(task => {
          console.log(`  * ${task.title}: ${task.startDate} to ${task.endDate} (${task.estimatedHours || 'no hours'})`)
        })
      }
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjects()
