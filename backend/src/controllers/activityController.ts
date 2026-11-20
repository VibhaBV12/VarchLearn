import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { createActivitySchema, generateAiActivitySchema } from '../validators/schemas';
import { generateModalityActivity } from '../services/aiGeneratorService';
import { extractRelevantChapterContext } from '../services/pdfService';
import { frontendApprovalToDb, mapDbActivity } from '../utils/mappers';
import { ApprovalStatus } from '../../../shared/types';
import { getRequiredParam } from '../utils/params';

export const activityController = {
  async listActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user?.role === 'student';
      const modality = req.query.modality ? String(req.query.modality) : undefined;
      const statusParam = req.query.status ? String(req.query.status) : undefined;

      const where: Record<string, unknown> = {};
      if (modality) where.modality = modality;
      if (isStudent) {
        where.approvalStatus = 'Approved';
      } else if (statusParam && statusParam !== 'All') {
        where.approvalStatus = frontendApprovalToDb(statusParam as ApprovalStatus);
      }

      const rows = await prisma.activity.findMany({
        where,
        include: { questions: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, activities: rows.map(mapDbActivity) });
    } catch (err) {
      next(err);
    }
  },

  async createManualActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createActivitySchema.parse(req.body);
      const created = await prisma.activity.create({
        data: {
          ...body,
          originalDifficulty: body.difficulty,
          approvalStatus: 'Approved',
          aiGenerated: false,
          generationSource: 'manual',
          customization: body.customization as never,
        },
        include: { questions: true },
      });
      res.status(201).json({ success: true, activity: mapDbActivity(created) });
    } catch (err) {
      next(err);
    }
  },

  async generateAiActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = generateAiActivitySchema.parse(req.body);

      let resolvedChapterContext = body.chapterContext;
      let resolvedTextbookSource = body.textbookSource;

      // Retrieve stored PDF text from PostgreSQL when textbookId is provided
      if (body.textbookId) {
        const textbook = await prisma.textbook.findUnique({
          where: { id: body.textbookId },
          include: { chapters: { include: { topics: true } } },
        });
        if (!textbook) {
          throw new AppError('Selected textbook was not found in the database.', 404);
        }
        resolvedTextbookSource = resolvedTextbookSource || textbook.originalName;

        if (!textbook.extractedRawText || textbook.extractedRawText.trim().length < 40) {
          throw new AppError(
            'The selected textbook has no extracted text in the database. Please re-upload a readable PDF.',
            400
          );
        }

        resolvedChapterContext = extractRelevantChapterContext(
          textbook.extractedRawText,
          body.chapter,
          body.topic
        );
        if (!resolvedChapterContext || resolvedChapterContext.trim().length < 60) {
          throw new AppError(
            'Insufficient extracted textbook content for the selected chapter/topic. Please upload a readable text-based PDF.',
            400
          );
        }
      }

      const generated = await generateModalityActivity({
        ...body,
        chapterContext: resolvedChapterContext,
      });

      const created = await prisma.activity.create({
        data: {
          name: generated.name,
          modality: body.modality,
          category: body.category,
          gameType: generated.gameType,
          className: body.className,
          subject: body.subject,
          chapter: body.chapter,
          topic: body.topic,
          subtopic: body.subtopic,
          originalDifficulty: body.difficulty,
          difficulty: body.difficulty,
          targetAbility: generated.targetAbility,
          scoringMethod: 'correctness_only',
          approvalStatus: 'Pending_Review',
          textbookId: body.textbookId,
          textbookSource: resolvedTextbookSource,
          aiGenerated: true,
          generationSource: generated.generationSource,
          estimatedMinutes: generated.estimatedMinutes,
          starReward: generated.starReward,
          customization: generated.customization as never,
          questions: {
            create: generated.questions.map((q, idx) => ({
              type: q.type,
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correctIndex,
              hint: q.hint,
              explanation: q.explanation,
              orderIndex: idx,
            })),
          },
        },
        include: { questions: true },
      });

      res.status(201).json({
        success: true,
        isDevelopmentFallback: generated.isDevelopmentFallback,
        generationSource: generated.generationSource,
        activity: mapDbActivity(created),
      });
    } catch (err) {
      next(err);
    }
  },

  async updateApprovalStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const activityId = getRequiredParam(req.params.id, 'id');
      const { approvalStatus } = req.body;
      if (!approvalStatus) throw new AppError('approvalStatus is required.', 400);
      const updated = await prisma.activity.update({
        where: { id: activityId },
        data: { approvalStatus: frontendApprovalToDb(approvalStatus) },
        include: { questions: true },
      });
      res.json({ success: true, activity: mapDbActivity(updated) });
    } catch (err) {
      next(err);
    }
  },

  async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activityId = getRequiredParam(req.params.id, 'id');
      const { name, difficulty, customization } = req.body;
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (difficulty !== undefined) data.difficulty = difficulty;
      if (customization !== undefined) data.customization = customization;

      const updated = await prisma.activity.update({
        where: { id: activityId },
        data: data as never,
        include: { questions: true },
      });
      res.json({ success: true, activity: mapDbActivity(updated) });
    } catch (err) {
      next(err);
    }
  },
};
