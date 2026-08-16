/*
  Warnings:

  - You are about to drop the column `engagementRate` on the `AnalyticsSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `isSimulated` on the `AnalyticsSnapshot` table. All the data in the column will be lost.
  - Added the required column `comments` to the `AnalyticsSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `likes` to the `AnalyticsSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TopComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopComment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnalyticsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsSnapshot_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AnalyticsSnapshot" ("contentId", "id", "recordedAt", "views") SELECT "contentId", "id", "recordedAt", "views" FROM "AnalyticsSnapshot";
DROP TABLE "AnalyticsSnapshot";
ALTER TABLE "new_AnalyticsSnapshot" RENAME TO "AnalyticsSnapshot";
CREATE TABLE "new_Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "niche" TEXT NOT NULL,
    "topicTitle" TEXT NOT NULL,
    "topicSource" TEXT NOT NULL,
    "topicScore" REAL,
    "title" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "visualKeywords" TEXT,
    "platform" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "renderStatus" TEXT NOT NULL DEFAULT 'not_started',
    "renderError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "youtubeVideoId" TEXT,
    "youtubeVideoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Content" ("createdAt", "description", "hashtags", "id", "niche", "platform", "publishedAt", "scheduledAt", "script", "status", "title", "topicScore", "topicSource", "topicTitle", "updatedAt") SELECT "createdAt", "description", "hashtags", "id", "niche", "platform", "publishedAt", "scheduledAt", "script", "status", "title", "topicScore", "topicSource", "topicTitle", "updatedAt" FROM "Content";
DROP TABLE "Content";
ALTER TABLE "new_Content" RENAME TO "Content";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
