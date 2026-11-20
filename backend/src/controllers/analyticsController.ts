import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { SEED_ADMIN_SETTINGS } from '../../../shared/mock-data/seedData';
import { AppError } from '../middleware/errorHandler';
import { getOptionalParam } from '../utils/params';

export const analyticsController = {
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalClasses,
        totalStudents,
        activeStudents,
        publishedAssessments,
        totalActivities,
        pendingAiActivities,
        snapshots,
      ] = await Promise.all([
        prisma.classGroup.count(),
        prisma.student.count(),
        prisma.student.count({ where: { status: 'Active' } }),
        prisma.assessment.count({ where: { status: 'Published' } }),
        prisma.activity.count(),
        prisma.activity.count({ where: { approvalStatus: 'Pending_Review' } }),
        prisma.learningPreferenceSnapshot.findMany(),
      ]);

      const avg = (vals: number[]) =>
        vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

      res.json({
        success: true,
        stats: {
          totalClasses,
          totalStudents,
          activeStudents,
          publishedAssessments,
          totalActivities,
          pendingAiActivities,
          modalityAverages: {
            visual: avg(snapshots.map((s) => s.visual)),
            auditory: avg(snapshots.map((s) => s.auditory)),
            read_write: avg(snapshots.map((s) => s.readWrite)),
            kinesthetic: avg(snapshots.map((s) => s.kinesthetic)),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getStudentProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getOptionalParam(req.params.studentId) || req.user!.userId;
      if (req.user!.role === 'student' && studentId !== req.user!.userId) {
        throw new AppError('Forbidden.', 403);
      }

      const [snapshots, difficultyHistory, completedNodes] = await Promise.all([
        prisma.learningPreferenceSnapshot.findMany({
          where: { studentId },
          orderBy: { recordedAt: 'asc' },
        }),
        prisma.difficultyAdjustment.findMany({
          where: { studentId },
          orderBy: { adjustedAt: 'desc' },
        }),
        prisma.dailyAssignment.findMany({
          where: { studentId, status: 'completed' },
          include: { activity: true },
          orderBy: { completedAt: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        assessmentSnapshots: snapshots,
        difficultyHistory,
        completedDailyActivities: completedNodes,
      });
    } catch (err) {
      next(err);
    }
  },

  async getStudentRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getOptionalParam(req.params.studentId) || req.user!.userId;
      if (req.user!.role === 'student' && studentId !== req.user!.userId) {
        throw new AppError('Forbidden.', 403);
      }

      const [student, events] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: { id: true, name: true, stars: true, badges: true, completedActivitiesCount: true },
        }),
        prisma.rewardEvent.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({ success: true, student, rewardEvents: events });
    } catch (err) {
      next(err);
    }
  },

  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const row = await prisma.appSettings.findUnique({ where: { key: 'admin_settings' } });
      res.json({
        success: true,
        settings: row ? row.value : SEED_ADMIN_SETTINGS,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.appSettings.upsert({
        where: { key: 'admin_settings' },
        update: { value: req.body },
        create: { key: 'admin_settings', value: req.body },
      });
      res.json({ success: true, settings: updated.value });
    } catch (err) {
      next(err);
    }
  },
};
