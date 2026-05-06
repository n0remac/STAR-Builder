-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "links" TEXT NOT NULL DEFAULT '',
    "resumePath" TEXT NOT NULL DEFAULT '/resume.pdf',
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "Position" ADD COLUMN "profileVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Position" ADD COLUMN "profileOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Position" ADD COLUMN "profileSummary" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Narrative" ADD COLUMN "profileVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Narrative" ADD COLUMN "profileOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");
