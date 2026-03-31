-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO "new_Mission" ("baseXp", "competitiveDuelId", "completedAt", "contextNote", "creatorUserId", "description", "difficulty", "expiresAt", "id", "kind", "maxParticipants", "memoryPhotoDataUrl", "minParticipants", "participantIds", "reactionEmoji", "title", "urgentDeadlineAt") SELECT "baseXp", "competitiveDuelId", "completedAt", "contextNote", "creatorUserId", "description", "difficulty", "expiresAt", "id", "kind", "maxParticipants", "memoryPhotoDataUrl", "minParticipants", "participantIds", "reactionEmoji", "title", "urgentDeadlineAt" FROM "Mission";
DROP TABLE "Mission";
ALTER TABLE "new_Mission" RENAME TO "Mission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
