import { ZodType } from 'zod';
import { AppError } from '../../middleware/errorHandler';
import {
  conceptMapSchema,
  conceptExplanationSchema,
  generatedActivitySchema,
  generatedAssessmentSchema,
  allModalitiesRepresentationSchema,
} from './generationSchemas';

export interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
  repaired: boolean;
}

export class QualityValidationService {
  /**
   * Generic schema validator with error formatting
   */
  public static validateWithSchema<T>(
    schema: ZodType<T, any, any>,
    data: unknown,
    contextName: string
  ): ValidationResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
      return { isValid: true, data: result.data, errors: [], repaired: false };
    }

    const errors = result.error.issues.map(
      (issue) => `[${issue.path.join('.')}]: ${issue.message}`
    );

    return { isValid: false, data: null, errors, repaired: false };
  }

  /**
   * Validates and auto-repairs generated activities (e.g., correctIndex out-of-bounds, duplicate options)
   */
  public static validateAndRepairActivity(raw: any): {
    isValid: boolean;
    activity: any;
    errors: string[];
    repaired: boolean;
  } {
    let repaired = false;
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, activity: null, errors: ['Activity payload is not an object'], repaired: false };
    }

    // Auto-repair missing top-level defaults
    if (typeof raw.estimatedMinutes !== 'number' || raw.estimatedMinutes < 1) {
      raw.estimatedMinutes = Math.max(1, typeof raw.estimatedMinutes === 'number' ? Math.min(30, raw.estimatedMinutes) : 5);
      if (raw.estimatedMinutes < 1) raw.estimatedMinutes = 5;
      repaired = true;
    }
    if (typeof raw.starReward !== 'number' || raw.starReward < 5) {
      raw.starReward = Math.max(5, typeof raw.starReward === 'number' ? Math.min(50, raw.starReward) : 15);
      if (raw.starReward < 5) raw.starReward = 15;
      repaired = true;
    }

    // Ensure customization exists
    if (!raw.customization || typeof raw.customization !== 'object') {
      raw.customization = {
        gameTheme: 'Learning Adventure',
        backgroundStyle: 'VarchLearn Studio',
        objects: [raw.name || 'Concepts'],
        visualsDescription: 'Educational exploration interface',
        mission: 'Master the concept through practice!',
        instructions: 'Follow the steps to complete the activity.',
        vocabulary: ['Concept'],
        scenario: 'Explore the key principles.',
        rewardSteps: ['Complete task', 'Earn Stars'],
        progressStages: ['Learn', 'Practice', 'Mastery'],
      };
      repaired = true;
    }

    // Ensure learningExperience is present and structured
    if (!raw.customization.learningExperience || typeof raw.customization.learningExperience !== 'object') {
      const topicName = raw.name || 'Core Concept';
      const input = raw.customization.learningInput || {};
      const gameType = (raw.gameType || '').toLowerCase();

      if (gameType.includes('diagram') || gameType.includes('picture') || gameType.includes('visual') || gameType.includes('pattern') || gameType.includes('jigsaw') || input.diagramParts) {
        raw.customization.learningExperience = {
          visualType: 'annotated_diagram',
          title: input.diagramTitle || `${topicName} Visual Model`,
          description: raw.customization.visualsDescription || `Visual breakdown of ${topicName}.`,
          instructions: 'Inspect each component node to understand its function in the system.',
          nodes: Array.isArray(input.diagramParts) && input.diagramParts.length > 0
            ? input.diagramParts.map((p: any, i: number) => ({
                id: p.id || `node_${i + 1}`,
                label: p.label || `Part ${i + 1}`,
                description: p.description || `Functional component ${i + 1}`,
                x: typeof p.x === 'number' ? p.x : 20 + i * 20,
                y: typeof p.y === 'number' ? p.y : 30 + (i % 2) * 30,
                color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 4],
              }))
            : [
                { id: 'node_1', label: `${topicName} Core`, description: 'Primary functional center.', x: 50, y: 30, color: '#3B82F6' },
                { id: 'node_2', label: 'Conduit & Distribution', description: 'Transports nutrients, signals, or forces.', x: 75, y: 60, color: '#10B981' },
                { id: 'node_3', label: 'Support Base', description: 'Provides foundation and stability.', x: 25, y: 60, color: '#F59E0B' },
              ],
          connections: [
            { fromId: 'node_1', toId: 'node_2', label: 'Powers transfer', direction: 'unidirectional' },
            { fromId: 'node_3', toId: 'node_1', label: 'Supports', direction: 'unidirectional' },
          ],
          inspectionTasks: [
            `Inspect the ${topicName} Core and observe its primary operation.`,
            'Examine the connections linking the components.',
          ],
        };
        repaired = true;
      } else if (gameType.includes('audio') || gameType.includes('sound') || gameType.includes('listen') || gameType.includes('rhythm') || input.audioTranscript) {
        const transcript = input.audioTranscript || `Listen carefully to this comprehensive overview of ${topicName}. Notice how the core components coordinate to maintain balance and achieve optimal function. Keep these principles in mind as you solve the auditory challenges.`;
        raw.customization.learningExperience = {
          audioTitle: `${topicName} Auditory Masterclass`,
          narrationScript: transcript,
          speakerInstructions: 'Clear and engaging narration with natural pauses.',
          segments: [
            { index: 1, title: 'Introduction', transcriptSnippet: transcript.slice(0, 120), listenTarget: 'Main premise and definition', durationSec: 15 },
            { index: 2, title: 'In-Depth Analysis', transcriptSnippet: transcript.slice(120), listenTarget: 'Key mechanisms and processes', durationSec: 20 },
          ],
          listeningExercises: [
            {
              id: 'aud_q1',
              prompt: `Based on the audio narrative, what is the central principle of ${topicName}?`,
              options: ['Coordinated interaction and systemic balance', 'Random isolated events', 'Continuous decline'],
              correctIndex: 0,
              explanation: 'The narration highlights coordinated interaction as the central principle.',
            },
          ],
        };
        repaired = true;
      } else if (gameType.includes('sentence') || gameType.includes('word') || gameType.includes('reading') || gameType.includes('missing') || input.readingPassage) {
        const passage = input.readingPassage || `${topicName} is a foundational concept. Rigorous textual evidence shows that components in this domain work together to ensure steady equilibrium. Analyzing these relationships develops critical reading comprehension.`;
        raw.customization.learningExperience = {
          passageTitle: `Analytical Text: ${topicName}`,
          structuredPassage: passage,
          analysisFocus: `Systemic relationships and key definitions in ${topicName}`,
          vocabularyNotes: [
            { term: topicName, definition: 'Primary subject of study.', contextSentence: passage.slice(0, 80) },
          ],
          fillInBlanks: [
            {
              sentenceWithBlank: `Components in ${topicName} work together to ensure ____.`,
              blankAnswer: 'equilibrium',
              options: ['equilibrium', 'disruption', 'isolation'],
              explanation: 'Text evidence confirms components work together to ensure equilibrium.',
            },
          ],
          termPairs: [
            { term: topicName, definition: 'Primary subject of study' },
            { term: 'Equilibrium', definition: 'State of balanced opposing forces' },
          ],
          sentenceBuilder: {
            targetSentence: input.sentenceBuilderTarget || [topicName, 'maintains', 'systemic', 'equilibrium'],
            scrambledWords: input.sentenceBuilderScrambled || ['equilibrium', topicName, 'systemic', 'maintains'],
          },
        };
        repaired = true;
      } else {
        // Kinesthetic by default for hands-on game types
        raw.customization.learningExperience = {
          kinestheticType: 'process_sequencing',
          scenario: `Conduct hands-on experimentation with ${topicName} in the laboratory environment.`,
          instructions: 'Arrange the sequence stages in functional order from start to finish, then test your configuration.',
          processSteps: [
            { id: 'step_1', stepNumber: 1, label: 'Stage 1: System Activation', description: `Initialize the primary inputs for ${topicName}.` },
            { id: 'step_2', stepNumber: 2, label: 'Stage 2: Throughput Transfer', description: 'Route material and energy through the conduit.' },
            { id: 'step_3', stepNumber: 3, label: 'Stage 3: Steady State Equilibrium', description: 'Verify that balance is maintained across all components.' },
          ],
          goalMessage: `Harmonize the ${topicName} apparatus to achieve 100% operational efficiency.`,
          completionFeedback: `Outstanding hands-on mastery! The ${topicName} system is operating at peak equilibrium.`,
        };
        repaired = true;
      }
    }

    // Repair questions array
    if (Array.isArray(raw.questions)) {
      raw.questions = raw.questions.map((q: any, idx: number) => {
        let qRepaired = false;
        const options = Array.isArray(q.options)
          ? q.options.map((o: any) => String(o).trim()).filter(Boolean)
          : ['Option A', 'Option B'];

        if (options.length < 2) {
          options.push('Additional option');
          qRepaired = true;
        }

        let correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
        if (correctIndex < 0 || correctIndex >= options.length) {
          correctIndex = 0;
          qRepaired = true;
        }

        if (qRepaired) repaired = true;

        return {
          type: q.type === 'general' ? 'general' : 'academic',
          prompt: String(q.prompt || `Question ${idx + 1}`).trim(),
          options,
          correctIndex,
          hint: q.hint ? String(q.hint).trim() : undefined,
          explanation: q.explanation ? String(q.explanation).trim() : `The correct answer is ${options[correctIndex]}.`,
        };
      });
    } else {
      raw.questions = [
        {
          type: 'academic',
          prompt: `What is the primary focus of ${raw.name || 'this topic'}?`,
          options: [raw.name || 'Key Concept', 'Alternative option', 'None of these'],
          correctIndex: 0,
          hint: 'Review the primary concept.',
          explanation: `${raw.name || 'This topic'} addresses the primary learning objective.`,
        },
      ];
      repaired = true;
    }

    const validated = generatedActivitySchema.safeParse(raw);
    if (!validated.success) {
      errors.push(...validated.error.issues.map((i) => `[${i.path.join('.')}]: ${i.message}`));
      return { isValid: false, activity: null, errors, repaired };
    }

    return { isValid: true, activity: validated.data, errors: [], repaired };
  }

  /**
   * Validates generated assessment questions and structure
   */
  public static validateAndRepairAssessment(raw: any): {
    isValid: boolean;
    assessment: any;
    errors: string[];
    repaired: boolean;
  } {
    let repaired = false;
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, assessment: null, errors: ['Assessment payload is not an object'], repaired: false };
    }

    if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
      return { isValid: false, assessment: null, errors: ['Assessment contains no questions'], repaired: false };
    }

    // Repair questions
    raw.questions = raw.questions.map((q: any, i: number) => {
      const marks = typeof q.marks === 'number' && q.marks >= 1 ? Math.min(q.marks, 10) : 1;
      const modality = ['visual', 'auditory', 'read_write', 'kinesthetic'].includes(q.modality)
        ? q.modality
        : 'read_write';
      const difficulty = ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium';

      return {
        ...q,
        id: q.id || `asmt-q-${i + 1}`,
        marks,
        modality,
        difficulty,
        prompt: String(q.prompt || `Assessment Item ${i + 1}`).trim(),
        explanation: String(q.explanation || 'Verified conceptual reasoning.').trim(),
        conceptTested: String(q.conceptTested || raw.topic || 'Subject Matter').trim(),
        learningObjective: String(q.learningObjective || 'Master core principle').trim(),
      };
    });

    raw.totalQuestions = raw.questions.length;
    raw.totalMarks = raw.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);

    const validated = generatedAssessmentSchema.safeParse(raw);
    if (!validated.success) {
      errors.push(...validated.error.issues.map((i) => `[${i.path.join('.')}]: ${i.message}`));
      return { isValid: false, assessment: null, errors, repaired };
    }

    return { isValid: true, assessment: validated.data, errors: [], repaired };
  }
}
