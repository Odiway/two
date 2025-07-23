#!/usr/bin/env node

/**
 * Comprehensive Testing and Debugging Script
 * Tests all components of the Enhanced Calendar System
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemTester {
  constructor() {
    this.results = {
      database: { status: 'pending', issues: [] },
      dependencies: { status: 'pending', issues: [] },
      compilation: { status: 'pending', issues: [] },
      components: { status: 'pending', issues: [] },
      apis: { status: 'pending', issues: [] }
    };
  }

  async runCommand(command, description) {
    console.log(`\n🔍 ${description}...`);
    return new Promise((resolve) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          resolve({ success: false, error: error.message, stdout, stderr });
        } else {
          console.log(`✅ Success`);
          if (stdout) console.log(`Output: ${stdout.substring(0, 200)}...`);
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  }

  async testDatabase() {
    console.log('\n📊 === DATABASE TESTING ===');
    
    // Check if database file exists
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      console.log('✅ Database file exists');
      this.results.database.status = 'success';
    } else {
      console.log('❌ Database file missing');
      this.results.database.issues.push('Database file not found');
    }

    // Test Prisma generate
    const generateResult = await this.runCommand('npx prisma generate', 'Generating Prisma client');
    if (!generateResult.success) {
      this.results.database.issues.push('Prisma client generation failed');
    }

    // Test database push
    const pushResult = await this.runCommand('npx prisma db push', 'Pushing database schema');
    if (!pushResult.success) {
      this.results.database.issues.push('Database schema push failed');
    }

    if (this.results.database.issues.length === 0) {
      this.results.database.status = 'success';
    } else {
      this.results.database.status = 'failed';
    }
  }

  async testDependencies() {
    console.log('\n📦 === DEPENDENCY TESTING ===');
    
    // Check package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      console.log('✅ package.json is valid');
      
      // Check critical dependencies
      const criticalDeps = ['@prisma/client', 'next', 'react', 'lucide-react'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies[dep]) {
          console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
          console.log(`❌ Missing dependency: ${dep}`);
          this.results.dependencies.issues.push(`Missing ${dep}`);
        }
      }
    } catch (error) {
      console.log('❌ Invalid package.json');
      this.results.dependencies.issues.push('Invalid package.json');
    }

    // Test npm install
    const installResult = await this.runCommand('npm install', 'Installing dependencies');
    if (!installResult.success) {
      this.results.dependencies.issues.push('npm install failed');
    }

    this.results.dependencies.status = this.results.dependencies.issues.length === 0 ? 'success' : 'failed';
  }

  async testCompilation() {
    console.log('\n🔨 === COMPILATION TESTING ===');
    
    // Test TypeScript compilation
    const buildResult = await this.runCommand('npm run build', 'Building application');
    if (buildResult.success) {
      console.log('✅ Application builds successfully');
      this.results.compilation.status = 'success';
    } else {
      console.log('❌ Build failed');
      this.results.compilation.issues.push('Build compilation failed');
      this.results.compilation.status = 'failed';
    }
  }

  async testComponents() {
    console.log('\n🧩 === COMPONENT TESTING ===');
    
    const criticalComponents = [
      'src/components/EnhancedCalendar.tsx',
      'src/components/Navbar.tsx',
      'src/app/projects/[id]/page.tsx',
      'src/lib/workload-analysis.ts',
      'src/lib/prisma.ts'
    ];

    for (const component of criticalComponents) {
      const componentPath = path.join(process.cwd(), component);
      if (fs.existsSync(componentPath)) {
        console.log(`✅ ${component} exists`);
        
        // Check for basic syntax issues
        try {
          const content = fs.readFileSync(componentPath, 'utf8');
          if (content.includes('export default') || content.includes('export {')) {
            console.log(`✅ ${component} has proper exports`);
          } else {
            console.log(`⚠️ ${component} may have export issues`);
            this.results.components.issues.push(`${component} export issues`);
          }
        } catch (error) {
          console.log(`❌ ${component} read error`);
          this.results.components.issues.push(`${component} read error`);
        }
      } else {
        console.log(`❌ ${component} missing`);
        this.results.components.issues.push(`${component} missing`);
      }
    }

    this.results.components.status = this.results.components.issues.length === 0 ? 'success' : 'failed';
  }

  async testAPIRoutes() {
    console.log('\n🌐 === API ROUTES TESTING ===');
    
    const apiRoutes = [
      'src/app/api/projects/route.ts',
      'src/app/api/tasks/route.ts',
      'src/app/api/users/route.ts',
      'src/app/api/projects/reschedule/route.ts'
    ];

    for (const route of apiRoutes) {
      const routePath = path.join(process.cwd(), route);
      if (fs.existsSync(routePath)) {
        console.log(`✅ ${route} exists`);
        
        // Check for proper HTTP methods
        try {
          const content = fs.readFileSync(routePath, 'utf8');
          const hasMethods = ['GET', 'POST', 'PUT', 'DELETE'].some(method => 
            content.includes(`export async function ${method}`)
          );
          
          if (hasMethods) {
            console.log(`✅ ${route} has HTTP methods`);
          } else {
            console.log(`⚠️ ${route} may not have proper HTTP methods`);
            this.results.apis.issues.push(`${route} method issues`);
          }
        } catch (error) {
          console.log(`❌ ${route} read error`);
          this.results.apis.issues.push(`${route} read error`);
        }
      } else {
        console.log(`❌ ${route} missing`);
        this.results.apis.issues.push(`${route} missing`);
      }
    }

    this.results.apis.status = this.results.apis.issues.length === 0 ? 'success' : 'failed';
  }

  generateReport() {
    console.log('\n📋 === TESTING REPORT ===');
    console.log('='.repeat(50));
    
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'failed' ? '❌' : '🔄';
      console.log(`${status} ${category.toUpperCase()}: ${result.status}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    });

    console.log('\n🎯 === NEXT STEPS ===');
    const failedCategories = Object.entries(this.results)
      .filter(([_, result]) => result.status === 'failed')
      .map(([category, _]) => category);

    if (failedCategories.length === 0) {
      console.log('🎉 All tests passed! You can start the development server.');
      console.log('Run: npm run dev');
    } else {
      console.log('🔧 Fix the following issues:');
      failedCategories.forEach(category => {
        console.log(`   1. Fix ${category} issues listed above`);
      });
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'TEST_REPORT.md');
    const reportContent = this.generateMarkdownReport();
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateMarkdownReport() {
    const timestamp = new Date().toISOString();
    let report = `# System Test Report\n\n**Generated:** ${timestamp}\n\n`;
    
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.status === 'success' ? '✅ PASSED' : 
                    result.status === 'failed' ? '❌ FAILED' : '🔄 PENDING';
      report += `## ${category.toUpperCase()}: ${status}\n\n`;
      
      if (result.issues.length > 0) {
        report += `### Issues Found:\n`;
        result.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
    });

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting Enhanced Calendar System Testing...\n');
    
    try {
      await this.testDependencies();
      await this.testDatabase();
      await this.testComponents();
      await this.testAPIRoutes();
      await this.testCompilation();
    } catch (error) {
      console.error('❌ Testing failed:', error);
    }
    
    this.generateReport();
  }
}

// Run the tests
const tester = new SystemTester();
tester.runAllTests().catch(console.error);
