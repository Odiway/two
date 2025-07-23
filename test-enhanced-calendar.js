/**
 * Enhanced Calendar System Test Script
 * This script tests all the enhanced calendar functionality
 */

const BASE_URL = 'http://localhost:3000/api';

async function testEnhancedCalendarSystem() {
  console.log('🚀 Testing Enhanced Calendar System...\n');

  try {
    // Test 1: Check if API routes are accessible
    console.log('📍 Test 1: API Route Accessibility');
    
    // Test tasks API
    const tasksResponse = await fetch(`${BASE_URL}/tasks`);
    console.log(`Tasks API: ${tasksResponse.status === 200 ? '✅ Available' : '❌ Not accessible'}`);
    
    // Test projects API
    const projectsResponse = await fetch(`${BASE_URL}/projects`);
    console.log(`Projects API: ${projectsResponse.status === 200 ? '✅ Available' : '❌ Not accessible'}`);
    
    // Test 2: Get sample project data
    console.log('\n📍 Test 2: Project Data Retrieval');
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      if (projects.length > 0) {
        const sampleProject = projects[0];
        console.log(`✅ Found ${projects.length} projects`);
        console.log(`Sample project: ${sampleProject.name} (ID: ${sampleProject.id})`);
        
        // Test 3: Get detailed project with tasks
        console.log('\n📍 Test 3: Detailed Project Data');
        const projectDetailResponse = await fetch(`${BASE_URL}/projects/${sampleProject.id}`);
        if (projectDetailResponse.ok) {
          const projectDetail = await projectDetailResponse.json();
          console.log(`✅ Project has ${projectDetail.tasks?.length || 0} tasks`);
          console.log(`✅ Project has ${projectDetail.members?.length || 0} members`);
          
          // Test 4: Task Update API
          if (projectDetail.tasks && projectDetail.tasks.length > 0) {
            console.log('\n📍 Test 4: Task Update Functionality');
            const sampleTask = projectDetail.tasks[0];
            
            const taskUpdateData = {
              estimatedHours: 10,
              actualHours: 5,
              delayReason: 'Test delay reason',
              delayDays: 2,
              workloadPercentage: 75,
              isBottleneck: false
            };
            
            const taskUpdateResponse = await fetch(`${BASE_URL}/tasks/${sampleTask.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(taskUpdateData),
            });
            
            console.log(`Task Update: ${taskUpdateResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
            
            // Test 5: Project Reschedule API
            console.log('\n📍 Test 5: Project Reschedule Functionality');
            const rescheduleResponse = await fetch(`${BASE_URL}/projects/reschedule`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectId: sampleProject.id,
                strategy: 'auto'
              }),
            });
            
            console.log(`Project Reschedule: ${rescheduleResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
          } else {
            console.log('⚠️ No tasks found in project for testing task updates');
          }
        } else {
          console.log('❌ Failed to get detailed project data');
        }
      } else {
        console.log('⚠️ No projects found in database');
      }
    }
    
    // Test 6: Users API for calendar assignment
    console.log('\n📍 Test 6: Users API for Calendar');
    const usersResponse = await fetch(`${BASE_URL}/users`);
    console.log(`Users API: ${usersResponse.status === 200 ? '✅ Available' : '❌ Not accessible'}`);
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Found ${users.length} users available for task assignment`);
    }
    
    console.log('\n🎉 Enhanced Calendar System Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEnhancedCalendarSystem();
