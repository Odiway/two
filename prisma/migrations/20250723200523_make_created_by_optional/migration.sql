-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "projectId" TEXT NOT NULL,
    "assignedId" TEXT,
    "createdById" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workflowStepId" TEXT,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "delayReason" TEXT,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "workloadPercentage" INTEGER NOT NULL DEFAULT 0,
    "isBottleneck" BOOLEAN NOT NULL DEFAULT false,
    "originalEndDate" DATETIME,
    "taskType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "parentTaskId" TEXT,
    "groupOrder" INTEGER NOT NULL DEFAULT 0,
    "isGroupParent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedId_fkey" FOREIGN KEY ("assignedId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("actualHours", "assignedId", "completedAt", "createdAt", "createdById", "delayDays", "delayReason", "description", "endDate", "estimatedHours", "id", "isBottleneck", "originalEndDate", "priority", "projectId", "startDate", "status", "title", "updatedAt", "workflowStepId", "workloadPercentage") SELECT "actualHours", "assignedId", "completedAt", "createdAt", "createdById", "delayDays", "delayReason", "description", "endDate", "estimatedHours", "id", "isBottleneck", "originalEndDate", "priority", "projectId", "startDate", "status", "title", "updatedAt", "workflowStepId", "workloadPercentage" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
