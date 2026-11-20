import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { computeDailyAllocation, MAX_DAILY_ACTIVITIES } from '../utils/allocation';
import { mapDbActivity, mapDbDailyNode, mapDbStudent } from '../utils/mappers';
import { getOptionalParam, getRequiredParam } from '../utils/params';

export const assignmentController = {
  async getStudentDailyPath(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getOptionalParam(req.params.studentId) || req.user!.userId;
      if (req.user!.role === 'student' && studentId !== req.user!.userId) {
        throw new AppError('Forbidden: cannot view another student path.', 403);
      }

      const nodes = await prisma.dailyAssignment.findMany({
        where: { studentId },
        include: { activity: { include: { questions: true } } },
        orderBy: { orderIndex: 'asc' },
      });

      if (nodes.length > 0) {
        return res.json({ success: true, nodes: nodes.map(mapDbDailyNode) });
      }

      // Initial deterministic allocation if student has no daily path yet
      const studentRow = await prisma.student.findUnique({
        where: { id: studentId },
        include: { classGroup: true, learningPreferences: true, difficultyHistory: true },
      });
      if (!studentRow) throw new AppError('Student not found.', 404);
      const stu = mapDbStudent(studentRow);

      const approved = await prisma.activity.findMany({
        where: { approvalStatus: 'Approved' },
        include: { questions: true },
      });

      const proposal = computeDailyAllocation({
        studentId,
        latestScores: stu.latestAssessmentResult?.scores || null,
        pendingCarryForward: [],
        approvedBank: approved.map(mapDbActivity),
        studentClassName: stu.className,
      });

      const today = new Date().toISOString().slice(0, 10);
      const createdNodes = [];
      for (let i = 0; i < proposal.proposedNewActivities.length; i++) {
        const act = proposal.proposedNewActivities[i];
        const created = await prisma.dailyAssignment.create({
          data: {
            studentId,
            activityId: act.id,
            assignedDate: today,
            isCarriedForward: false,
            status: i === 0 ? 'current' : i <= 2 ? 'available' : 'locked',
            orderIndex: i,
          },
          include: { activity: { include: { questions: true } } },
        });
        createdNodes.push(created);
      }

      res.json({ success: true, nodes: createdNodes.map(mapDbDailyNode) });
    } catch (err) {
      next(err);
    }
  },

  async proposeAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.studentId, 'studentId');
      const studentRow = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          classGroup: true,
          learningPreferences: { include: { assessmentAttempt: true } },
          difficultyHistory: true,
        },
      });
      if (!studentRow) throw new AppError('Student not found.', 404);
      const stu = mapDbStudent(studentRow);

      const pendingRows = await prisma.dailyAssignment.findMany({
        where: { studentId, status: { not: 'completed' } },
        include: { activity: { include: { questions: true } } },
        orderBy: { orderIndex: 'asc' },
      });

      const approvedRows = await prisma.activity.findMany({
        where: { approvalStatus: 'Approved' },
        include: { questions: true },
      });

      const proposal = computeDailyAllocation({
        studentId,
        latestScores: stu.latestAssessmentResult?.scores || null,
        pendingCarryForward: pendingRows.map(mapDbDailyNode),
        approvedBank: approvedRows.map(mapDbActivity),
        studentClassName: stu.className,
      });

      res.json({ success: true, proposal });
    } catch (err) {
      next(err);
    }
  },

  async publishAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.studentId, 'studentId');
      const { activityIds } = req.body as { activityIds: string[] };
      if (!Array.isArray(activityIds)) {
        throw new AppError('activityIds array is required.', 400);
      }

      const pending = await prisma.dailyAssignment.findMany({
        where: { studentId, status: { not: 'completed' } },
        orderBy: { orderIndex: 'asc' },
      });

      const pendingActivityIds = new Set(pending.map((p) => p.activityId));
      const remainingSlots = Math.max(0, MAX_DAILY_ACTIVITIES - pending.length);
      const today = new Date().toISOString().slice(0, 10);

      // Mark existing pending as carried forward without altering assignedDate
      for (let i = 0; i < pending.length; i++) {
        await prisma.dailyAssignment.update({
          where: { id: pending[i].id },
          data: { isCarriedForward: true, orderIndex: i },
        });
      }

      const newIds = activityIds
        .filter((id) => !pendingActivityIds.has(id))
        .slice(0, remainingSlots);

      for (let i = 0; i < newIds.length; i++) {
        const orderIndex = pending.length + i;
        await prisma.dailyAssignment.upsert({
          where: {
            studentId_activityId_assignedDate: {
              studentId,
              activityId: newIds[i],
              assignedDate: today,
            },
          },
          update: {},
          create: {
            studentId,
            activityId: newIds[i],
            assignedDate: today,
            isCarriedForward: false,
            status: orderIndex === 0 ? 'current' : orderIndex <= 2 ? 'available' : 'locked',
            orderIndex,
          },
        });
      }

      const updated = await prisma.dailyAssignment.findMany({
        where: { studentId },
        include: { activity: { include: { questions: true } } },
        orderBy: { orderIndex: 'asc' },
      });

      res.json({ success: true, nodes: updated.map(mapDbDailyNode) });
    } catch (err) {
      next(err);
    }
  },

  async completeNode(req: Request, res: Response, next: NextFunction) {
    try {
      const nodeId = getRequiredParam(req.params.nodeId, 'nodeId');
      const node = await prisma.dailyAssignment.findUnique({
        where: { id: nodeId },
        include: { activity: true },
      });
      if (!node) throw new AppError('Daily path node not found.', 404);
      if (req.user!.role === 'student' && node.studentId !== req.user!.userId) {
        throw new AppError('Forbidden.', 403);
      }

      const earnedStars = node.activity.starReward;

      if (node.status !== 'completed') {
        await prisma.dailyAssignment.update({
          where: { id: nodeId },
          data: {
            status: 'completed',
            earnedStars,
            completedAt: new Date(),
          },
        });

        await prisma.student.update({
          where: { id: node.studentId },
          data: {
            stars: { increment: earnedStars },
            completedActivitiesCount: { increment: 1 },
          },
        });

        await prisma.rewardEvent.create({
          data: {
            studentId: node.studentId,
            title: `Completed ${node.activity.name}`,
            starsAwarded: earnedStars,
            sourceType: 'daily_activity',
          },
        });
      }

      // Unlock next node if needed
      const allNodes = await prisma.dailyAssignment.findMany({
        where: { studentId: node.studentId },
        orderBy: { orderIndex: 'asc' },
      });

      const hasCurrent = allNodes.some((n) => n.status === 'current');
      if (!hasCurrent) {
        const nextNode = allNodes.find((n) => n.status === 'available' || n.status === 'locked');
        if (nextNode) {
          await prisma.dailyAssignment.update({
            where: { id: nextNode.id },
            data: { status: 'current' },
          });
        }
      }

      const refreshed = await prisma.dailyAssignment.findMany({
        where: { studentId: node.studentId },
        include: { activity: { include: { questions: true } } },
        orderBy: { orderIndex: 'asc' },
      });

      res.json({ success: true, earnedStars, nodes: refreshed.map(mapDbDailyNode) });
    } catch (err) {
      next(err);
    }
  },
};
