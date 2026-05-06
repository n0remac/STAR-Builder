-- CreateTable
CREATE TABLE "TargetJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "Narrative" ADD COLUMN "targetJobId" TEXT REFERENCES "TargetJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TargetJob_userId_idx" ON "TargetJob"("userId");

-- CreateIndex
CREATE INDEX "TargetJob_company_idx" ON "TargetJob"("company");

-- CreateIndex
CREATE INDEX "TargetJob_title_idx" ON "TargetJob"("title");

-- CreateIndex
CREATE INDEX "Narrative_targetJobId_idx" ON "Narrative"("targetJobId");
