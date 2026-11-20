import { SupportedActivityType, ActivityRendererType, ModalityKey } from '../../../../shared/types';

export interface RendererResolutionResult {
  activityType: SupportedActivityType;
  rendererType: ActivityRendererType;
  modality: ModalityKey;
  alternativeResolved?: {
    originalRequest: string;
    resolvedType: SupportedActivityType;
    reason: string;
  };
}

export class ActivityRendererResolver {
  /**
   * Registry mapping each supported activity type to its student-side renderer component
   */
  private static readonly RENDERER_MAP: Record<SupportedActivityType, ActivityRendererType> = {
    // Visual
    diagram_labelling: 'DiagramLabelRenderer',
    diagram_completion: 'DiagramLabelRenderer',
    visual_matching: 'VisualMatchingRenderer',
    concept_map_completion: 'DiagramLabelRenderer',
    flowchart_construction: 'DiagramLabelRenderer',

    // Auditory
    listen_and_identify: 'ListeningComprehensionRenderer',
    listen_and_sequence: 'AudioSequenceRenderer',
    listen_and_complete: 'ListeningComprehensionRenderer',
    spoken_explanation: 'ListeningComprehensionRenderer',

    // Read/Write
    reading_comprehension: 'ReadingChallengeRenderer',
    fill_missing_info: 'FillBlankRenderer',
    vocabulary_matching: 'VisualMatchingRenderer',
    sentence_building: 'FillBlankRenderer',
    note_completion: 'ReadingChallengeRenderer',

    // Kinesthetic
    drag_and_drop_assembly: 'DragDropRenderer',
    process_sequencing: 'SequenceBuilderRenderer',
    sorting_categorisation: 'SortingRenderer',
    variable_simulation: 'VariableSimulationRenderer',
  };

  /**
   * Modality affinity for each activity type
   */
  private static readonly MODALITY_MAP: Record<SupportedActivityType, ModalityKey> = {
    diagram_labelling: 'visual',
    diagram_completion: 'visual',
    visual_matching: 'visual',
    concept_map_completion: 'visual',
    flowchart_construction: 'visual',

    listen_and_identify: 'auditory',
    listen_and_sequence: 'auditory',
    listen_and_complete: 'auditory',
    spoken_explanation: 'auditory',

    reading_comprehension: 'read_write',
    fill_missing_info: 'read_write',
    vocabulary_matching: 'read_write',
    sentence_building: 'read_write',
    note_completion: 'read_write',

    drag_and_drop_assembly: 'kinesthetic',
    process_sequencing: 'kinesthetic',
    sorting_categorisation: 'kinesthetic',
    variable_simulation: 'kinesthetic',
  };

  /**
   * Checks if an activity type is currently implemented and supported
   */
  public static isSupported(activityType: string): activityType is SupportedActivityType {
    return Object.prototype.hasOwnProperty.call(this.RENDERER_MAP, activityType);
  }

  /**
   * Resolves an activity type to its renderer. If unsupported, maps to the closest supported type
   * while preserving teacher intent, and flags the alternative. Never silently replaces with MCQ!
   */
  public static resolveRenderer(
    requestedType: string,
    requestedModality?: ModalityKey
  ): RendererResolutionResult {
    const normalized = requestedType.toLowerCase().trim().replace(/[\s-]+/g, '_');

    if (this.isSupported(normalized as SupportedActivityType)) {
      const type = normalized as SupportedActivityType;
      return {
        activityType: type,
        rendererType: this.RENDERER_MAP[type],
        modality: requestedModality || this.MODALITY_MAP[type],
      };
    }

    // Intelligent pedagogical mapping for unsupported or descriptive requests
    let resolvedType: SupportedActivityType = 'diagram_labelling';
    let targetModality: ModalityKey = requestedModality || 'visual';
    let reason = '';

    if (normalized.includes('drag') || normalized.includes('drop') || normalized.includes('assemble')) {
      resolvedType = 'drag_and_drop_assembly';
      targetModality = 'kinesthetic';
      reason = 'Resolved interactive drag/drop request to Kinesthetic DragDropRenderer.';
    } else if (normalized.includes('sequence') || normalized.includes('order') || normalized.includes('cycle') || normalized.includes('timeline')) {
      resolvedType = 'process_sequencing';
      targetModality = 'kinesthetic';
      reason = 'Resolved stage ordering request to Kinesthetic SequenceBuilderRenderer.';
    } else if (normalized.includes('sort') || normalized.includes('categor') || normalized.includes('bucket') || normalized.includes('classify')) {
      resolvedType = 'sorting_categorisation';
      targetModality = 'kinesthetic';
      reason = 'Resolved categorization request to Kinesthetic SortingRenderer.';
    } else if (normalized.includes('simulat') || normalized.includes('experiment') || normalized.includes('variable') || normalized.includes('slider')) {
      resolvedType = 'variable_simulation';
      targetModality = 'kinesthetic';
      reason = 'Resolved variable experiment request to Kinesthetic VariableSimulationRenderer.';
    } else if (normalized.includes('audio') || normalized.includes('listen') || normalized.includes('hear') || normalized.includes('sound')) {
      resolvedType = 'listen_and_identify';
      targetModality = 'auditory';
      reason = 'Resolved listening task to Auditory ListeningComprehensionRenderer.';
    } else if (normalized.includes('read') || normalized.includes('passage') || normalized.includes('comprehension')) {
      resolvedType = 'reading_comprehension';
      targetModality = 'read_write';
      reason = 'Resolved textual reading task to Read/Write ReadingChallengeRenderer.';
    } else if (normalized.includes('blank') || normalized.includes('missing') || normalized.includes('cloze')) {
      resolvedType = 'fill_missing_info';
      targetModality = 'read_write';
      reason = 'Resolved missing word challenge to Read/Write FillBlankRenderer.';
    } else if (normalized.includes('match') || normalized.includes('connect') || normalized.includes('pair')) {
      resolvedType = 'visual_matching';
      targetModality = 'visual';
      reason = 'Resolved matching request to Visual Matching Renderer.';
    } else {
      // Default based on modality
      switch (targetModality) {
        case 'auditory':
          resolvedType = 'spoken_explanation';
          reason = 'Defaulted to spoken audio masterclass with listening comprehension.';
          break;
        case 'read_write':
          resolvedType = 'reading_comprehension';
          reason = 'Defaulted to structured reading passage challenge.';
          break;
        case 'kinesthetic':
          resolvedType = 'drag_and_drop_assembly';
          reason = 'Defaulted to interactive hands-on drag and drop workbench.';
          break;
        case 'visual':
        default:
          resolvedType = 'diagram_labelling';
          reason = 'Defaulted to interactive visual diagram exploration and labelling.';
          break;
      }
    }

    return {
      activityType: resolvedType,
      rendererType: this.RENDERER_MAP[resolvedType],
      modality: targetModality,
      alternativeResolved: {
        originalRequest: requestedType,
        resolvedType,
        reason,
      },
    };
  }

  /**
   * Returns all supported activity types grouped by modality
   */
  public static getSupportedTypesByModality(): Record<ModalityKey, SupportedActivityType[]> {
    return {
      visual: [
        'diagram_labelling',
        'diagram_completion',
        'visual_matching',
        'concept_map_completion',
        'flowchart_construction',
      ],
      auditory: [
        'listen_and_identify',
        'listen_and_sequence',
        'listen_and_complete',
        'spoken_explanation',
      ],
      read_write: [
        'reading_comprehension',
        'fill_missing_info',
        'vocabulary_matching',
        'sentence_building',
        'note_completion',
      ],
      kinesthetic: [
        'drag_and_drop_assembly',
        'process_sequencing',
        'sorting_categorisation',
        'variable_simulation',
      ],
    };
  }
}
