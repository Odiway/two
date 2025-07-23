import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking existing data...')

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
    }
  })

  console.log('\n👥 Existing Users:')
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.department} - ${user.position})`)
  })

  // Check projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  })

  console.log('\n📊 Existing Projects:')
  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} (${project.status}) - ${project._count.tasks} tasks`)
  })

  console.log(`\n✅ Found ${users.length} users and ${projects.length} projects`)
  
  if (users.length > 0) {
    console.log('\n💡 You can use these existing users to create a test project for the enhanced calendar.')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error checking data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
