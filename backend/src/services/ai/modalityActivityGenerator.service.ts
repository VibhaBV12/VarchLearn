import { ActivitySpecification, ModalityKey, DifficultyLevel } from '../../../../shared/types';
import { AiProviderService } from './aiProvider.service';
import { ActivityRequestInterpreter, InterpretedActivityRequest } from './activityRequestInterpreter.service';
import { ActivityPlanner, ActivityPlan } from './activityPlanner.service';
import { ActivitySchemaValidator } from './activitySchemaValidator.service';

export interface GenerateActivitySpecInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  concept?: string;
  difficulty?: DifficultyLevel;
  modality?: ModalityKey;
  teacherInstruction?: string;
  learningObjective?: string;
  sourceContext?: string;
  forceRefresh?: boolean;
}

export class ModalityActivityGenerator {
  /**
   * Deterministic grounded activity specification builder
   * Used for offline mode, unit tests, or graceful API fallback.
   * Truly parses the teacher's instruction and concept to build an executable specification!
   */
  public static buildDeterministicActivitySpecification(
    request: InterpretedActivityRequest,
    plan: ActivityPlan
  ): ActivitySpecification {
    const { topic, className, subject, difficulty, targetModality, resolvedActivityType, identifiedItems, pedagogicalIntent } = request;

    // Use identified items if teacher specified them, otherwise build standard domain items
    const rawItems = identifiedItems.length >= 2
      ? identifiedItems
      : targetModality === 'kinesthetic' && (resolvedActivityType.includes('sequenc') || topic.toLowerCase().includes('cycle'))
      ? ['Evaporation (Liquid to Vapor)', 'Condensation (Vapor to Cloud)', 'Precipitation (Rain / Snowfall)', 'Collection (Runoff into Oceans)']
      : targetModality === 'visual'
      ? [`${topic} Core Engine`, 'Transfer Conduit', 'Structural Base', 'External Boundary']
      : targetModality === 'auditory'
      ? ['Primary Audio Cue (Introduction)', 'Secondary Audio Cue (Mechanism)', 'Tertiary Audio Cue (Equilibrium)']
      : [`${topic} Key Principle`, 'Mutual Interdependence', 'Systemic Equilibrium'];

    const availableElements = rawItems.map((item, idx) => {
      const cleanLabel = item.replace(/\(.*?\)/g, '').trim();
      const id = `elem_${cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx + 1}`;
      return {
        id,
        label: cleanLabel,
        description: item.includes('(') ? item.replace(/.*\((.*?)\).*/, '$1') : `Essential part of ${topic}`,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][idx % 5],
      };
    });

    const isSequence = resolvedActivityType.includes('sequenc');
    const isSorting = resolvedActivityType.includes('sort');
    const isSimulation = resolvedActivityType.includes('simulat');
    const isFillBlank = resolvedActivityType.includes('blank') || resolvedActivityType.includes('fill');

    let targetZones: Array<any> = [];
    let correctSolution: any = {};

    if (isSequence) {
      targetZones = availableElements.map((el, idx) => ({
        id: `zone_step_${idx + 1}`,
        label: `Stage ${idx + 1}: Expected Step`,
        orderIndex: idx + 1,
        expectedElementId: el.id,
        feedbackOnMatch: `Step ${idx + 1} (${el.label}) correctly placed in sequence!`,
      }));
      correctSolution = {
        type: 'ordered_sequence',
        expectedSequence: availableElements.map((e) => e.id),
      };
    } else if (isSorting) {
      targetZones = [
        { id: 'zone_active', label: 'Active Driving Processes', category: 'active' },
        { id: 'zone_passive', label: 'Environmental / Structural', category: 'passive' },
      ];
      const activeIds = availableElements.slice(0, Math.ceil(availableElements.length / 2)).map((e) => e.id);
      const passiveIds = availableElements.slice(Math.ceil(availableElements.length / 2)).map((e) => e.id);
      correctSolution = {
        type: 'category_bins',
        expectedCategories: {
          zone_active: activeIds,
          zone_passive: passiveIds,
        },
      };
    } else if (isSimulation) {
      targetZones = [
        { id: 'zone_input', label: 'Input Flow Regulator' },
        { id: 'zone_output', label: 'System Balance Sensor' },
      ];
      correctSolution = {
        type: 'variable_state',
        expectedVariables: {
          flow_rate: 2,
          pressure_balance: 3,
        },
      };
    } else if (isFillBlank) {
      targetZones = availableElements.map((el, idx) => ({
        id: `blank_${idx + 1}`,
        label: `Blank ${idx + 1}`,
        expectedElementId: el.id,
        feedbackOnMatch: `Correctly filled: ${el.label}`,
      }));
      const fills: Record<string, string> = {};
      availableElements.forEach((el, idx) => {
        fills[`blank_${idx + 1}`] = el.label;
      });
      correctSolution = {
        type: 'text_fill',
        expectedFills: fills,
      };
    } else {
      // Default element mapping / diagram labelling
      targetZones = availableElements.map((el, idx) => ({
        id: `zone_slot_${idx + 1}`,
        label: `Target Zone ${idx + 1} (${el.label})`,
        expectedElementId: el.id,
        feedbackOnMatch: `Component firmly positioned in ${el.label} zone!`,
      }));
      correctSolution = {
        type: 'element_mapping',
        expectedPairs: availableElements.map((el, idx) => ({
          elementId: el.id,
          zoneId: `zone_slot_${idx + 1}`,
        })),
      };
    }

    const demoType =
      targetModality === 'visual'
        ? 'diagram_inspection'
        : targetModality === 'auditory'
        ? 'audio_narration'
        : targetModality === 'read_write'
        ? 'reading_notes'
        : 'simulation_preview';

    return {
      schemaVersion: '2.0.0',
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${topic} — ${resolvedActivityType.replace(/_/g, ' ').toUpperCase()}`,
      description: `Complete the ${resolvedActivityType.replace(/_/g, ' ')} for ${topic} to demonstrate mastery.`,
      subject,
      grade: className,
      topic,
      conceptId: request.conceptTitle,
      modality: targetModality,
      activityType: resolvedActivityType,
      rendererType: plan.interpreted.resolvedActivityType ? plan.interpreted.resolvedActivityType as any : 'SequenceBuilderRenderer',
      difficulty,
      learningObjective: request.learningObjective,
      studentInstructions: isSequence
        ? `Drag each stage below and drop it into its correct chronological position from Stage 1 to ${availableElements.length}.`
        : isSorting
        ? 'Sort each item into its corresponding scientific category.'
        : `Interact with the ${topic} components to complete the challenge.`,
      teacherPrompt: pedagogicalIntent,
      estimatedDurationMinutes: plan.estimatedMinutes,
      starReward: plan.starReward,
      sourceReferences: [`Textbook Unit: ${topic}`],
      alternativeResolved: request.alternativeResolved,
      learningContent: {
        overview: `${topic} functions as an integrated scientific system where components operate in a coordinated balance.`,
        demonstration: {
          type: demoType,
          data: {
            diagramTitle: `${topic} Structural Schema`,
            components: availableElements.map((e) => e.label),
          },
        },
        keyTakeaway: `Mastery of ${topic} requires understanding both individual components and their functional flow.`,
      },
      interactionData: {
        availableElements,
        targetZones,
        correctSolution,
        validationRules: {
          allowPartialCredit: true,
          immediateFeedback: request.requiresImmediateFeedback,
        },
      },
      hints: [
        `Think about which stage must occur first in ${topic}.`,
        'Remember that each phase directly feeds into the subsequent mechanism.',
      ],
      feedback: {
        correct: `Exceptional work! You mastered the ${topic} ${resolvedActivityType.replace(/_/g, ' ')}.`,
        incorrect: 'Some components are out of place. Inspect the feedback markers and try again.',
        partial: 'Good start! A few items need rearrangement.',
      },
      completionCriteria: {
        minimumCorrectPercent: 75,
      },
      embeddedQuestions: [
        {
          id: 'emb_q1',
          prompt: `Which stage or component initiates primary action in ${topic}?`,
          options: [availableElements[0]?.label || 'Initial stage', 'Random stage', 'None of the above'],
          correctIndex: 0,
          explanation: `In ${topic}, ${availableElements[0]?.label || 'the initial stage'} provides the starting catalyst.`,
        },
      ],
    };
  }

  /**
   * Generates a fully validated ActivitySpecification using Groq LLM or deterministic fallback
   */
  public static async generateActivitySpecification(
    input: GenerateActivitySpecInput
  ): Promise<{
    specification: ActivitySpecification;
    isCached: boolean;
    source: string;
  }> {
    const request = ActivityRequestInterpreter.interpret({
      teacherPrompt: input.teacherInstruction,
      topic: input.topic,
      concept: input.concept,
      className: input.className,
      subject: input.subject,
      difficulty: input.difficulty,
      modality: input.modality,
      learningObjective: input.learningObjective,
    });

    const plan = ActivityPlanner.plan(request, input.sourceContext);

    try {
      const { data, isCached, model } = await AiProviderService.generateJson<ActivitySpecification>(
        plan.generationPrompt,
        {
          temperature: 0.35,
          useCache: !input.forceRefresh,
        }
      );

      const validated = ActivitySchemaValidator.validateAndRepair(data);
      if (!validated.isValid || !validated.specification) {
        console.warn('AI Activity Spec validation failed; using grounded builder.', validated.errors);
        return {
          specification: this.buildDeterministicActivitySpecification(request, plan),
          isCached: false,
          source: 'deterministic_grounded_fallback',
        };
      }

      return {
        specification: validated.specification,
        isCached,
        source: `groq (${model})`,
      };
    } catch (err: any) {
      console.warn(`Groq activity specification generation error (${err?.message}); using grounded builder.`);
      return {
        specification: this.buildDeterministicActivitySpecification(request, plan),
        isCached: false,
        source: 'deterministic_grounded_fallback',
      };
    }
  }
}
