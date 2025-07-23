const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addWorkflowSteps() {
  try {
    // Get the first project
    const project = await prisma.project.findFirst({
      include: {
        workflowSteps: true,
        tasks: true
      }
    })
    
    if (!project) {
      console.log('No project found')
      return
    }
    
    console.log(`Found project: ${project.name}`)
    console.log(`Existing workflow steps: ${project.workflowSteps.length}`)
    
    // Only add workflow steps if none exist
    if (project.workflowSteps.length === 0) {
      const workflowSteps = [
        {
          name: 'Planlama',
          color: '#3B82F6',
          order: 1,
          projectId: project.id
        },
        {
          name: 'Geliştirme',
          color: '#EF4444',
          order: 2,
          projectId: project.id
        },
        {
          name: 'Test',
          color: '#F59E0B',
          order: 3,
          projectId: project.id
        },
        {
          name: 'Dağıtım',
          color: '#10B981',
          order: 4,
          projectId: project.id
        }
      ]
      
      for (let step of workflowSteps) {
        const created = await prisma.workflowStep.create({
          data: step
        })
        console.log(`Created workflow step: ${created.name}`)
      }
      
      // Assign some tasks to workflow steps
      const tasks = await prisma.task.findMany({
        where: { projectId: project.id }
      })
      
      if (tasks.length > 0) {
        const steps = await prisma.workflowStep.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        })
        
        // Assign tasks to different workflow steps
        for (let i = 0; i < tasks.length; i++) {
          const stepIndex = i % steps.length
          await prisma.task.update({
            where: { id: tasks[i].id },
            data: { workflowStepId: steps[stepIndex].id }
          })
          console.log(`Assigned task "${tasks[i].title}" to workflow step "${steps[stepIndex].name}"`)
        }
      }
    } else {
      console.log('Workflow steps already exist')
    }
    
    // Show final status
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        workflowSteps: {
          orderBy: { order: 'asc' }
        },
        tasks: {
          include: {
            workflowStep: true
          }
        }
      }
    })
    
    console.log('\n=== PROJECT STATUS ===')
    console.log(`Project: ${updatedProject.name}`)
    console.log(`Workflow Steps: ${updatedProject.workflowSteps.length}`)
    updatedProject.workflowSteps.forEach(step => {
      const tasksInStep = updatedProject.tasks.filter(task => task.workflowStepId === step.id)
      console.log(`  - ${step.name}: ${tasksInStep.length} tasks`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addWorkflowSteps()
