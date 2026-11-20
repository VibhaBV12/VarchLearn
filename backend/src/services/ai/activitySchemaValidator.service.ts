import { z } from 'zod';
import { ActivitySpecification, SupportedActivityType, ActivityRendererType, ModalityKey, DifficultyLevel } from '../../../../shared/types';
import { ActivityRendererResolver } from './activityRendererResolver.service';

export const activitySpecificationSchema = z.object({
  schemaVersion: z.literal('2.0.0').default('2.0.0'),
  id: z.string().default(() => `act_${Date.now()}`),
  title: z.string().min(2),
  description: z.string().min(5),
  subject: z.string(),
  grade: z.string(),
  topic: z.string(),
  conceptId: z.string().optional(),
  modality: z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']),
  activityType: z.string(),
  rendererType: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  learningObjective: z.string().min(5),
  studentInstructions: z.string().min(5),
  teacherPrompt: z.string().optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(60).default(5),
  starReward: z.number().int().min(5).max(100).default(12),
  sourceReferences: z.array(z.string()).default([]),
  alternativeResolved: z
    .object({
      originalRequest: z.string(),
      resolvedType: z.string(),
      reason: z.string(),
    })
    .optional(),
  learningContent: z.object({
    overview: z.string().min(10),
    demonstration: z
      .object({
        type: z.string(),
        data: z.any().optional(),
      })
      .optional(),
    keyTakeaway: z.string().min(5),
  }),
  interactionData: z.object({
    availableElements: z.array(
      z.object({
        id: z.string(),
        label: z.string().min(1),
        description: z.string().optional(),
        assetKey: z.string().optional(),
        color: z.string().optional(),
        data: z.any().optional(),
      })
    ).min(2),
    targetZones: z
      .array(
        z.object({
          id: z.string(),
          label: z.string().min(1),
          expectedElementId: z.string().optional(),
          category: z.string().optional(),
          orderIndex: z.number().optional(),
          feedbackOnMatch: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    correctSolution: z.object({
      type: z.enum(['ordered_sequence', 'element_mapping', 'category_bins', 'variable_state', 'text_fill']),
      expectedSequence: z.array(z.string()).optional(),
      expectedPairs: z.array(z.object({ elementId: z.string(), zoneId: z.string() })).optional(),
      expectedCategories: z.record(z.string(), z.array(z.string())).optional(),
      expectedVariables: z.record(z.string(), z.number()).optional(),
      expectedFills: z.record(z.string(), z.string()).optional(),
    }),
    validationRules: z.object({
      allowPartialCredit: z.boolean().default(true),
      maxAttempts: z.number().optional(),
      immediateFeedback: z.boolean().default(true),
    }),
  }),
  hints: z.array(z.string()).min(1).default(['Review the topic principles carefully.']),
  feedback: z.object({
    correct: z.string().min(3),
    incorrect: z.string().min(3),
    partial: z.string().optional(),
  }),
  completionCriteria: z.object({
    minimumCorrectPercent: z.number().min(0).max(100).default(70),
    requiredInteractionsCount: z.number().optional(),
  }),
  embeddedQuestions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string().min(3),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
        explanation: z.string().min(3),
      })
    )
    .optional(),
});

export class ActivitySchemaValidator {
  /**
   * Validates and auto-repairs raw AI or user activity specifications
   */
  public static validateAndRepair(raw: any): {
    isValid: boolean;
    specification: ActivitySpecification | null;
    errors: string[];
    repaired: boolean;
  } {
    let repaired = false;
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, specification: null, errors: ['Specification is not an object'], repaired: false };
    }

    // Auto-repair top-level fields
    raw.schemaVersion = '2.0.0';
    if (!raw.id) {
      raw.id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      repaired = true;
    }
    if (!raw.title) {
      raw.title = `${raw.topic || 'Concept'} Interactive Activity`;
      repaired = true;
    }
    if (!raw.description) {
      raw.description = `Interactive ${raw.modality || 'multimodal'} learning task for ${raw.topic || 'the topic'}.`;
      repaired = true;
    }
    if (!raw.subject) {
      raw.subject = 'Science';
      repaired = true;
    }
    if (!raw.grade) {
      raw.grade = 'Class 6';
      repaired = true;
    }
    if (!raw.topic) {
      raw.topic = 'Concept Exploration';
      repaired = true;
    }
    if (!raw.learningObjective || String(raw.learningObjective).length < 5) {
      raw.learningObjective = `Master the scientific mechanism of ${raw.topic}.`;
      repaired = true;
    }
    if (!raw.studentInstructions || String(raw.studentInstructions).length < 5) {
      raw.studentInstructions = 'Interact with the components to solve the challenge.';
      repaired = true;
    }
    if (!raw.difficulty || !['Easy', 'Medium', 'Hard'].includes(raw.difficulty)) {
      raw.difficulty = 'Medium';
      repaired = true;
    }
    if (typeof raw.estimatedMinutes !== 'number' || raw.estimatedMinutes < 1) {
      raw.estimatedMinutes = 10;
      repaired = true;
    }

    // Validate and resolve renderer
    const res = ActivityRendererResolver.resolveRenderer(
      raw.activityType || 'diagram_labelling',
      raw.modality as ModalityKey
    );
    if (!raw.activityType || raw.activityType !== res.activityType) {
      raw.activityType = res.activityType;
      repaired = true;
    }
    raw.rendererType = res.rendererType;
    if (res.alternativeResolved && !raw.alternativeResolved) {
      raw.alternativeResolved = res.alternativeResolved;
    }

    // Auto-repair learningContent
    if (!raw.learningContent || typeof raw.learningContent !== 'object') {
      raw.learningContent = {
        overview: `${raw.topic || 'This concept'} operates through coordinated scientific relationships.`,
        demonstration: {
          type: 'diagram_inspection',
          data: { topic: raw.topic },
        },
        keyTakeaway: `${raw.topic || 'System'} components must remain balanced to achieve equilibrium.`,
      };
      repaired = true;
    } else {
      if (!raw.learningContent.overview || String(raw.learningContent.overview).length < 10) {
        raw.learningContent.overview = `${raw.topic || 'This concept'} operates through coordinated scientific relationships.`;
        repaired = true;
      }
      if (!raw.learningContent.demonstration || typeof raw.learningContent.demonstration !== 'object') {
        raw.learningContent.demonstration = {
          type: 'diagram_inspection',
          data: { topic: raw.topic },
        };
        repaired = true;
      }
      if (!raw.learningContent.keyTakeaway || String(raw.learningContent.keyTakeaway).length < 10) {
        raw.learningContent.keyTakeaway = `${raw.topic || 'System'} components must remain balanced to achieve equilibrium.`;
        repaired = true;
      }
    }

    // Auto-repair interactionData
    if (!raw.interactionData || typeof raw.interactionData !== 'object') {
      raw.interactionData = {
        availableElements: [
          { id: 'elem_1', label: `${raw.topic || 'Core'} Module`, description: 'Primary active component' },
          { id: 'elem_2', label: 'Conduit & Distribution', description: 'Transfers material and energy' },
          { id: 'elem_3', label: 'Support & Stabilizer', description: 'Maintains system balance' },
        ],
        targetZones: [
          { id: 'zone_1', label: 'Primary Active Zone', expectedElementId: 'elem_1', feedbackOnMatch: 'Core placed!' },
          { id: 'zone_2', label: 'Transfer Corridor', expectedElementId: 'elem_2', feedbackOnMatch: 'Conduit linked!' },
          { id: 'zone_3', label: 'Anchor Base', expectedElementId: 'elem_3', feedbackOnMatch: 'Stabilizer set!' },
        ],
        correctSolution: {
          type: 'element_mapping',
          expectedPairs: [
            { elementId: 'elem_1', zoneId: 'zone_1' },
            { elementId: 'elem_2', zoneId: 'zone_2' },
            { elementId: 'elem_3', zoneId: 'zone_3' },
          ],
        },
        validationRules: {
          allowPartialCredit: true,
          immediateFeedback: true,
        },
      };
      repaired = true;
    }

    // Ensure availableElements has valid IDs and minimum 2 items
    if (!Array.isArray(raw.interactionData.availableElements) || raw.interactionData.availableElements.length < 2) {
      raw.interactionData.availableElements = [
        { id: 'elem_1', label: `${raw.topic || 'Core'} Component 1` },
        { id: 'elem_2', label: `${raw.topic || 'Secondary'} Component 2` },
      ];
      repaired = true;
    } else {
      raw.interactionData.availableElements = raw.interactionData.availableElements.map((el: any, i: number) => {
        if (!el.id) {
          repaired = true;
          return { ...el, id: `elem_${i + 1}` };
        }
        return el;
      });
    }

    // Ensure correctSolution is consistent with available elements
    if (!raw.interactionData.correctSolution || typeof raw.interactionData.correctSolution !== 'object') {
      const elemIds = raw.interactionData.availableElements.map((e: any) => e.id);
      if (raw.activityType.includes('sequenc')) {
        raw.interactionData.correctSolution = {
          type: 'ordered_sequence',
          expectedSequence: elemIds,
        };
      } else {
        raw.interactionData.correctSolution = {
          type: 'element_mapping',
          expectedPairs: elemIds.map((id: string, i: number) => ({ elementId: id, zoneId: `zone_${i + 1}` })),
        };
      }
      repaired = true;
    }

    // Ensure validationRules exists
    if (!raw.interactionData.validationRules || typeof raw.interactionData.validationRules !== 'object') {
      raw.interactionData.validationRules = {
        allowPartialCredit: true,
        immediateFeedback: true,
      };
      repaired = true;
    }

    // Auto-repair feedback & hints
    if (!raw.hints || !Array.isArray(raw.hints) || raw.hints.length === 0) {
      raw.hints = ['Recall the primary definitions and functional sequence from the lesson.'];
      repaired = true;
    }
    if (!raw.feedback || typeof raw.feedback !== 'object') {
      raw.feedback = {
        correct: `Brilliant! You successfully solved the ${raw.topic} challenge.`,
        incorrect: 'Not quite. Check the relationship between the parts and try again.',
        partial: 'Partially correct. Adjust the remaining elements.',
      };
      repaired = true;
    }

    // Auto-repair completion criteria
    if (!raw.completionCriteria || typeof raw.completionCriteria !== 'object') {
      raw.completionCriteria = {
        minimumCorrectPercent: 70,
      };
      repaired = true;
    }

    // Parse with Zod
    const parsed = activitySpecificationSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((i) => `[${i.path.join('.')}]: ${i.message}`));
      return { isValid: false, specification: null, errors, repaired };
    }

    return {
      isValid: true,
      specification: parsed.data as ActivitySpecification,
      errors: [],
      repaired,
    };
  }
}
