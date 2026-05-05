-- CreateTable
CREATE TABLE "Narrative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "positionId" TEXT,
    "scope" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "positioning" TEXT NOT NULL DEFAULT '',
    "fullNarrative" TEXT NOT NULL DEFAULT '',
    "shortVersion" TEXT NOT NULL DEFAULT '',
    "interviewGuidance" TEXT NOT NULL DEFAULT '',
    "feedback" TEXT NOT NULL DEFAULT '',
    "score" INTEGER,
    "scoreRationale" TEXT NOT NULL DEFAULT '',
    "scoredAt" DATETIME,
    "scoreIsStale" BOOLEAN NOT NULL DEFAULT false,
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Narrative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Narrative_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NarrativeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "narrativeId" TEXT NOT NULL,
    "starResponseId" TEXT NOT NULL,
    "roleInNarrative" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "NarrativeSource_narrativeId_fkey" FOREIGN KEY ("narrativeId") REFERENCES "Narrative" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NarrativeSource_starResponseId_fkey" FOREIGN KEY ("starResponseId") REFERENCES "StarResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Narrative_userId_idx" ON "Narrative"("userId");

-- CreateIndex
CREATE INDEX "Narrative_positionId_idx" ON "Narrative"("positionId");

-- CreateIndex
CREATE INDEX "Narrative_scope_idx" ON "Narrative"("scope");

-- CreateIndex
CREATE INDEX "Narrative_theme_idx" ON "Narrative"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "NarrativeSource_narrativeId_starResponseId_key" ON "NarrativeSource"("narrativeId", "starResponseId");

-- CreateIndex
CREATE INDEX "NarrativeSource_narrativeId_idx" ON "NarrativeSource"("narrativeId");

-- CreateIndex
CREATE INDEX "NarrativeSource_starResponseId_idx" ON "NarrativeSource"("starResponseId");
