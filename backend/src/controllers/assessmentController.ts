import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { createAssessmentSchema } from '../validators/schemas';
import { mapDbAssessment } from '../utils/mappers';
import { getRequiredParam } from '../utils/params';
import {
  ASSESSMENT_MODALITY_ORDER,
  computeAssessmentModalityScores,
  sortActivitiesByVarkOrder,
} from '../utils/assessmentScoring';

export const assessmentController = {
  async listAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user?.role === 'student';
      const where: any = {};
      if (isStudent) {
        where.status = 'Published';
        if (req.user?.classId) {
          where.classes = { some: { classId: req.user.classId } };
        }
      }

      const rows = await prisma.assessment.findMany({
        where,
        include: {
          classes: { include: { classGroup: true } },
          activities: { include: { activity: { include: { questions: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const mapped = rows.map((row) => {
        const dto = mapDbAssessment(row);
        dto.activities = sortActivitiesByVarkOrder(dto.activities).map((cfg, idx) => ({
          ...cfg,
          order: idx + 1,
        }));
        return dto;
      });

      res.json({ success: true, assessments: mapped });
    } catch (err) {
      next(err);
    }
  },

  async getInitialAssessmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const classId = req.user!.classId;

      const assessmentRow = await prisma.assessment.findFirst({
        where: {
          status: 'Published',
          ...(classId ? { classes: { some: { classId } } } : {}),
        },
        include: {
          classes: { include: { classGroup: true } },
          activities: { include: { activity: { include: { questions: true } } } },
        },
        orderBy: { publishedAt: 'desc' },
      });

      if (!assessmentRow) {
        return res.json({
          success: true,
          status: 'completed', // No published assessment blocks student home
          assessment: null,
          progress: null,
          latestResult: null,
        });
      }

      const assessment = mapDbAssessment(assessmentRow);
      assessment.activities = sortActivitiesByVarkOrder(assessment.activities).map((cfg, idx) => ({
        ...cfg,
        order: idx + 1,
      }));

      // Check if student already completed ANY attempt for this assessment (or already has a completed initial assessment)
      const attempt = await prisma.assessmentAttempt.findUnique({
        where: {
          assessmentId_studentId: { assessmentId: assessment.id, studentId },
        },
        include: { preferenceSnapshot: true },
      });

      if (attempt?.status === 'completed') {
        const snap = attempt.preferenceSnapshot;
        return res.json({
          success: true,
          status: 'completed',
          assessment,
          progress: {
            assessmentId: attempt.assessmentId,
            studentId: attempt.studentId,
            status: 'completed',
            currentActivityIndex: attempt.currentActivityIndex,
            completedActivityIds: attempt.completedActivityIds,
            activityResults: attempt.activityResults,
            completedAt: attempt.completedAt?.toISOString(),
          },
          latestResult: snap
            ? {
                id: snap.id,
                assessmentId: assessment.id,
                assessmentName: snap.assessmentName,
                studentId,
                completedAt: snap.recordedAt.toISOString().slice(0, 10),
                scores: {
                  kinesthetic: snap.kinesthetic,
                  auditory: snap.auditory,
                  visual: snap.visual,
                  read_write: snap.readWrite,
                },
                totalTimeSeconds: snap.totalTimeSeconds,
                scoringMethodUsed: snap.scoringMethodUsed,
              }
            : null,
        });
      }

      if (attempt && (attempt.status === 'in_progress' || attempt.status === 'paused')) {
        return res.json({
          success: true,
          status: 'in_progress',
          assessment,
          progress: {
            assessmentId: attempt.assessmentId,
            studentId: attempt.studentId,
            status: attempt.status,
            currentActivityIndex: attempt.currentActivityIndex,
            completedActivityIds: attempt.completedActivityIds,
            activityResults: attempt.activityResults,
            startedAt: attempt.startedAt?.toISOString(),
            lastSavedAt: attempt.lastSavedAt?.toISOString(),
          },
          latestResult: null,
        });
      }

      res.json({
        success: true,
        status: 'not_started',
        assessment,
        progress: {
          assessmentId: assessment.id,
          studentId,
          status: 'not_started',
          currentActivityIndex: 0,
          completedActivityIds: [],
          activityResults: {},
        },
        latestResult: null,
      });
    } catch (err) {
      next(err);
    }
  },

  async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAssessmentSchema.parse(req.body);
      const activityIds = body.activities.map((a) => a.activityId);
      const dbActivities = await prisma.activity.findMany({
        where: { id: { in: activityIds }, approvalStatus: 'Approved' },
      });

      if (dbActivities.length !== activityIds.length) {
        throw new AppError('All assessment activities must be Approved items from Activity Bank.', 400);
      }

      const modalities = new Set(dbActivities.map((a) => a.modality));
      if (modalities.size < 4) {
        throw new AppError('Assessment must include at least one activity from all 4 VARK modalities.', 400);
      }

      const created = await prisma.assessment.create({
        data: {
          name: body.name,
          description: body.description,
          status: body.status,
          allowRetake: false, // Initial VARK assessment is one-time per student
          retakeCondition: 'Completed once per student',
          publishedAt: body.status === 'Published' ? new Date() : null,
          classes: {
            create: body.targetClassIds.map((classId) => ({ classId })),
          },
          activities: {
            create: body.activities.map((cfg) => ({
              activityId: cfg.activityId,
              orderIndex: cfg.order,
              scoringMethod: cfg.scoringMethod,
            })),
          },
        },
        include: {
          classes: { include: { classGroup: true } },
          activities: { include: { activity: { include: { questions: true } } } },
        },
      });

      res.status(201).json({ success: true, assessment: mapDbAssessment(created) });
    } catch (err) {
      next(err);
    }
  },

  async publishAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.assessment.update({
        where: { id: getRequiredParam(req.params.id, 'id') },
        data: { status: 'Published', publishedAt: new Date() },
        include: {
          classes: { include: { classGroup: true } },
          activities: { include: { activity: { include: { questions: true } } } },
        },
      });
      res.json({ success: true, assessment: mapDbAssessment(updated) });
    } catch (err) {
      next(err);
    }
  },

  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = getRequiredParam(req.params.id, 'id');
      const studentId = req.user!.userId;

      const existing = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId, studentId } },
      });

      if (!existing) {
        return res.json({
          success: true,
          progress: {
            assessmentId,
            studentId,
            status: 'not_started',
            currentActivityIndex: 0,
            completedActivityIds: [],
            activityResults: {},
          },
        });
      }

      res.json({
        success: true,
        progress: {
          assessmentId: existing.assessmentId,
          studentId: existing.studentId,
          status: existing.status,
          currentActivityIndex: existing.currentActivityIndex,
          completedActivityIds: existing.completedActivityIds,
          activityResults: existing.activityResults,
          startedAt: existing.startedAt?.toISOString(),
          lastSavedAt: existing.lastSavedAt?.toISOString(),
          completedAt: existing.completedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async saveAttemptProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = getRequiredParam(req.params.id, 'id');
      const studentId = req.user!.userId;
      const { status, currentActivityIndex, completedActivityIds, activityResults } = req.body;

      // Enforce one-time completion: prevent modifying or restarting a completed attempt
      const existing = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId, studentId } },
      });
      if (existing?.status === 'completed') {
        throw new AppError('This assessment has already been completed. Retakes are not permitted.', 409);
      }

      // Prevent client from marking completed via PUT; must go through POST /submit
      const safeStatus = status === 'paused' ? 'paused' : 'in_progress';
      const dedupCompleted = Array.from(new Set((completedActivityIds as string[]) || []));

      const saved = await prisma.assessmentAttempt.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId } },
        update: {
          status: safeStatus,
          currentActivityIndex: Number(currentActivityIndex ?? 0),
          completedActivityIds: dedupCompleted,
          activityResults: activityResults || {},
          lastSavedAt: new Date(),
        },
        create: {
          assessmentId,
          studentId,
          status: safeStatus,
          currentActivityIndex: Number(currentActivityIndex ?? 0),
          completedActivityIds: dedupCompleted,
          activityResults: activityResults || {},
          startedAt: new Date(),
          lastSavedAt: new Date(),
        },
      });

      res.json({ success: true, progress: saved });
    } catch (err) {
      next(err);
    }
  },

  async submitAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = getRequiredParam(req.params.id, 'id');
      const studentId = req.user!.userId;

      const existingAttempt = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId, studentId } },
      });

      // Strict retake & duplicate submission lock
      if (existingAttempt?.status === 'completed') {
        throw new AppError('Assessment already completed. Retakes and duplicate submissions are not allowed.', 409);
      }

      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { activities: { include: { activity: { include: { questions: true } } } } },
      });
      if (!assessment) throw new AppError('Assessment not found.', 404);

      const resultsMap: Record<string, any> =
        req.body.activityResults || (existingAttempt?.activityResults as Record<string, any>) || {};

      const { scores, totalTimeSeconds, completedModalities } = computeAssessmentModalityScores({
        assessmentActivities: assessment.activities.map((cfg) => ({
          activityId: cfg.activityId,
          modality: cfg.activity.modality as any,
          questions: cfg.activity.questions,
        })),
        submittedResults: resultsMap,
      });

      // Validate that all 4 VARK sections were completed before finalizing
      const missingModalities = ASSESSMENT_MODALITY_ORDER.filter(
        (m) => !completedModalities.includes(m)
      );
      if (missingModalities.length > 0) {
        throw new AppError(
          `All four VARK sections must be completed before submission. Missing: ${missingModalities.join(', ')}.`,
          400
        );
      }

      const scoringMethodUsed = assessment.activities[0]?.scoringMethod || 'correctness_only';

      const completedAttempt = await prisma.assessmentAttempt.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId } },
        update: {
          status: 'completed',
          activityResults: resultsMap,
          completedActivityIds: assessment.activities.map((a) => a.activityId),
          totalTimeSeconds,
          scoringMethodUsed,
          completedAt: new Date(),
          lastSavedAt: new Date(),
        },
        create: {
          assessmentId,
          studentId,
          status: 'completed',
          activityResults: resultsMap,
          completedActivityIds: assessment.activities.map((a) => a.activityId),
          totalTimeSeconds,
          scoringMethodUsed,
          startedAt: new Date(),
          completedAt: new Date(),
          lastSavedAt: new Date(),
        },
      });

      const snapshot = await prisma.learningPreferenceSnapshot.create({
        data: {
          studentId,
          assessmentAttemptId: completedAttempt.id,
          assessmentName: assessment.name,
          visual: scores.visual,
          auditory: scores.auditory,
          readWrite: scores.read_write,
          kinesthetic: scores.kinesthetic,
          totalTimeSeconds,
          scoringMethodUsed,
        },
      });

      res.json({
        success: true,
        result: {
          id: snapshot.id,
          assessmentId,
          assessmentName: assessment.name,
          studentId,
          completedAt: snapshot.recordedAt.toISOString().slice(0, 10),
          scores,
          totalTimeSeconds,
          scoringMethodUsed,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
