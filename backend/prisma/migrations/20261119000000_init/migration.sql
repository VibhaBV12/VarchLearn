-- VarchLearn Initial PostgreSQL Migration
-- Generated for Prisma ORM (2026-11-19)

CREATE TYPE "Modality" AS ENUM ('visual', 'auditory', 'read_write', 'kinesthetic');
CREATE TYPE "ActivityCategory" AS ENUM ('games_puzzles', 'question_sets');
CREATE TYPE "DifficultyLevel" AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE "ApprovalStatus" AS ENUM ('Approved', 'Pending_Review', 'Rejected', 'Archived');
CREATE TYPE "ScoringMethod" AS ENUM ('time_and_correctness', 'correctness_only');
CREATE TYPE "StudentStatus" AS ENUM ('Active', 'Inactive');
CREATE TYPE "AssessmentStatus" AS ENUM ('Draft', 'Published');
CREATE TYPE "DailyNodeStatus" AS ENUM ('completed', 'current', 'available', 'locked');
CREATE TYPE "AttemptStatus" AS ENUM ('not_started', 'in_progress', 'paused', 'completed');

CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL DEFAULT 'Academic Learning Coordinator (Admin)',
    "institution" TEXT NOT NULL DEFAULT 'VarchLearn Primary Academy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

CREATE TABLE "ClassGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "gradeLevel" INTEGER NOT NULL,
    "subjects" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClassGroup_name_key" ON "ClassGroup"("name");

CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "recoveryPinHash" TEXT NOT NULL,
    "avatarMascot" TEXT NOT NULL DEFAULT 'vee',
    "status" "StudentStatus" NOT NULL DEFAULT 'Active',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stars" INTEGER NOT NULL DEFAULT 20,
    "completedActivitiesCount" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT[],
    "adaptedDifficulty" JSONB NOT NULL DEFAULT '{"visual":"Easy","auditory":"Easy","read_write":"Easy","kinesthetic":"Easy"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

CREATE TABLE "Textbook" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "extractedRawText" TEXT,
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Chapter_textbookId_idx" ON "Chapter"("textbookId");

CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtopics" TEXT[],
    "extractedConcepts" TEXT[],
    "extractedDiagrams" TEXT[],
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Topic_chapterId_idx" ON "Topic"("chapterId");

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "gameType" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "originalDifficulty" "DifficultyLevel" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "targetAbility" TEXT NOT NULL,
    "scoringMethod" "ScoringMethod" NOT NULL DEFAULT 'correctness_only',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'Pending_Review',
    "textbookId" TEXT,
    "textbookSource" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generationSource" TEXT NOT NULL DEFAULT 'manual',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "starReward" INTEGER NOT NULL DEFAULT 12,
    "customization" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Activity_modality_approvalStatus_idx" ON "Activity"("modality", "approvalStatus");
CREATE INDEX "Activity_className_subject_idx" ON "Activity"("className", "subject");

CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'academic',
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "hint" TEXT,
    "explanation" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Question_activityId_idx" ON "Question"("activityId");

CREATE TABLE "DailyAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "assignedDate" TEXT NOT NULL,
    "isCarriedForward" BOOLEAN NOT NULL DEFAULT false,
    "status" "DailyNodeStatus" NOT NULL DEFAULT 'available',
    "orderIndex" INTEGER NOT NULL,
    "earnedStars" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DailyAssignment_studentId_activityId_assignedDate_key" ON "DailyAssignment"("studentId", "activityId", "assignedDate");
CREATE INDEX "DailyAssignment_studentId_status_idx" ON "DailyAssignment"("studentId", "status");

CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'Draft',
    "allowRetake" BOOLEAN NOT NULL DEFAULT true,
    "retakeCondition" TEXT NOT NULL DEFAULT 'Permitted once per term upon Admin review',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentClass" (
    "assessmentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    CONSTRAINT "AssessmentClass_pkey" PRIMARY KEY ("assessmentId","classId")
);

CREATE TABLE "AssessmentActivity" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "scoringMethod" "ScoringMethod" NOT NULL DEFAULT 'correctness_only',
    CONSTRAINT "AssessmentActivity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssessmentActivity_assessmentId_activityId_key" ON "AssessmentActivity"("assessmentId", "activityId");
CREATE INDEX "AssessmentActivity_assessmentId_idx" ON "AssessmentActivity"("assessmentId");

CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'not_started',
    "currentActivityIndex" INTEGER NOT NULL DEFAULT 0,
    "completedActivityIds" TEXT[],
    "activityResults" JSONB NOT NULL DEFAULT '{}',
    "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "scoringMethodUsed" "ScoringMethod" NOT NULL DEFAULT 'correctness_only',
    "startedAt" TIMESTAMP(3),
    "lastSavedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssessmentAttempt_assessmentId_studentId_key" ON "AssessmentAttempt"("assessmentId", "studentId");
CREATE INDEX "AssessmentAttempt_studentId_idx" ON "AssessmentAttempt"("studentId");

CREATE TABLE "LearningPreferenceSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentAttemptId" TEXT NOT NULL,
    "assessmentName" TEXT NOT NULL,
    "visual" INTEGER NOT NULL,
    "auditory" INTEGER NOT NULL,
    "readWrite" INTEGER NOT NULL,
    "kinesthetic" INTEGER NOT NULL,
    "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "scoringMethodUsed" "ScoringMethod" NOT NULL DEFAULT 'correctness_only',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningPreferenceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LearningPreferenceSnapshot_assessmentAttemptId_key" ON "LearningPreferenceSnapshot"("assessmentAttemptId");
CREATE INDEX "LearningPreferenceSnapshot_studentId_recordedAt_idx" ON "LearningPreferenceSnapshot"("studentId", "recordedAt");

CREATE TABLE "DifficultyAdjustment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "fromDifficulty" "DifficultyLevel" NOT NULL,
    "toDifficulty" "DifficultyLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DifficultyAdjustment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DifficultyAdjustment_studentId_idx" ON "DifficultyAdjustment"("studentId");

CREATE TABLE "RewardEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starsAwarded" INTEGER NOT NULL DEFAULT 0,
    "badgeAwarded" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'daily_activity',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RewardEvent_studentId_idx" ON "RewardEvent"("studentId");

CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- Foreign Keys
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Textbook" ADD CONSTRAINT "Textbook_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentClass" ADD CONSTRAINT "AssessmentClass_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentClass" ADD CONSTRAINT "AssessmentClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentActivity" ADD CONSTRAINT "AssessmentActivity_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentActivity" ADD CONSTRAINT "AssessmentActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPreferenceSnapshot" ADD CONSTRAINT "LearningPreferenceSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPreferenceSnapshot" ADD CONSTRAINT "LearningPreferenceSnapshot_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DifficultyAdjustment" ADD CONSTRAINT "DifficultyAdjustment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
