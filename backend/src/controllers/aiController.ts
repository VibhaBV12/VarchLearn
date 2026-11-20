import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { extractRelevantChapterContext } from '../services/pdfService';
import {
  ConceptExtractionService,
  ConceptGenerationService,
  ModalityGenerationService,
  ActivityGenerationService,
  AssessmentGenerationService,
  AiProviderService,
  ModalityActivityGenerator,
  ActivityPersistenceService,
} from '../services/ai';
import { mapDbActivity } from '../utils/mappers';
import { ActivityCategory, DifficultyLevel, ModalityKey } from '../../../shared/types';

export const aiController = {
  /**
   * Extract Concept Knowledge Map from uploaded textbook or direct text
   */
  async extractConcepts(req: Request, res: Response, next: NextFunction) {
    try {
      const { textbookId, className, subject, chapter, topic, forceRefresh } = req.body;
      if (!className || !subject || !chapter || !topic) {
        throw new AppError('className, subject, chapter, and topic are required.', 400);
      }

      let excerpt = '';
      if (textbookId) {
        const textbook = await prisma.textbook.findUnique({
          where: { id: textbookId },
        });
        if (!textbook) throw new AppError('Textbook not found.', 404);
        if (!textbook.extractedRawText) {
          throw new AppError('Textbook has no readable text extracted.', 400);
        }
        excerpt = extractRelevantChapterContext(textbook.extractedRawText, chapter, topic);
      } else {
        excerpt = req.body.excerpt || `Subject: ${subject}\nChapter: ${chapter}\nTopic: ${topic}`;
      }

      const result = await ConceptExtractionService.extractConcepts({
        className,
        subject,
        chapter,
        topic,
        excerpt,
        forceRefresh: !!forceRefresh,
      });

      res.json({
        success: true,
        conceptMap: result.conceptMap,
        isCached: result.isCached,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate age-adapted conceptual explanation
   */
  async generateConceptExplanation(req: Request, res: Response, next: NextFunction) {
    try {
      const { className, subject, chapter, topic, conceptMap, forceRefresh } = req.body;
      if (!className || !subject || !topic || !conceptMap) {
        throw new AppError('className, subject, topic, and conceptMap are required.', 400);
      }

      const result = await ConceptGenerationService.generateExplanation({
        className,
        subject,
        chapter: chapter || topic,
        topic,
        conceptMap,
        forceRefresh: !!forceRefresh,
      });

      res.json({
        success: true,
        explanation: result.explanation,
        isCached: result.isCached,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate 4 multimodal representations (Visual, Auditory, Read/Write, Kinesthetic)
   */
  async generateModalities(req: Request, res: Response, next: NextFunction) {
    try {
      const { className, subject, chapter, topic, conceptMap, forceRefresh } = req.body;
      if (!className || !subject || !topic || !conceptMap) {
        throw new AppError('className, subject, topic, and conceptMap are required.', 400);
      }

      const result = await ModalityGenerationService.generateAllModalities({
        className,
        subject,
        chapter: chapter || topic,
        topic,
        conceptMap,
        forceRefresh: !!forceRefresh,
      });

      res.json({
        success: true,
        modalities: result.modalities,
        isCached: result.isCached,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Batch generate activities for all 4 modalities in one single operation
   */
  async generateBatchActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { textbookId, className, subject, chapter, topic, subtopic, category, difficulty, forceRefresh } = req.body;
      if (!className || !subject || !chapter || !topic) {
        throw new AppError('className, subject, chapter, and topic are required.', 400);
      }

      let chapterContext = '';
      let textbookSource = '';

      if (textbookId) {
        const textbook = await prisma.textbook.findUnique({ where: { id: textbookId } });
        if (!textbook) throw new AppError('Textbook not found.', 404);
        textbookSource = textbook.originalName;
        if (textbook.extractedRawText) {
          chapterContext = extractRelevantChapterContext(textbook.extractedRawText, chapter, topic);
        }
      }

      const activitiesMap = await ActivityGenerationService.generateFourModalityBatch({
        className,
        subject,
        chapter,
        topic,
        subtopic,
        category: (category as ActivityCategory) || 'games_puzzles',
        difficulty: (difficulty as DifficultyLevel) || 'Medium',
        chapterContext,
        forceRefresh: !!forceRefresh,
      });

      const modalities: ModalityKey[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];
      const createdActivities = [];

      for (const mod of modalities) {
        const gen = activitiesMap[mod];
        if (!gen) continue;

        const created = await prisma.activity.create({
          data: {
            name: gen.name,
            modality: mod,
            category: (category as ActivityCategory) || 'games_puzzles',
            gameType: gen.gameType,
            className,
            subject,
            chapter,
            topic,
            subtopic,
            originalDifficulty: (difficulty as DifficultyLevel) || 'Medium',
            difficulty: (difficulty as DifficultyLevel) || 'Medium',
            targetAbility: gen.targetAbility,
            scoringMethod: 'correctness_only',
            approvalStatus: 'Pending_Review',
            textbookId: textbookId || null,
            textbookSource: textbookSource || undefined,
            aiGenerated: true,
            generationSource: 'ai_groq',
            estimatedMinutes: gen.estimatedMinutes,
            starReward: gen.starReward,
            customization: gen.customization as never,
            questions: {
              create: gen.questions.map((q, idx) => ({
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

        createdActivities.push(mapDbActivity(created));
      }

      res.status(201).json({
        success: true,
        activities: createdActivities,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate assessment questions across 4 modalities
   */
  async generateAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { className, subject, chapter, topic, conceptMap, questionCount, difficulty, forceRefresh } = req.body;
      if (!className || !subject || !topic || !conceptMap) {
        throw new AppError('className, subject, topic, and conceptMap are required.', 400);
      }

      const result = await AssessmentGenerationService.generateAssessment({
        className,
        subject,
        chapter: chapter || topic,
        topic,
        conceptMap,
        questionCount: questionCount ? Number(questionCount) : 8,
        difficulty: (difficulty as DifficultyLevel) || 'Medium',
        forceRefresh: !!forceRefresh,
      });

      res.json({
        success: true,
        assessment: result.assessment,
        isCached: result.isCached,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Save generated assessment and its questions into PostgreSQL and assign to class groups
   */
  async saveGeneratedAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { assessment, classIds, publishNow } = req.body;
      if (!assessment || !Array.isArray(classIds) || classIds.length === 0) {
        throw new AppError('assessment data and classIds array are required.', 400);
      }

      // Group questions by modality to create 4 cohesive assessment activities
      const modalities: ModalityKey[] = ['kinesthetic', 'auditory', 'visual', 'read_write'];
      const createdActivityIds: string[] = [];

      for (const mod of modalities) {
        const modQuestions = assessment.questions.filter((q: any) => q.modality === mod);
        if (modQuestions.length === 0) continue;

        const firstQ = modQuestions[0];
        const activity = await prisma.activity.create({
          data: {
            name: `${assessment.topic} — ${mod.toUpperCase()} Assessment Section`,
            modality: mod,
            category: 'question_sets',
            gameType: 'Question Set',
            className: assessment.className,
            subject: assessment.subject,
            chapter: assessment.chapter,
            topic: assessment.topic,
            originalDifficulty: (firstQ.difficulty as DifficultyLevel) || 'Medium',
            difficulty: (firstQ.difficulty as DifficultyLevel) || 'Medium',
            targetAbility: `Comprehensive ${mod} conceptual evaluation`,
            scoringMethod: 'correctness_only',
            approvalStatus: 'Approved',
            aiGenerated: true,
            generationSource: 'ai_groq',
            estimatedMinutes: Math.max(5, modQuestions.length * 2),
            starReward: modQuestions.length * 5,
            customization: {
              gameTheme: `${assessment.topic} Diagnostic Evaluation`,
              backgroundStyle: 'Standard Assessment Mode',
              objects: [assessment.topic],
              visualsDescription: `Standardized ${mod} questions testing ${assessment.topic}`,
              mission: `Demonstrate mastery in the ${mod} section.`,
              instructions: 'Read each prompt carefully, formulate your answer, and verify your reasoning.',
              vocabulary: [assessment.topic],
              scenario: `Diagnostic testing on ${assessment.chapter}.`,
              rewardSteps: ['Complete all questions', 'Submit for evaluation'],
              progressStages: ['Section In Progress', 'Section Completed'],
            } as never,
            questions: {
              create: modQuestions.map((q: any, idx: number) => ({
                type: 'academic',
                prompt: q.prompt,
                options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Correct Answer', 'Alternative Option'],
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                hint: q.hint || undefined,
                explanation: q.explanation || undefined,
                orderIndex: idx,
              })),
            },
          },
        });

        createdActivityIds.push(activity.id);
      }

      // Create the Assessment record
      const isPublished = !!publishNow;
      const createdAssessment = await prisma.assessment.create({
        data: {
          name: assessment.name,
          description: assessment.description || `Assessment on ${assessment.topic}`,
          status: isPublished ? 'Published' : 'Draft',
          publishedAt: isPublished ? new Date() : null,
          allowRetake: true,
          retakeCondition: 'Permitted once per term upon Admin review',
          classes: {
            create: classIds.map((cid: string) => ({
              classId: cid,
            })),
          },
          activities: {
            create: createdActivityIds.map((actId: string, idx: number) => ({
              activityId: actId,
              orderIndex: idx + 1,
              scoringMethod: 'correctness_only',
            })),
          },
        },
        include: {
          classes: true,
          activities: { include: { activity: { include: { questions: true } } } },
        },
      });

      res.status(201).json({
        success: true,
        assessmentId: createdAssessment.id,
        assessment: createdAssessment,
        message: `Assessment "${assessment.name}" successfully saved in PostgreSQL and assigned to ${classIds.length} class(es).`,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Dedicated Natural Language Activity Generator
   * Transforms teacher free-text descriptions into executable ActivitySpecifications
   */
  async generateCustomActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        textbookId,
        className,
        subject,
        chapter,
        topic,
        concept,
        difficulty,
        modality,
        teacherInstruction,
        learningObjective,
        forceRefresh,
      } = req.body;

      if (!className || !subject || !topic) {
        throw new AppError('className, subject, and topic are required.', 400);
      }

      let sourceContext = '';
      if (textbookId) {
        const textbook = await prisma.textbook.findUnique({ where: { id: textbookId } });
        if (textbook?.extractedRawText) {
          sourceContext = extractRelevantChapterContext(textbook.extractedRawText, chapter || topic, topic);
        }
      }

      const result = await ModalityActivityGenerator.generateActivitySpecification({
        className,
        subject,
        chapter: chapter || topic,
        topic,
        concept,
        difficulty: (difficulty as DifficultyLevel) || 'Medium',
        modality: (modality as ModalityKey) || undefined,
        teacherInstruction,
        learningObjective,
        sourceContext,
        forceRefresh: !!forceRefresh,
      });

      res.json({
        success: true,
        specification: result.specification,
        isCached: result.isCached,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Persists an ActivitySpecification directly into PostgreSQL separately from assessments
   */
  async saveCustomActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { specification, chapter, textbookId, textbookSource, approvalStatus } = req.body;
      if (!specification || typeof specification !== 'object') {
        throw new AppError('A valid ActivitySpecification object is required.', 400);
      }

      const activity = await ActivityPersistenceService.persistActivitySpecification({
        specification,
        chapter,
        textbookId,
        textbookSource,
        approvalStatus: approvalStatus || 'Approved',
      });

      res.status(201).json({
        success: true,
        activity,
        message: `Activity "${activity.name}" successfully persisted to PostgreSQL database.`,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Diagnostic cache stats
   */
  async getAiStats(req: Request, res: Response) {
    res.json({
      success: true,
      cache: AiProviderService.getCacheStats(),
      aiProvider: process.env.AI_PROVIDER || 'groq',
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    });
  },
};
