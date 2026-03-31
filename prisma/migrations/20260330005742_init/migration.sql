-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameChangedAt" DATETIME,
    "socialCode6" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "equippedTitle" TEXT,
    "equippedFrame" TEXT,
    "ownedInventory" TEXT NOT NULL DEFAULT '[]',
    "soloStreak" INTEGER NOT NULL DEFAULT 0,
    "soloStreakBest" INTEGER NOT NULL DEFAULT 0,
    "lastSoloMissionDay" TEXT,
    "groupStreak" INTEGER NOT NULL DEFAULT 0,
    "groupStreakBest" INTEGER NOT NULL DEFAULT 0,
    "lastGroupMissionDay" TEXT,
    "victoryBadges" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "baseXp" INTEGER NOT NULL,
    "minParticipants" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "contextNote" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgentDeadlineAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "memoryPhotoDataUrl" TEXT,
    "participantIds" TEXT NOT NULL DEFAULT '[]',
    "reactionEmoji" TEXT,
    "competitiveDuelId" TEXT,
    CONSTRAINT "Mission_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mission_competitiveDuelId_fkey" FOREIGN KEY ("competitiveDuelId") REFERENCES "Duel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissionCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xpReceived" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasSolo" BOOLEAN NOT NULL,
    "wasUrgent" BOOLEAN NOT NULL,
    "wasExplosive" BOOLEAN NOT NULL,
    CONSTRAINT "MissionCompletion_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "durationDays" INTEGER NOT NULL,
    "startedAt" DATETIME,
    "endsAt" DATETIME,
    "teamAUserIds" TEXT NOT NULL,
    "teamBUserIds" TEXT NOT NULL,
    "winnerTeam" INTEGER,
    "teamAXp" INTEGER NOT NULL DEFAULT 0,
    "teamBXp" INTEGER NOT NULL DEFAULT 0,
    "invitedCode6" TEXT,
    CONSTRAINT "Duel_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "costXp" INTEGER NOT NULL,
    "rotationSlot" INTEGER NOT NULL,
    "seasonTag" TEXT,
    "unlockHint" TEXT
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "boughtAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_socialCode6_key" ON "User"("socialCode6");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "MissionCompletion_userId_completedAt_idx" ON "MissionCompletion"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_itemId_key" ON "UserPurchase"("userId", "itemId");
