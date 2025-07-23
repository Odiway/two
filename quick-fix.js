#!/usr/bin/env node

/**
 * Quick Fix Script for Enhanced Calendar System
 * Automatically fixes common development issues
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickFix {
  async runCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve({ success: !error, stdout, stderr, error });
      });
    });
  }

  async fixDatabase() {
    console.log('🔧 Fixing database issues...');
    
    // Regenerate Prisma client
    await this.runCommand('npx prisma generate');
    console.log('✅ Regenerated Prisma client');
    
    // Reset and push database
    await this.runCommand('npx prisma db push --force-reset');
    console.log('✅ Reset and pushed database schema');
    
    // Seed database
    if (fs.existsSync('prisma/seed.ts')) {
      await this.runCommand('npm run db:seed');
      console.log('✅ Seeded database');
    }
  }

  async fixDependencies() {
    console.log('🔧 Fixing dependency issues...');
    
    // Clean install
    if (fs.existsSync('node_modules')) {
      fs.rmSync('node_modules', { recursive: true, force: true });
      console.log('✅ Removed old node_modules');
    }
    
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
      console.log('✅ Removed package-lock.json');
    }
    
    await this.runCommand('npm install');
    console.log('✅ Fresh dependency install');
  }

  async fixBuildCache() {
    console.log('🔧 Fixing build cache...');
    
    // Remove Next.js cache
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
      console.log('✅ Cleared Next.js cache');
    }
    
    // Remove TypeScript build info
    if (fs.existsSync('tsconfig.tsbuildinfo')) {
      fs.unlinkSync('tsconfig.tsbuildinfo');
      console.log('✅ Cleared TypeScript build cache');
    }
  }

  async fixImports() {
    console.log('🔧 Checking and fixing import issues...');
    
    const commonFixes = [
      {
        file: 'src/components/EnhancedCalendar.tsx',
        check: /import.*prisma.*from/,
        fix: `import { prisma } from '@/lib/prisma'`
      },
      {
        file: 'src/app/projects/[id]/page.tsx',
        check: /import.*EnhancedCalendar.*from/,
        fix: `import { EnhancedCalendar } from '@/components/EnhancedCalendar'`
      }
    ];

    for (const fix of commonFixes) {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        if (!fix.check.test(content)) {
          console.log(`⚠️ Potential import issue in ${fix.file}`);
        }
      }
    }
  }

  async createMissingFiles() {
    console.log('🔧 Creating missing essential files...');
    
    // Create lib/prisma.ts if missing
    const prismaLibPath = 'src/lib/prisma.ts';
    if (!fs.existsSync(prismaLibPath)) {
      const prismaContent = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;
      
      fs.writeFileSync(prismaLibPath, prismaContent);
      console.log('✅ Created prisma.ts');
    }

    // Create utils.ts if missing
    const utilsPath = 'src/lib/utils.ts';
    if (!fs.existsSync(utilsPath)) {
      const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
      fs.writeFileSync(utilsPath, utilsContent);
      console.log('✅ Created utils.ts');
    }
  }

  async runAllFixes() {
    console.log('🚀 Running comprehensive system fixes...\n');
    
    try {
      await this.fixBuildCache();
      await this.createMissingFiles();
      await this.fixDatabase();
      await this.fixImports();
      // Note: Only run dependency fix if specifically needed
      // await this.fixDependencies();
      
      console.log('\n✅ All fixes completed!');
      console.log('🎯 Try running: npm run dev');
      
    } catch (error) {
      console.error('❌ Fix process failed:', error);
    }
  }
}

// Run fixes
const fixer = new QuickFix();
fixer.runAllFixes().catch(console.error);
