const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTaskAssignments() {
  try {
    console.log('=== FIXING TASK ASSIGNMENTS ===')
    
    // Get all users
    const users = await prisma.user.findMany()
    console.log(`Available users: ${users.map(u => u.name).join(', ')}`)
    
    // Get all tasks without assignments
    const unassignedTasks = await prisma.task.findMany({
      where: {
        assignedId: null
      },
      include: {
        project: true
      }
    })
    
    console.log(`Found ${unassignedTasks.length} unassigned tasks`)
    
    // Assign tasks to users in round-robin fashion
    for (let i = 0; i < unassignedTasks.length; i++) {
      const task = unassignedTasks[i]
      const user = users[i % users.length] // Round-robin assignment
      
      await prisma.task.update({
        where: { id: task.id },
        data: { assignedId: user.id }
      })
      
      console.log(`✅ Assigned "${task.title}" → ${user.name}`)
    }
    
    console.log('\n=== VERIFICATION ===')
    
    const updatedProjects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedUser: true
          }
        }
      }
    })
    
    updatedProjects.forEach(project => {
      const assignedTasks = project.tasks.filter(t => t.assignedId)
      console.log(`👥 ${project.name}: ${assignedTasks.length}/${project.tasks.length} tasks now have users`)
      
      if (assignedTasks.length > 0) {
        console.log(`   Assignments: ${assignedTasks.map(t => `${t.assignedUser?.name}: ${t.title.substring(0, 30)}...`).join(', ')}`)
      }
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTaskAssignments()
