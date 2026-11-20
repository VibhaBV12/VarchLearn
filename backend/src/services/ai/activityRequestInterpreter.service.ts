import { ModalityKey, DifficultyLevel, SupportedActivityType } from '../../../../shared/types';
import { ActivityRendererResolver } from './activityRendererResolver.service';

export interface InterpretedActivityRequest {
  topic: string;
  conceptTitle: string;
  className: string;
  subject: string;
  difficulty: DifficultyLevel;
  targetModality: ModalityKey;
  resolvedActivityType: SupportedActivityType;
  learningObjective: string;
  identifiedItems: string[];
  requiresImmediateFeedback: boolean;
  pedagogicalIntent: string;
  alternativeResolved?: {
    originalRequest: string;
    resolvedType: SupportedActivityType;
    reason: string;
  };
}

export class ActivityRequestInterpreter {
  /**
   * Interprets teacher free-text description and UI options into a clean, actionable execution plan
   */
  public static interpret(params: {
    teacherPrompt?: string;
    topic: string;
    concept?: string;
    className: string;
    subject: string;
    difficulty?: DifficultyLevel;
    modality?: ModalityKey;
    learningObjective?: string;
  }): InterpretedActivityRequest {
    const prompt = (params.teacherPrompt || '').trim();
    const promptLower = prompt.toLowerCase();
    const topic = params.topic.trim();
    const conceptTitle = params.concept || topic;
    const difficulty: DifficultyLevel = params.difficulty || 'Medium';

    // 1. Detect Modality Preference
    let detectedModality: ModalityKey = params.modality || 'visual';

    if (!params.modality && prompt) {
      if (
        promptLower.includes('drag') ||
        promptLower.includes('arrange') ||
        promptLower.includes('sequence') ||
        promptLower.includes('order') ||
        promptLower.includes('sort') ||
        promptLower.includes('categor') ||
        promptLower.includes('experiment') ||
        promptLower.includes('slider') ||
        promptLower.includes('hands-on') ||
        promptLower.includes('build')
      ) {
        detectedModality = 'kinesthetic';
      } else if (
        promptLower.includes('listen') ||
        promptLower.includes('audio') ||
        promptLower.includes('hear') ||
        promptLower.includes('sound') ||
        promptLower.includes('narration') ||
        promptLower.includes('spoken')
      ) {
        detectedModality = 'auditory';
      } else if (
        promptLower.includes('read') ||
        promptLower.includes('passage') ||
        promptLower.includes('write') ||
        promptLower.includes('vocab') ||
        promptLower.includes('blank') ||
        promptLower.includes('note') ||
        promptLower.includes('sentence')
      ) {
        detectedModality = 'read_write';
      } else if (
        promptLower.includes('diagram') ||
        promptLower.includes('label') ||
        promptLower.includes('picture') ||
        promptLower.includes('image') ||
        promptLower.includes('visual') ||
        promptLower.includes('map')
      ) {
        detectedModality = 'visual';
      }
    }

    // 2. Resolve Specific Supported Activity Type
    let requestedTypeString = '';
    if (promptLower.includes('drag') && (promptLower.includes('order') || promptLower.includes('sequence') || promptLower.includes('stage'))) {
      requestedTypeString = 'process_sequencing';
    } else if (promptLower.includes('drag') || promptLower.includes('workbench') || promptLower.includes('assemble')) {
      requestedTypeString = 'drag_and_drop_assembly';
    } else if (promptLower.includes('sort') || promptLower.includes('categor') || promptLower.includes('bucket')) {
      requestedTypeString = 'sorting_categorisation';
    } else if (promptLower.includes('simulat') || promptLower.includes('variable') || promptLower.includes('slider') || promptLower.includes('experiment')) {
      requestedTypeString = 'variable_simulation';
    } else if (promptLower.includes('label') || promptLower.includes('diagram')) {
      requestedTypeString = 'diagram_labelling';
    } else if (promptLower.includes('listen') && (promptLower.includes('sequence') || promptLower.includes('order'))) {
      requestedTypeString = 'listen_and_sequence';
    } else if (promptLower.includes('listen') || promptLower.includes('audio')) {
      requestedTypeString = 'listen_and_identify';
    } else if (promptLower.includes('blank') || promptLower.includes('missing')) {
      requestedTypeString = 'fill_missing_info';
    } else if (promptLower.includes('read') || promptLower.includes('passage')) {
      requestedTypeString = 'reading_comprehension';
    } else if (promptLower.includes('match') || promptLower.includes('connect')) {
      requestedTypeString = detectedModality === 'read_write' ? 'vocabulary_matching' : 'visual_matching';
    }

    const resolution = ActivityRendererResolver.resolveRenderer(requestedTypeString, detectedModality);

    // 3. Extract items/stages explicitly mentioned in the teacher prompt
    const identifiedItems: string[] = [];
    // e.g. "stages of evaporation, condensation and precipitation"
    const stagesMatch = prompt.match(/(?:stages? of|components? of|parts? of|including|such as)\s+([^.]+)/i);
    if (stagesMatch && stagesMatch[1]) {
      const rawList = stagesMatch[1]
        .replace(/and\s+/gi, ',')
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && !s.toLowerCase().includes('immediate') && !s.toLowerCase().includes('feedback'));
      identifiedItems.push(...rawList);
    }

    // 4. Formulate Learning Objective
    const learningObjective =
      params.learningObjective ||
      (prompt
        ? `Enable students to master ${conceptTitle} through hands-on ${resolution.activityType.replace(/_/g, ' ')}.`
        : `Demonstrate mastery of core principles and systemic relationships in ${conceptTitle}.`);

    const requiresImmediateFeedback =
      promptLower.includes('immediate feedback') ||
      promptLower.includes('instant feedback') ||
      promptLower.includes('feedback on match') ||
      true; // Default to interactive immediate feedback

    return {
      topic,
      conceptTitle,
      className: params.className,
      subject: params.subject,
      difficulty,
      targetModality: resolution.modality,
      resolvedActivityType: resolution.activityType,
      learningObjective,
      identifiedItems,
      requiresImmediateFeedback,
      pedagogicalIntent: prompt || `Standard curriculum activity for ${conceptTitle} using ${resolution.activityType}.`,
      alternativeResolved: resolution.alternativeResolved,
    };
  }
}
