# 🔧 Enhanced Calendar System - Debugging Guide

## 🚨 Quick Start Debugging

### 1. **Run System Test First**
```bash
npm run test-system
```
This will identify all major issues automatically.

### 2. **Quick Fix Common Issues**
```bash
npm run quick-fix
```
This fixes database, cache, and import issues.

### 3. **Safe Development Server**
```bash
npm run dev-safe
```
This checks prerequisites before starting the server.

## 🎯 Step-by-Step Debugging Process

### Phase 1: Basic System Check
1. **Check Environment**
   ```bash
   # Verify .env file exists
   cat .env
   
   # Check Node.js version
   node --version  # Should be 18+
   npm --version
   ```

2. **Database Setup**
   ```bash
   # Reset database completely
   npm run db:reset
   
   # Open database viewer
   npm run db:studio
   ```

3. **Dependencies**
   ```bash
   # Clean install if needed
   rm -rf node_modules package-lock.json
   npm install
   ```

### Phase 2: Component Testing
1. **Check Key Files Exist**
   ```
   ✅ src/components/EnhancedCalendar.tsx
   ✅ src/lib/workload-analysis.ts
   ✅ src/lib/prisma.ts
   ✅ src/app/projects/[id]/page.tsx
   ✅ prisma/schema.prisma
   ```

2. **Test Individual Components**
   ```bash
   # Try building without running
   npx next build --dry-run
   ```

### Phase 3: Enhanced Calendar Features
1. **Test API Endpoints**
   - Open: http://localhost:3000/api/projects
   - Open: http://localhost:3000/api/tasks
   - Open: http://localhost:3000/api/users

2. **Test Calendar Views**
   - Calendar view: Main calendar display
   - Workload view: Team capacity visualization
   - Bottleneck view: Resource constraints
   - Timeline view: Project dependencies

## 🚩 Common Issues & Solutions

### Issue 1: "Cannot find module '@/components/EnhancedCalendar'"
**Solution:**
```bash
# Check import path in page.tsx
# Should be: import { EnhancedCalendar } from '@/components/EnhancedCalendar'
# Or: import EnhancedCalendar from '@/components/EnhancedCalendar'
```

### Issue 2: "PrismaClientInitializationError"
**Solution:**
```bash
npm run quick-fix
# Or manually:
npx prisma generate
npx prisma db push
```

### Issue 3: "Module not found: Can't resolve '@/lib/prisma'"
**Solution:**
```bash
# Create missing prisma.ts file
npm run quick-fix
```

### Issue 4: Database Schema Issues
**Solution:**
```bash
# Complete database reset
npx prisma db push --force-reset
npm run db:seed
```

### Issue 5: TypeScript Errors
**Solution:**
```bash
# Clear TypeScript cache
rm tsconfig.tsbuildinfo
rm -rf .next
npm run build
```

### Issue 6: Import/Export Mismatches
**Check these common patterns:**

✅ **Correct:**
```typescript
// EnhancedCalendar.tsx
export default function EnhancedCalendar() { ... }

// page.tsx
import EnhancedCalendar from '@/components/EnhancedCalendar'
```

❌ **Incorrect:**
```typescript
// EnhancedCalendar.tsx
export function EnhancedCalendar() { ... }

// page.tsx
import EnhancedCalendar from '@/components/EnhancedCalendar'
```

## 🧪 Testing Checklist

### ✅ **System Level**
- [ ] Application starts without errors
- [ ] Database connection works
- [ ] All dependencies installed
- [ ] TypeScript compiles

### ✅ **Feature Level**
- [ ] Projects page loads
- [ ] Project detail page opens
- [ ] Enhanced calendar displays
- [ ] Tab navigation works
- [ ] Task creation/editing works

### ✅ **Enhanced Calendar**
- [ ] Calendar view shows tasks
- [ ] Workload view shows percentages
- [ ] Bottleneck view identifies issues
- [ ] Timeline view shows dependencies
- [ ] Task updates work
- [ ] Rescheduling functions

## 🔍 Debugging Commands Reference

```bash
# System diagnosis
npm run test-system

# Quick fixes
npm run quick-fix

# Safe development
npm run dev-safe

# Database operations
npm run db:reset
npm run db:studio

# Build testing
npm run build

# Manual debugging
npx prisma generate
npx prisma db push
npx next build --dry-run
```

## 🎯 Success Indicators

### ✅ **Application Running Successfully**
1. Development server starts without errors
2. Browser opens to http://localhost:3000
3. Main navigation works
4. Projects page loads with data
5. Enhanced calendar displays correctly

### ✅ **Enhanced Calendar Working**
1. All four view modes function
2. Tasks display in calendar
3. Workload percentages calculate
4. Bottlenecks are identified
5. Timeline shows dependencies
6. Task updates persist

## 📞 When to Seek Help

If after following this guide you still have issues:

1. **Copy the exact error message**
2. **Note which step failed**
3. **Share the output of `npm run test-system`**
4. **Include your environment details**:
   - OS version
   - Node.js version
   - Browser used

---

## 🚀 Ready to Test!

Start with:
```bash
npm run test-system
```

Then:
```bash
npm run dev-safe
```

The enhanced calendar system should now be working! 🎉
