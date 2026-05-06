-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "links" TEXT NOT NULL DEFAULT '',
    "resumePath" TEXT NOT NULL DEFAULT '/resume.pdf',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "publicResumeVisible" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL DEFAULT '',
    "metaNarrativeJson" TEXT NOT NULL DEFAULT '',
    "metaNarrativeGeneratedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("contactEmail", "createdAt", "displayName", "headline", "id", "links", "location", "metaNarrativeGeneratedAt", "metaNarrativeJson", "resumePath", "summary", "updatedAt", "userId") SELECT "contactEmail", "createdAt", "displayName", "headline", "id", "links", "location", "metaNarrativeGeneratedAt", "metaNarrativeJson", "resumePath", "summary", "updatedAt", "userId" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_publicSlug_key" ON "Profile"("publicSlug");
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");
CREATE TABLE "new_StarResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'achievement',
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL DEFAULT '',
    "task" TEXT NOT NULL DEFAULT '',
    "actions" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "situationFeedback" TEXT NOT NULL DEFAULT '',
    "taskFeedback" TEXT NOT NULL DEFAULT '',
    "actionsFeedback" TEXT NOT NULL DEFAULT '',
    "resultFeedback" TEXT NOT NULL DEFAULT '',
    "score" INTEGER,
    "scoreRationale" TEXT NOT NULL DEFAULT '',
    "scoredAt" DATETIME,
    "scoreIsStale" BOOLEAN NOT NULL DEFAULT false,
    "scoreDraftHash" TEXT,
    "profileVisible" BOOLEAN NOT NULL DEFAULT false,
    "profileOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StarResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StarResponse_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StarResponse" ("actions", "actionsFeedback", "category", "createdAt", "id", "positionId", "result", "resultFeedback", "score", "scoreDraftHash", "scoreIsStale", "scoreRationale", "scoredAt", "situation", "situationFeedback", "task", "taskFeedback", "title", "updatedAt", "userId") SELECT "actions", "actionsFeedback", "category", "createdAt", "id", "positionId", "result", "resultFeedback", "score", "scoreDraftHash", "scoreIsStale", "scoreRationale", "scoredAt", "situation", "situationFeedback", "task", "taskFeedback", "title", "updatedAt", "userId" FROM "StarResponse";
DROP TABLE "StarResponse";
ALTER TABLE "new_StarResponse" RENAME TO "StarResponse";
CREATE INDEX "StarResponse_userId_idx" ON "StarResponse"("userId");
CREATE INDEX "StarResponse_positionId_idx" ON "StarResponse"("positionId");
CREATE INDEX "StarResponse_category_idx" ON "StarResponse"("category");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "updatedAt") SELECT "createdAt", "email", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
