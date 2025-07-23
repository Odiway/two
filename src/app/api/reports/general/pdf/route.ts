import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'

interface ReportsData {
  generatedAt: string
  summary: {
    totalProjects: number
    totalTasks: number
    totalUsers: number
    completedProjects: number
    completedTasks: number
    overdueTasks: number
  }
  projects: any[]
  departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
    }
  >
}

async function getReportsData(): Promise<ReportsData> {
  // Projects with tasks and members
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  // Users with their departments
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: true,
    },
  })

  // Calculate summary statistics
  const totalProjects = projects.length
  const completedProjects = projects.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'COMPLETED').length,
    0
  )
  const overdueTasks = projects.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter((t) => {
        const endDate = t.endDate ? new Date(t.endDate) : null
        return endDate && endDate < new Date() && t.status !== 'COMPLETED'
      }).length,
    0
  )

  // Group users by department
  const departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
    }
  > = {}

  users.forEach((user) => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalTasks: 0,
        completedTasks: 0,
      }
    }
    departments[user.department].userCount++
    departments[user.department].totalTasks += user.assignedTasks.length
    departments[user.department].completedTasks += user.assignedTasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length
  })

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProjects,
      totalTasks,
      totalUsers: users.length,
      completedProjects,
      completedTasks,
      overdueTasks,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      tasks: p.tasks,
      members: p.members,
    })),
    departments,
  }
}

function generateHTML(data: ReportsData): string {
  const { summary, projects, departments } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Genel Proje Raporu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          color: #1e40af;
          font-size: 2.5em;
          margin: 0;
          font-weight: bold;
        }
        .subtitle {
          color: #6b7280;
          font-size: 1.2em;
          margin: 10px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 5px solid #2563eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #1e40af;
          margin: 0;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.9em;
          margin: 5px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section {
          margin: 40px 0;
        }
        .section-title {
          color: #1e40af;
          font-size: 1.8em;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #f8fafc;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-in-progress {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .status-planning {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-on-hold {
          background-color: #f3f4f6;
          color: #374151;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
          transition: width 0.3s ease;
        }
        .department-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .department-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .department-name {
          font-size: 1.2em;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
        }
        .department-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .department-stat {
          text-align: center;
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .department-stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #2563eb;
        }
        .department-stat-label {
          font-size: 0.8em;
          color: #6b7280;
          margin-top: 5px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Genel Proje Raporu</h1>
        <p class="subtitle">Rapor Tarihi: ${generatedDate}</p>
      </div>

      <div class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${summary.totalProjects}</div>
            <div class="stat-label">Toplam Proje</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.completedProjects}</div>
            <div class="stat-label">Tamamlanan Proje</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.totalTasks}</div>
            <div class="stat-label">Toplam Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.completedTasks}</div>
            <div class="stat-label">Tamamlanan Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.totalUsers}</div>
            <div class="stat-label">Toplam Kullanıcı</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.overdueTasks}</div>
            <div class="stat-label">Geciken Görev</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Proje Detayları</h2>
        <table>
          <thead>
            <tr>
              <th>Proje Adı</th>
              <th>Durum</th>
              <th>Görev İlerlemesi</th>
              <th>Ekip Üyesi</th>
              <th>Son Güncelleme</th>
            </tr>
          </thead>
          <tbody>
            ${projects
              .map((project) => {
                const completedTasks = project.tasks.filter(
                  (t: any) => t.status === 'COMPLETED'
                ).length
                const totalTasks = project.tasks.length
                const progressPercentage =
                  totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0

                const statusClass =
                  project.status === 'COMPLETED'
                    ? 'status-completed'
                    : project.status === 'IN_PROGRESS'
                    ? 'status-in-progress'
                    : project.status === 'PLANNING'
                    ? 'status-planning'
                    : 'status-on-hold'

                const statusText =
                  project.status === 'COMPLETED'
                    ? 'Tamamlandı'
                    : project.status === 'IN_PROGRESS'
                    ? 'Devam Ediyor'
                    : project.status === 'PLANNING'
                    ? 'Planlanıyor'
                    : 'Beklemede'

                return `
                <tr>
                  <td>
                    <strong>${project.name}</strong><br>
                    <small style="color: #6b7280;">${
                      project.description
                    }</small>
                  </td>
                  <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                  </td>
                  <td>
                    <div>${completedTasks}/${totalTasks} (%${progressPercentage})</div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                  </td>
                  <td>${project.members.length} üye</td>
                  <td>${new Date(project.updatedAt).toLocaleDateString(
                    'tr-TR'
                  )}</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Departman Analizi</h2>
        <div class="department-grid">
          ${Object.values(departments)
            .map(
              (dept: any) => `
            <div class="department-card">
              <div class="department-name">${dept.name}</div>
              <div class="department-stats">
                <div class="department-stat">
                  <div class="department-stat-value">${dept.userCount}</div>
                  <div class="department-stat-label">Kullanıcı</div>
                </div>
                <div class="department-stat">
                  <div class="department-stat-value">${dept.totalTasks}</div>
                  <div class="department-stat-label">Toplam Görev</div>
                </div>
                <div class="department-stat">
                  <div class="department-stat-value">${
                    dept.totalTasks > 0
                      ? Math.round(
                          (dept.completedTasks / dept.totalTasks) * 100
                        )
                      : 0
                  }%</div>
                  <div class="department-stat-label">Tamamlama</div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="footer">
        <p>Bu rapor otomatik olarak ${generatedDate} tarihinde oluşturulmuştur.</p>
      </div>
    </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  try {
    const data = await getReportsData()
    const html = generateHTML(data)

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Set content and wait for it to load
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    await browser.close()

    // Return PDF with proper headers
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="genel-rapor-${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
