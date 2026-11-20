import { PrismaClient, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_ACTIVITY_BANK,
  SEED_ASSESSMENTS,
  SEED_TEXTBOOKS,
  SEED_AARAV_DAILY_PATH,
  SEED_ADMIN_SETTINGS,
} from '../../shared/mock-data/seedData';

const prisma = new PrismaClient();

function mapApprovalStatus(status: string): ApprovalStatus {
  if (status === 'Pending Review') return 'Pending_Review';
  return status as ApprovalStatus;
}

async function main() {
  console.log('Seeding VarchLearn PostgreSQL database...');

  // 1. Seed Default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: SEED_ADMIN_SETTINGS.adminProfile.email },
    update: {},
    create: {
      name: SEED_ADMIN_SETTINGS.adminProfile.name,
      email: SEED_ADMIN_SETTINGS.adminProfile.email,
      passwordHash: adminPasswordHash,
      roleTitle: SEED_ADMIN_SETTINGS.adminProfile.roleTitle,
      institution: SEED_ADMIN_SETTINGS.adminProfile.institution,
    },
  });

  // 2. Seed App Settings
  await prisma.appSettings.upsert({
    where: { key: 'admin_settings' },
    update: {},
    create: {
      key: 'admin_settings',
      value: SEED_ADMIN_SETTINGS as any,
    },
  });

  // 3. Seed Classes
  for (const cls of SEED_CLASSES) {
    await prisma.classGroup.upsert({
      where: { id: cls.id },
      update: {},
      create: {
        id: cls.id,
        name: cls.name,
        section: cls.section,
        gradeLevel: cls.gradeLevel,
        subjects: cls.subjects,
      },
    });
  }

  // 4. Seed Textbooks, Chapters & Topics
  for (const tb of SEED_TEXTBOOKS) {
    await prisma.textbook.upsert({
      where: { id: tb.id },
      update: {},
      create: {
        id: tb.id,
        fileName: tb.fileName,
        originalName: tb.fileName,
        filePath: `uploads/${tb.fileName}`,
        fileSizeBytes: 1024 * 450,
        className: tb.className,
        subject: tb.subject,
        pageCount: tb.pageCount,
        uploadedByAdminId: admin.id,
        chapters: {
          create: tb.chapters.map((ch) => ({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            topics: {
              create: ch.topics.map((t) => ({
                id: t.id,
                title: t.title,
                subtopics: t.subtopics,
                extractedConcepts: t.extractedConcepts,
                extractedDiagrams: t.extractedDiagrams,
              })),
            },
          })),
        },
      },
    });
  }

  // 5. Seed Activity Bank (24+ activities + questions)
  for (const act of SEED_ACTIVITY_BANK) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {},
      create: {
        id: act.id,
        name: act.name,
        modality: act.modality,
        category: act.category,
        gameType: act.gameType,
        className: act.className,
        subject: act.subject,
        chapter: act.chapter,
        topic: act.topic,
        subtopic: act.subtopic,
        originalDifficulty: act.originalDifficulty,
        difficulty: act.difficulty,
        targetAbility: act.targetAbility,
        scoringMethod: act.scoringMethod,
        approvalStatus: mapApprovalStatus(act.approvalStatus),
        textbookSource: act.textbookSource,
        aiGenerated: act.aiGenerated,
        generationSource: act.aiGenerated ? 'development_fallback' : 'manual',
        estimatedMinutes: act.estimatedMinutes,
        starReward: act.starReward,
        customization: act.customization as any,
        questions: act.questions
          ? {
              create: act.questions.map((q, idx) => ({
                type: q.type,
                prompt: q.prompt,
                options: q.options,
                correctIndex: q.correctIndex,
                hint: q.hint,
                explanation: q.explanation,
                orderIndex: idx,
              })),
            }
          : undefined,
      },
    });
  }

  // 6. Seed Assessments
  for (const asmt of SEED_ASSESSMENTS) {
    await prisma.assessment.upsert({
      where: { id: asmt.id },
      update: {},
      create: {
        id: asmt.id,
        name: asmt.name,
        description: asmt.description,
        status: asmt.status,
        allowRetake: asmt.allowRetake,
        retakeCondition: asmt.retakeCondition,
        publishedAt: asmt.publishedAt ? new Date(asmt.publishedAt) : null,
        classes: {
          create: asmt.targetClassIds.map((classId) => ({ classId })),
        },
        activities: {
          create: asmt.activities.map((cfg) => ({
            activityId: cfg.activityId,
            orderIndex: cfg.order,
            scoringMethod: cfg.scoringMethod,
          })),
        },
      },
    });
  }

  // 7. Seed Students (preserving demo student aarav5 / learn123 / PIN 1234)
  for (const stu of SEED_STUDENTS) {
    const pwHash = await bcrypt.hash(stu.passwordHash, 10);
    const pinHash = await bcrypt.hash(stu.recoveryPin, 10);

    await prisma.student.upsert({
      where: { id: stu.id },
      update: {},
      create: {
        id: stu.id,
        name: stu.name,
        username: stu.username,
        classId: stu.classId,
        passwordHash: pwHash,
        recoveryPinHash: pinHash,
        avatarMascot: stu.avatarMascot,
        status: stu.status,
        stars: stu.stars,
        completedActivitiesCount: stu.completedActivitiesCount,
        badges: stu.badges,
        adaptedDifficulty: stu.currentAdaptedDifficulty as any,
      },
    });

    // Seed historical assessment snapshots
    for (const hist of stu.assessmentHistory) {
      const asmtExists = await prisma.assessment.findUnique({ where: { id: hist.assessmentId } });
      if (!asmtExists) {
        await prisma.assessment.create({
          data: {
            id: hist.assessmentId,
            name: hist.assessmentName,
            description: 'Historical baseline assessment',
            status: 'Published',
            publishedAt: new Date(hist.completedAt),
          },
        });
      }

      const attempt = await prisma.assessmentAttempt.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: hist.assessmentId,
            studentId: stu.id,
          },
        },
        update: {},
        create: {
          assessmentId: hist.assessmentId,
          studentId: stu.id,
          status: 'completed',
          totalTimeSeconds: hist.totalTimeSeconds,
          scoringMethodUsed: hist.scoringMethodUsed,
          completedAt: new Date(hist.completedAt),
        },
      });

      await prisma.learningPreferenceSnapshot.upsert({
        where: { assessmentAttemptId: attempt.id },
        update: {},
        create: {
          studentId: stu.id,
          assessmentAttemptId: attempt.id,
          assessmentName: hist.assessmentName,
          visual: hist.scores.visual,
          auditory: hist.scores.auditory,
          readWrite: hist.scores.read_write,
          kinesthetic: hist.scores.kinesthetic,
          totalTimeSeconds: hist.totalTimeSeconds,
          scoringMethodUsed: hist.scoringMethodUsed,
          recordedAt: new Date(hist.completedAt),
        },
      });
    }

    for (const dh of stu.difficultyHistory) {
      await prisma.difficultyAdjustment.create({
        data: {
          studentId: stu.id,
          modality: dh.modality,
          fromDifficulty: dh.fromDifficulty,
          toDifficulty: dh.toDifficulty,
          reason: dh.reason,
          adjustedAt: new Date(dh.date),
        },
      });
    }
  }

  // 8. Seed Aarav's Daily Adventure Path (including carried-forward items)
  for (const node of SEED_AARAV_DAILY_PATH) {
    await prisma.dailyAssignment.upsert({
      where: {
        studentId_activityId_assignedDate: {
          studentId: 'stu-aarav',
          activityId: node.activityId,
          assignedDate: node.assignedDate,
        },
      },
      update: {},
      create: {
        studentId: 'stu-aarav',
        activityId: node.activityId,
        assignedDate: node.assignedDate,
        isCarriedForward: node.isCarriedForward,
        status: node.status,
        orderIndex: node.orderIndex,
        earnedStars: node.earnedStars ?? null,
        completedAt: node.completedAt ? new Date(node.completedAt) : null,
      },
    });
  }

  console.log('VarchLearn seed complete! Demo Admin: ananya.rao@varchlearn.edu / admin123 | Demo Student: aarav5 / learn123 (PIN: 1234)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
