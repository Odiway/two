import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'

interface DepartmentData {
  [key: string]: {
    name: string
    userCount: number
    totalTasks: number
    completedTasks: number
    users: Array<{
      id: string
      name: string
      email: string
      position: string | null
      totalTasks: number
      completedTasks: number
    }>
    projects: Set<string>
  }
}

async function getDepartmentData() {
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: {
        include: {
          project: true,
        },
      },
    },
  })

  const departments: DepartmentData = {}

  users.forEach((user) => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalTasks: 0,
        completedTasks: 0,
        users: [],
        projects: new Set(),
      }
    }

    const dept = departments[user.department]
    dept.userCount++
    dept.totalTasks += user.assignedTasks.length
    dept.completedTasks += user.assignedTasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length

    dept.users.push({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      totalTasks: user.assignedTasks.length,
      completedTasks: user.assignedTasks.filter((t) => t.status === 'COMPLETED')
        .length,
    })

    // Add unique projects
    user.assignedTasks.forEach((task) => {
      dept.projects.add(task.project.id)
    })
  })

  return {
    generatedAt: new Date().toISOString(),
    departments: Object.fromEntries(
      Object.entries(departments).map(([key, dept]) => [
        key,
        {
          ...dept,
          projectCount: dept.projects.size,
          projects: undefined, // Remove Set from response
        },
      ])
    ),
  }
}

function generateHTML(data: any): string {
  const { departments } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Departman Analiz Raporu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #16a34a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          color: #15803d;
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
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 5px solid #16a34a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #15803d;
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
          page-break-inside: avoid;
        }
        .section-title {
          color: #15803d;
          font-size: 1.8em;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .department {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-left: 5px solid #16a34a;
          page-break-inside: avoid;
        }
        .department-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .department-name {
          color: #15803d;
          font-size: 1.5em;
          font-weight: bold;
          margin: 0;
        }
        .department-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .department-stat {
          text-align: center;
          padding: 15px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }
        .department-stat-value {
          font-size: 1.8em;
          font-weight: bold;
          color: #16a34a;
        }
        .department-stat-label {
          font-size: 0.85em;
          color: #6b7280;
          margin-top: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
          transition: width 0.3s ease;
        }
        .performance-indicator {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
        }
        .excellent { background-color: #d1fae5; color: #065f46; }
        .good { background-color: #dbeafe; color: #1e40af; }
        .average { background-color: #fef3c7; color: #92400e; }
        .poor { background-color: #fee2e2; color: #dc2626; }
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
        <h1 class="title">Departman Analiz Raporu</h1>
        <p class="subtitle">Rapor Tarihi: ${generatedDate}</p>
      </div>

      <div class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${Object.keys(departments).length}</div>
            <div class="stat-label">Toplam Departman</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.userCount,
              0
            )}</div>
            <div class="stat-label">Toplam Kullanıcı</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.totalTasks,
              0
            )}</div>
            <div class="stat-label">Toplam Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.completedTasks,
              0
            )}</div>
            <div class="stat-label">Tamamlanan Görev</div>
          </div>
        </div>
      </div>

      ${Object.entries(departments)
        .map(([deptName, dept]: [string, any]) => {
          const completionRate =
            dept.totalTasks > 0
              ? Math.round((dept.completedTasks / dept.totalTasks) * 100)
              : 0
          const performanceClass =
            completionRate >= 90
              ? 'excellent'
              : completionRate >= 70
              ? 'good'
              : completionRate >= 50
              ? 'average'
              : 'poor'

          const performanceText =
            completionRate >= 90
              ? 'Mükemmel'
              : completionRate >= 70
              ? 'İyi'
              : completionRate >= 50
              ? 'Orta'
              : 'Geliştirilmeli'

          return `
          <div class="department">
            <div class="department-header">
              <h2 class="department-name">${dept.name}</h2>
              <span class="performance-indicator ${performanceClass}">${performanceText} (%${completionRate})</span>
            </div>
            
            <div class="department-stats">
              <div class="department-stat">
                <div class="department-stat-value">${dept.userCount}</div>
                <div class="department-stat-label">Kullanıcı Sayısı</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${
                  dept.projectCount || 0
                }</div>
                <div class="department-stat-label">Aktif Proje</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${dept.totalTasks}</div>
                <div class="department-stat-label">Toplam Görev</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${dept.completedTasks}</div>
                <div class="department-stat-label">Tamamlanan</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">%${completionRate}</div>
                <div class="department-stat-label">Tamamlama Oranı</div>
              </div>
            </div>

            <h3 style="color: #15803d; margin-top: 30px; margin-bottom: 15px;">Departman Çalışanları</h3>
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Pozisyon</th>
                  <th>Görev Sayısı</th>
                  <th>Tamamlanan</th>
                  <th>Başarı Oranı</th>
                </tr>
              </thead>
              <tbody>
                ${dept.users
                  .map((user: any) => {
                    const userCompletionRate =
                      user.totalTasks > 0
                        ? Math.round(
                            (user.completedTasks / user.totalTasks) * 100
                          )
                        : 0
                    return `
                    <tr>
                      <td><strong>${user.name}</strong></td>
                      <td>${user.email}</td>
                      <td>${user.position || 'Belirtilmemiş'}</td>
                      <td>${user.totalTasks}</td>
                      <td>${user.completedTasks}</td>
                      <td>
                        %${userCompletionRate}
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${userCompletionRate}%"></div>
                        </div>
                      </td>
                    </tr>
                  `
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        })
        .join('')}

      <div class="footer">
        <p>Bu rapor otomatik olarak ${generatedDate} tarihinde oluşturulmuştur.</p>
      </div>
    </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  try {
    const data = await getDepartmentData()
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
        'Content-Disposition': `attachment; filename="departman-analizi-${
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
