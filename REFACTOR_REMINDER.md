# 🚨 PRODUCTION READINESS REFACTOR PLAN

## 🎯 MAIN ISSUES TO FIX

### 1. ❌ Enhanced Calendar Issues
- **Missing overload status** - Calendar doesn't show proper workload warnings
- **Workload per day not working** - Daily workload calculation is broken
- **Multiple projects workload not showing** - Need consolidated view across all projects

### 2. ❌ Doluluk (Workload) View Issues  
- **Günlük/Haftalık/Aylık buttons don't work** - View mode changes not reflected
- **Data not updating** between view modes
- **Calculations incorrect** for different time periods

### 3. ❌ Task Management Issues
- **Remove task linking/rescheduling** - Current dependency system is confusing
- **Implement task group logic** - Need simpler task tree structure
- **Add single task vs task tree options** - User-friendly task creation

### 4. ❌ Calendar Integration Issues
- **Single calendar for all task types** - Both individual and grouped tasks
- **Synchronization problems** - Views not staying in sync
- **Workload status bar missing** from main calendar

## 🔧 IMPLEMENTATION PLAN

### PHASE 1: Fix Workload Calculations
- [ ] Fix daily workload calculation in WorkloadViewer
- [ ] Implement proper weekly/monthly aggregation
- [ ] Fix view mode transitions (günlük/haftalık/aylık)
- [ ] Add workload status to main calendar

### PHASE 2: Simplify Task Management
- [ ] Remove complex dependency system
- [ ] Create simple task group model
- [ ] Add task tree creation UI
- [ ] Ensure both models work in same calendar

### PHASE 3: Enhanced Calendar Integration
- [ ] Add workload status bar to main calendar
- [ ] Fix overload status display
- [ ] Ensure multi-project workload tracking
- [ ] Sync all calendar views

### PHASE 4: Remove Old Logic
- [ ] Remove dependency manager
- [ ] Remove task linking features
- [ ] Remove reschedule complexity
- [ ] Clean up unused components

## 🎯 SUCCESS CRITERIA
- ✅ Responsive and user-friendly
- ✅ Zero errors and logic issues
- ✅ Product-ready quality
- ✅ All features working properly
- ✅ No duplication or confusion

## 🚀 NEXT STEPS
1. Start with WorkloadViewer fixes
2. Move to calendar integration
3. Implement new task group system
4. Remove old complexity
5. Test everything thoroughly

---
**Remember**: Remove old logic as we implement new features to avoid duplication!
