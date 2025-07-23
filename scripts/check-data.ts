import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkExistingData() {
  console.log('🔍 Checking existing data...')

  const users = await prisma.user.findMany()
  console.log(`👥 Users: ${users.length}`)
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`)
  })

  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        include: {
          assignedUser: true
        }
      }
    }
  })
  console.log(`📊 Projects: ${projects.length}`)
  projects.forEach(project => {
    console.log(`  - ${project.name} (${project.tasks.length} tasks)`)
  })

  if (projects.length > 0) {
    console.log(`🌐 Test enhanced calendar at: http://localhost:3004/projects/${projects[0].id}`)
  }
}

checkExistingData()
  .catch((e) => {
    console.error('❌ Error checking data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
