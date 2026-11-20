import { prisma } from '../../config/prisma';
import { ActivitySpecification, ActivityItem, ApprovalStatus } from '../../../../shared/types';
import { mapDbActivity, frontendApprovalToDb } from '../../utils/mappers';
import { AppError } from '../../middleware/errorHandler';

export class ActivityPersistenceService {
  /**
   * Persists an ActivitySpecification into PostgreSQL separately from assessments
   */
  public static async persistActivitySpecification(params: {
    specification: ActivitySpecification;
    chapter?: string;
    textbookId?: string;
    textbookSource?: string;
    approvalStatus?: ApprovalStatus;
  }): Promise<ActivityItem> {
    const spec = params.specification;
    const chapterName = params.chapter || `Unit: ${spec.topic}`;

    // Synthesize backward-compatible learningExperience & learningInput from specification
    const learningExperience: any = {
      title: spec.title,
      description: spec.learningContent.overview,
      instructions: spec.studentInstructions,
      activitySpec: spec,
    };

    const learningInput: any = {
      activityType: spec.activityType,
      rendererType: spec.rendererType,
      overview: spec.learningContent.overview,
      elements: spec.interactionData.availableElements,
      zones: spec.interactionData.targetZones,
    };

    if (spec.modality === 'visual') {
      learningInput.diagramTitle = spec.title;
      learningInput.diagramParts = spec.interactionData.availableElements.map((el, i) => ({
        id: el.id,
        label: el.label,
        description: el.description || '',
        x: 20 + (i % 3) * 30,
        y: 20 + Math.floor(i / 3) * 30,
      }));
      learningExperience.visualType = 'annotated_diagram';
      learningExperience.nodes = learningInput.diagramParts;
    } else if (spec.modality === 'auditory') {
      learningInput.audioTranscript = spec.learningContent.overview;
      learningExperience.audioTitle = spec.title;
      learningExperience.narrationScript = spec.learningContent.overview;
      learningExperience.segments = [
        { index: 1, title: 'Overview', transcriptSnippet: spec.learningContent.overview, durationSec: 20, listenTarget: 'Main principles' }
      ];
    } else if (spec.modality === 'read_write') {
      learningInput.readingPassage = spec.learningContent.overview;
      learningExperience.passageTitle = spec.title;
      learningExperience.structuredPassage = spec.learningContent.overview;
      learningExperience.vocabularyNotes = spec.interactionData.availableElements.map((el) => ({
        term: el.label,
        definition: el.description || 'Key term in this concept.',
        contextSentence: spec.learningContent.overview,
      }));
    } else if (spec.modality === 'kinesthetic') {
      learningInput.interactiveModelParts = spec.interactionData.availableElements.map((e) => e.label);
      learningExperience.kinestheticType = spec.activityType.includes('sequenc') ? 'process_sequencing' : 'model_assembly';
      learningExperience.processSteps = spec.interactionData.availableElements.map((el, idx) => ({
        id: el.id,
        stepNumber: idx + 1,
        label: el.label,
        description: el.description || '',
      }));
    }

    const customizationPayload = {
      gameTheme: `${spec.topic} Active Studio`,
      backgroundStyle: 'VarchLearn Interactive Studio',
      objects: spec.interactionData.availableElements.map((e) => e.label),
      visualsDescription: spec.description,
      mission: spec.learningObjective,
      instructions: spec.studentInstructions,
      vocabulary: spec.interactionData.availableElements.map((e) => e.label),
      scenario: spec.description,
      rewardSteps: ['Complete Interactive Task', `Earn ${spec.starReward} Stars`],
      progressStages: ['Learn', 'Interact', 'Master'],
      activitySpec: spec,
      learningExperience,
      learningInput,
    };

    const created = await prisma.activity.create({
      data: {
        name: spec.title,
        modality: spec.modality,
        category: 'games_puzzles',
        gameType: spec.activityType,
        className: spec.grade,
        subject: spec.subject,
        chapter: chapterName,
        topic: spec.topic,
        originalDifficulty: spec.difficulty,
        difficulty: spec.difficulty,
        targetAbility: spec.learningObjective,
        scoringMethod: 'correctness_only',
        approvalStatus: frontendApprovalToDb(params.approvalStatus || 'Approved'),
        textbookId: params.textbookId || null,
        textbookSource: params.textbookSource || undefined,
        aiGenerated: true,
        generationSource: 'groq_activity_engine',
        estimatedMinutes: spec.estimatedDurationMinutes,
        starReward: spec.starReward,
        customization: customizationPayload as never,
        questions: spec.embeddedQuestions && spec.embeddedQuestions.length > 0
          ? {
              create: spec.embeddedQuestions.map((q, idx) => ({
                type: 'academic',
                prompt: q.prompt,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                orderIndex: idx,
              })),
            }
          : undefined,
      },
      include: {
        questions: true,
      },
    });

    return mapDbActivity(created);
  }

  /**
   * Retrieves an activity along with its full ActivitySpecification
   */
  public static async getActivityById(id: string): Promise<ActivityItem> {
    const act = await prisma.activity.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!act) throw new AppError('Activity not found', 404);
    return mapDbActivity(act);
  }

  /**
   * Updates approval status
   */
  public static async setApproval(id: string, status: ApprovalStatus): Promise<ActivityItem> {
    const updated = await prisma.activity.update({
      where: { id },
      data: { approvalStatus: frontendApprovalToDb(status) },
      include: { questions: true },
    });
    return mapDbActivity(updated);
  }
}
