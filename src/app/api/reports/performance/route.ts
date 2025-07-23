import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface DepartmentComparison {
  name: string
  userCount: number
  totalEfficiency: number
  totalCompletionRate: number
  totalOverdue: number
  highPerformers: number
}

export async function GET() {
  try {
    const [users, tasks, projects] = await Promise.all([
      prisma.user.findMany({
        include: {
          assignedTasks: {
            include: {
              project: true,
            },
          },
          taskAssignments: {
            include: {
              task: {
                include: {
                  project: true,
                },
              },
            },
          },
          projects: {
            include: {
              project: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        include: {
          project: true,
          assignedUser: true,
        },
      }),
      prisma.project.findMany({
        include: {
          tasks: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      }),
    ])

    // Kullanıcı performans analizi
    const userPerformance = users
      .map((user) => {
        // Kullanıcının görevlerini topla
        const allUserTasks = [
          ...user.assignedTasks,
          ...user.taskAssignments.map((assignment) => assignment.task),
        ]

        // Tekrar eden görevleri filtrele
        const uniqueTasks = allUserTasks.filter(
          (task, index, self) =>
            index === self.findIndex((t) => t.id === task.id)
        )

        const completedTasks = uniqueTasks.filter(
          (t) => t.status === 'COMPLETED'
        )
        const inProgressTasks = uniqueTasks.filter(
          (t) => t.status === 'IN_PROGRESS'
        )
        const overdueTasks = uniqueTasks.filter((task) => {
          if (!task.endDate || task.status === 'COMPLETED') return false
          return new Date(task.endDate) < new Date()
        })

        const activeProjects = user.projects.filter(
          (p) =>
            p.project.status === 'IN_PROGRESS' ||
            p.project.status === 'PLANNING'
        )

        // Performans metrikleri
        const completionRate =
          uniqueTasks.length > 0
            ? Math.round((completedTasks.length / uniqueTasks.length) * 100)
            : 0

        const efficiency =
          overdueTasks.length === 0
            ? 100
            : Math.max(0, 100 - overdueTasks.length * 20)
        const productivity = Math.min(100, completedTasks.length * 10)
        const workloadScore =
          inProgressTasks.length * 2 +
          activeProjects.length +
          overdueTasks.length * 3

        // Son 30 günde tamamlanan görevler
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentCompletedTasks = completedTasks.filter(
          (task) => task.updatedAt && new Date(task.updatedAt) >= thirtyDaysAgo
        ).length

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            position: user.position,
          },
          metrics: {
            totalTasks: uniqueTasks.length,
            completedTasks: completedTasks.length,
            inProgressTasks: inProgressTasks.length,
            overdueTasks: overdueTasks.length,
            activeProjects: activeProjects.length,
            completionRate,
            efficiency,
            productivity,
            workloadScore,
            recentActivity: recentCompletedTasks,
          },
          performance: {
            level:
              efficiency >= 90
                ? 'Mükemmel'
                : efficiency >= 80
                ? 'Yüksek'
                : efficiency >= 60
                ? 'Orta'
                : 'Düşük',
            riskLevel:
              overdueTasks.length >= 3
                ? 'Yüksek'
                : overdueTasks.length >= 1
                ? 'Orta'
                : 'Düşük',
            recommendation:
              overdueTasks.length >= 3
                ? 'Acil müdahale gerekli - İş yükü azaltılmalı'
                : overdueTasks.length >= 1
                ? 'Yakın takip - Destek sağlanmalı'
                : workloadScore >= 10
                ? 'İş yükü dengelemesi gerekli'
                : efficiency >= 90
                ? 'Mükemmel performans - Örnek alınmalı'
                : efficiency >= 80
                ? 'İyi performans - Motive edilmeli'
                : 'Performans iyileştirme gerekli',
          },
          trends: {
            taskCompletionTrend:
              recentCompletedTasks >= 5
                ? 'Artan'
                : recentCompletedTasks >= 2
                ? 'Stabil'
                : 'Azalan',
            workloadTrend:
              workloadScore >= 10
                ? 'Yüksek'
                : workloadScore >= 6
                ? 'Orta'
                : 'Düşük',
          },
        }
      })
      .sort((a, b) => b.metrics.efficiency - a.metrics.efficiency)

    // Proje performans analizi
    const projectPerformance = projects
      .map((project) => {
        const totalTasks = project.tasks.length
        const completedTasks = project.tasks.filter(
          (t) => t.status === 'COMPLETED'
        ).length
        const overdueTasks = project.tasks.filter((task) => {
          if (!task.endDate || task.status === 'COMPLETED') return false
          return new Date(task.endDate) < new Date()
        }).length

        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        const isOverdue =
          project.endDate &&
          project.status !== 'COMPLETED' &&
          new Date(project.endDate) < new Date()

        return {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
          },
          metrics: {
            totalTasks,
            completedTasks,
            progress,
            overdueTasks,
            teamSize: project.members.length,
            isOverdue,
          },
          performance: {
            level:
              progress >= 90
                ? 'Mükemmel'
                : progress >= 70
                ? 'İyi'
                : progress >= 50
                ? 'Orta'
                : 'Düşük',
            riskLevel:
              overdueTasks >= 5 || isOverdue
                ? 'Yüksek'
                : overdueTasks >= 2
                ? 'Orta'
                : 'Düşük',
          },
        }
      })
      .sort((a, b) => b.metrics.progress - a.metrics.progress)

    // Genel performans özeti
    const overallMetrics = {
      topPerformers: userPerformance.filter((u) => u.metrics.efficiency >= 80)
        .length,
      underPerformers: userPerformance.filter((u) => u.metrics.efficiency < 60)
        .length,
      highRiskUsers: userPerformance.filter(
        (u) => u.performance.riskLevel === 'Yüksek'
      ).length,
      averageEfficiency: Math.round(
        userPerformance.reduce(
          (sum, user) => sum + user.metrics.efficiency,
          0
        ) / userPerformance.length
      ),
      averageCompletionRate: Math.round(
        userPerformance.reduce(
          (sum, user) => sum + user.metrics.completionRate,
          0
        ) / userPerformance.length
      ),
      totalOverdueTasks: userPerformance.reduce(
        (sum, user) => sum + user.metrics.overdueTasks,
        0
      ),
      highPerformingProjects: projectPerformance.filter(
        (p) => p.metrics.progress >= 80
      ).length,
      underPerformingProjects: projectPerformance.filter(
        (p) => p.metrics.progress < 50
      ).length,
    }

    // Departman performans karşılaştırması
    const departmentComparison = users.reduce((acc, user) => {
      const userPerf = userPerformance.find((up) => up.user.id === user.id)!

      if (!acc[user.department]) {
        acc[user.department] = {
          name: user.department,
          userCount: 0,
          totalEfficiency: 0,
          totalCompletionRate: 0,
          totalOverdue: 0,
          highPerformers: 0,
        }
      }

      acc[user.department].userCount++
      acc[user.department].totalEfficiency += userPerf.metrics.efficiency
      acc[user.department].totalCompletionRate +=
        userPerf.metrics.completionRate
      acc[user.department].totalOverdue += userPerf.metrics.overdueTasks
      if (userPerf.metrics.efficiency >= 80)
        acc[user.department].highPerformers++

      return acc
    }, {} as Record<string, DepartmentComparison>)

    const departmentStats = Object.values(departmentComparison)
      .map((dept: DepartmentComparison) => ({
        name: dept.name,
        averageEfficiency: Math.round(dept.totalEfficiency / dept.userCount),
        averageCompletionRate: Math.round(
          dept.totalCompletionRate / dept.userCount
        ),
        totalOverdue: dept.totalOverdue,
        highPerformerRate: Math.round(
          (dept.highPerformers / dept.userCount) * 100
        ),
        userCount: dept.userCount,
      }))
      .sort((a, b) => b.averageEfficiency - a.averageEfficiency)

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      summary: overallMetrics,
      userPerformance: userPerformance.slice(0, 20), // Top 20 kullanıcı
      projectPerformance: projectPerformance.slice(0, 10), // Top 10 proje
      departmentComparison: departmentStats,
      recommendations: {
        immediate: [
          ...(overallMetrics.highRiskUsers > 0
            ? [
                `${overallMetrics.highRiskUsers} yüksek riskli çalışan için acil müdahale gerekli`,
              ]
            : []),
          ...(overallMetrics.totalOverdueTasks > 10
            ? ['Gecikmiş görevler için öncelik belirlenmesi gerekli']
            : []),
          ...(overallMetrics.underPerformingProjects > 0
            ? [
                `${overallMetrics.underPerformingProjects} düşük performanslı proje için plan revizyonu`,
              ]
            : []),
        ],
        strategic: [
          'Yüksek performanslı çalışanların mentörlük rolü değerlendirilmeli',
          'Departman arası iş yükü dengelemesi analiz edilmeli',
          'Proje teslim süreçleri optimize edilmeli',
        ],
      },
    }

    const response = new NextResponse(JSON.stringify(reportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="performans-raporu-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    })

    return response
  } catch (error) {
    console.error('Performans raporu oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Performans raporu oluşturulamadı' },
      { status: 500 }
    )
  }
}
