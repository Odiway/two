const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    const users = await prisma.user.findMany()
    const tasks = await prisma.task.findMany()
    const projects = await prisma.project.findMany()

    console.log('Database Status:')
    console.log('================')
    console.log(`Users: ${users.length}`)
    console.log(`Tasks: ${tasks.length}`)
    console.log(`Projects: ${projects.length}`)
    
    if (users.length > 0) {
      console.log('\nUsers in database:')
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.department})`)
      })
    }

    if (tasks.length > 0) {
      console.log('\nTasks in database:')
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title} - Assigned to: ${task.assignedId || 'None'}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
