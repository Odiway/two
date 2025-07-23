#!/usr/bin/env node

/**
 * Smart Development Server Starter
 * Checks for common issues before starting the dev server
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevServerManager {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check .env file
    if (!fs.existsSync('.env')) {
      console.log('❌ .env file missing!');
      this.createEnvFile();
    } else {
      console.log('✅ .env file exists');
    }

    // Check database
    const dbPath = path.join('prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️ Database not found, will create it...');
      await this.setupDatabase();
    } else {
      console.log('✅ Database exists');
    }

    // Check node_modules
    if (!fs.existsSync('node_modules')) {
      console.log('⚠️ Dependencies not installed, installing...');
      await this.installDependencies();
    } else {
      console.log('✅ Dependencies installed');
    }
  }

  createEnvFile() {
    const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:3000"
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file');
  }

  async runCommand(command, description) {
    console.log(`🔄 ${description}...`);
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ ${description} failed:`, error.message);
          resolve(false);
        } else {
          console.log(`✅ ${description} completed`);
          resolve(true);
        }
      });
    });
  }

  async installDependencies() {
    const success = await this.runCommand('npm install', 'Installing dependencies');
    if (!success) {
      console.log('❌ Failed to install dependencies. Please run "npm install" manually.');
      process.exit(1);
    }
  }

  async setupDatabase() {
    console.log('🗄️ Setting up database...');
    
    // Generate Prisma client
    await this.runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Push database schema
    await this.runCommand('npx prisma db push', 'Creating database schema');
    
    // Seed database with initial data
    if (fs.existsSync('prisma/seed.ts')) {
      await this.runCommand('npm run db:seed', 'Seeding database');
    }
  }

  startDevServer() {
    console.log('\n🚀 Starting development server...');
    console.log('📱 The app will be available at: http://localhost:3000');
    console.log('🔧 Enhanced Calendar features will be at: http://localhost:3000/projects');
    console.log('\n⚠️ If you see errors, check the console output below:\n');

    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: this.isWindows
    });

    devProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n❌ Development server exited with code ${code}`);
        console.log('🔧 Common solutions:');
        console.log('   1. Check for TypeScript errors');
        console.log('   2. Verify all imports are correct');
        console.log('   3. Run "npm run test-system" for detailed diagnosis');
      }
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      devProcess.kill();
      process.exit(0);
    });
  }

  async start() {
    console.log('🎯 Enhanced Calendar System - Development Server\n');
    
    try {
      await this.checkPrerequisites();
      console.log('\n✅ All prerequisites checked');
      
      // Quick build test (optional)
      console.log('\n🔍 Testing compilation...');
      const buildSuccess = await this.runCommand('npx next build --dry-run', 'Testing build');
      
      if (!buildSuccess) {
        console.log('\n⚠️ Build test failed, but starting dev server anyway...');
        console.log('   The dev server might help identify the issues.');
      }
      
      this.startDevServer();
      
    } catch (error) {
      console.error('❌ Failed to start:', error);
      console.log('\n🔧 Try running: npm run test-system');
    }
  }
}

// Create package.json script if it doesn't exist
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.scripts['test-system']) {
  packageJson.scripts['test-system'] = 'node test-system.js';
  packageJson.scripts['dev-safe'] = 'node start-dev.js';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Added test-system and dev-safe scripts to package.json');
}

// Start the development server
const manager = new DevServerManager();
manager.start().catch(console.error);
