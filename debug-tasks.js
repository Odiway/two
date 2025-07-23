const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        assignedUser: true,
      },
    })

    console.log('Toplam görev sayısı:', tasks.length)
    console.log('\nGörevler ve atanan kullanıcılar:')

    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. Görev:`)
      console.log(`   Başlık: ${task.title}`)
      console.log(`   Proje: ${task.project.name}`)
      console.log(`   Atanan Kullanıcı ID: ${task.assignedUserId || 'YOK'}`)
      console.log(
        `   Atanan Kullanıcı: ${
          task.assignedUser ? task.assignedUser.name : 'YOK'
        }`
      )
      console.log(
        `   Email: ${task.assignedUser ? task.assignedUser.email : 'YOK'}`
      )
      console.log(`   Durum: ${task.status}`)
      console.log('   ---')
    })
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTasks()
