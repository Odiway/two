const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedUsersAndAssignTasks() {
  try {
    // Delete existing mock users first
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['ahmet@example.com', 'fatma@example.com', 'mehmet@example.com']
        }
      }
    })

    // Real team members data
    const realUsers = [
      {
        name: 'Ali Ağçakoyunlu',
        email: 'ali.agcakoyunlu@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT001'
      },
      {
        name: 'Arda Sönmez',
        email: 'arda.sonmez@batarya.com', 
        department: 'Batarya Geliştirme Ekibi',
        position: 'Tts Batarya Geliştirme Mühendisi',
        studentId: 'GLT001'
      },
      {
        name: 'Batuhan Salıcı',
        email: 'batuhan.salici@batarya.com',
        department: 'Batarya Geliştirme Ekibi', 
        position: 'Arge Mühendisi',
        studentId: '6389'
      },
      {
        name: 'Berk Ertürk',
        email: 'berk.erturk@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Batarya Geliştirme Mühendisi',
        studentId: 'GLT002'
      },
      {
        name: 'Berkay Şimşek',
        email: 'berkay.simsek@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Batarya Ve Mobilite Endüstriyelleşme Mühendisi',
        studentId: 'PKT002'
      },
      {
        name: 'Biran Can Türe',
        email: 'biran.ture@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '15'
      },
      {
        name: 'Canberk Albay',
        email: 'canberk.albay@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Batarya Ve Mobilite Endüstriyelleşme Yöneticisi',
        studentId: '5243'
      },
      {
        name: 'Ekrem Atıcı',
        email: 'ekrem.atici@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT003'
      },
      {
        name: 'Esra Dönmez',
        email: 'esra.donmez@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '6623'
      },
      {
        name: 'Fatih Rüştü Pıtır',
        email: 'fatih.pitir@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT004'
      },
      {
        name: 'Hüseyin Can Sak',
        email: 'huseyin.sak@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT005'
      },
      {
        name: 'Kemal Taştan',
        email: 'kemal.tastan@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT006'
      },
      {
        name: 'Mete Han Kuşdemir',
        email: 'mete.kusdemir@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '5223'
      },
      {
        name: 'Muhammed Karakuş',
        email: 'muhammed.karakus@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '5253'
      },
      {
        name: 'Murat Kara',
        email: 'murat.kara@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Uzmanı',
        studentId: '6322'
      },
      {
        name: 'Oğuzhan İnandı',
        email: 'oguzhan.inandi@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Tts Mobilite Ve Endüstriyelleşme Mühendisi',
        studentId: 'PKT007'
      },
      {
        name: 'Ömer Arısoy',
        email: 'omer.arisoy@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT008'
      },
      {
        name: 'Samet Danacı',
        email: 'samet.danaci@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT009'
      },
      {
        name: 'Selim Akbudak',
        email: 'selim.akbudak@batarya.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Batarya Geliştirme Yöneticisi',
        studentId: '5290'
      },
      {
        name: 'Yaşar Doğan',
        email: 'yasar.dogan@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT010'
      },
      {
        name: 'Yunus Emre Koç',
        email: 'yunus.koc@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT011'
      },
      {
        name: 'Yusuf Kebüde',
        email: 'yusuf.kebude@batarya.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        studentId: 'PKT012'
      }
    ]

    // Create all real users
    const createdUsers = []
    for (const userData of realUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          name: userData.name,
          email: userData.email,
          department: userData.department,
          position: userData.position,
          studentId: userData.studentId,
          maxHoursPerDay: 8,
          workingDays: "1,2,3,4,5" // Monday to Friday as comma-separated string
        },
      })
      createdUsers.push(user)
    }

    console.log(`${createdUsers.length} gerçek kullanıcı oluşturuldu:`)
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.email} (${user.department})`)
    })

    // Şimdi görevleri rastgele kullanıcılara atayalım
    const tasks = await prisma.task.findMany()

    if (tasks.length > 0 && createdUsers.length > 0) {
      // Görevleri farklı departmanlardan kullanıcılara dağıt
      const developmentUsers = createdUsers.filter(user => user.department === 'Batarya Geliştirme Ekibi')
      const packagingUsers = createdUsers.filter(user => user.department === 'Batarya Paketleme Ekibi')
      
      for (let i = 0; i < Math.min(tasks.length, 8); i++) {
        let assignedUser
        
        // İlk 4 görevi geliştirme ekibine, sonrakini paketleme ekibine ata
        if (i < 4 && developmentUsers.length > 0) {
          assignedUser = developmentUsers[i % developmentUsers.length]
        } else if (packagingUsers.length > 0) {
          assignedUser = packagingUsers[i % packagingUsers.length]
        } else {
          assignedUser = createdUsers[i % createdUsers.length]
        }

        await prisma.task.update({
          where: { id: tasks[i].id },
          data: { assignedId: assignedUser.id },
        })
      }

      console.log('\nGörevler gerçek takım üyelerine atandı!')
      console.log('Geliştirme ekibi görevleri:', developmentUsers.length, 'kişi')
      console.log('Paketleme ekibi görevleri:', packagingUsers.length, 'kişi')
    }
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsersAndAssignTasks()
