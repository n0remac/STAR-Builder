-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "contactEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Profile" ADD COLUMN "metaNarrativeJson" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Profile" ADD COLUMN "metaNarrativeGeneratedAt" DATETIME;
