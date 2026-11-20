import { AiProviderService } from './aiProvider.service';
import { PROMPTS } from './promptTemplates';
import {
  AllModalitiesPayload,
  allModalitiesRepresentationSchema,
  ConceptMapPayload,
  visualRepresentationSchema,
  auditoryRepresentationSchema,
  readWriteRepresentationSchema,
  kinestheticRepresentationSchema,
} from './generationSchemas';
import { QualityValidationService } from './qualityValidation.service';
import { ModalityKey } from '../../../../shared/types';

export interface ModalityGenerationInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  conceptMap: ConceptMapPayload;
  forceRefresh?: boolean;
}

export class ModalityGenerationService {
  /**
   * Deterministic multimodal fallback builder grounded in the concept map.
   */
  public static buildDeterministicModalities(input: ModalityGenerationInput): AllModalitiesPayload {
    const { className, topic, conceptMap } = input;
    const defs = conceptMap.definitions;

    const visualElements = defs.slice(0, 4).map((d, idx) => ({
      id: `elem_${idx + 1}`,
      label: d.term,
      description: d.definition,
      x: 20 + (idx % 2) * 50,
      y: 20 + Math.floor(idx / 2) * 45,
      role: idx === 0 ? 'Core Anchor' : 'Functional Component',
    }));

    return {
      topicTitle: topic,
      gradeLevel: className,
      visual: {
        title: `${topic} — Functional Concept Diagram`,
        diagramType: 'annotated_diagram',
        description: `Visual model illustrating the structure, placement, and relationships of ${topic}.`,
        elements: visualElements.length >= 2 ? visualElements : [
          { id: 'elem_1', label: `${topic} Core`, description: 'Primary mechanism', x: 50, y: 30, role: 'Center' },
          { id: 'elem_2', label: 'Surrounding System', description: 'Contextual environment', x: 50, y: 70, role: 'Base' },
        ],
        connections: [
          { from: 'elem_1', to: 'elem_2', label: 'coordinates with' },
        ],
        svgSpecification: {
          viewBox: '0 0 100 100',
          themeColor: '#7041C6',
          instructions: 'Tap each interactive component on the diagram to inspect its role.',
        },
      },
      auditory: {
        title: `${topic} — Spoken Narrative & Guided Audio Analysis`,
        narrationScript: `Welcome to the Audio Masterclass on ${topic}. ${conceptMap.definitions[0]?.definition || ''} Observe how every mechanism operates in harmony. ${conceptMap.causeAndEffect[0] ? `Notice that when ${conceptMap.causeAndEffect[0].cause}, the immediate result is ${conceptMap.causeAndEffect[0].effect}.` : ''} Listen closely to these foundational principles to answer the reasoning challenges that follow.`,
        speakerInstructions: 'Engaging, clear delivery at a measured tempo with distinct pauses after core terms.',
        audioSegments: [
          {
            index: 1,
            title: 'Concept Foundation',
            transcriptSnippet: conceptMap.definitions[0]?.definition || `${topic} forms the foundation of this study.`,
            soundCue: 'soft chime',
            keyListenFor: 'Key definition and primary function',
          },
          {
            index: 2,
            title: 'System Dynamics & Outcomes',
            transcriptSnippet: conceptMap.causeAndEffect[0]?.effect || 'Systemic equilibrium is achieved through organized interaction.',
            soundCue: 'resonant bell',
            keyListenFor: 'Cause and effect relationships',
          },
        ],
        listeningQuestions: [
          {
            prompt: `According to the spoken narration, what is the primary role of ${topic}?`,
            options: [
              conceptMap.definitions[0]?.term || topic,
              'Irrelevant background noise',
              'An unrelated mechanical process',
            ],
            correctIndex: 0,
            hint: 'Recall the first segment of the audio explanation.',
            explanation: `The audio passage explicitly defined ${conceptMap.definitions[0]?.term || topic} as the primary functioning unit.`,
          },
        ],
      },
      readWrite: {
        title: `${topic} — Close Reading, Analysis & Evidence`,
        readingPassage: `${topic} is central to our understanding of ${className} ${input.subject}. As documented in scientific inquiry, ${conceptMap.definitions[0]?.definition || ''} Furthermore, ${conceptMap.importantFacts[0] || 'coordinated mechanisms govern the cycle'}. When observing real-world systems, ${conceptMap.realWorldApplications[0] || 'we witness these principles in everyday life'}. Students must distinguish between evidence-backed facts and common misconceptions.`,
        analysisFocus: 'Synthesizing evidence-based conclusions from technical text',
        evidenceQuestions: [
          {
            prompt: `Based on the reading passage, what evidence confirms the operation of ${topic}?`,
            evidenceSentenceInPassage: conceptMap.definitions[0]?.definition || `${topic} operates systematically.`,
            options: [
              conceptMap.definitions[0]?.definition || `${topic} maintains operational equilibrium.`,
              'The system operates without any regular laws or mechanisms.',
              'No evidence exists in the provided text.',
            ],
            correctIndex: 0,
            explanation: 'The passage directly provides this conceptual definition as documented evidence.',
          },
        ],
        sentenceBuilderTarget: [topic, 'operates', 'through', 'structured', 'stages'],
        sentenceBuilderScrambled: ['structured', topic, 'stages', 'through', 'operates'],
        fillInTheBlanks: [
          {
            sentenceWithBlank: `The primary function of ${topic} is ____.`,
            blankAnswer: conceptMap.keyTerminology[0] || topic,
            options: [conceptMap.keyTerminology[0] || topic, 'static', 'unrelated'],
            explanation: 'Grounded directly in the passage terminology.',
          },
        ],
      },
      kinesthetic: {
        title: `${topic} — Interactive System Assembly & Sandbox`,
        activityFormat: 'model_assembly',
        scenario: `Construct and test a working model of ${topic} by assembling its active components and balancing environmental parameters.`,
        interactiveComponents: conceptMap.definitions.slice(0, 4).map((d, i) => ({
          id: `comp_${i + 1}`,
          name: d.term,
          categoryOrSlot: `slot_${i + 1}`,
          description: d.definition,
          behaviorOnInteract: 'Locks into the designated system slot upon correct alignment',
        })),
        slotsOrZones: conceptMap.definitions.slice(0, 4).map((d, i) => ({
          id: `slot_${i + 1}`,
          label: `${d.term} Zone`,
          expectedComponentId: `comp_${i + 1}`,
          feedbackOnMatch: `Correctly assembled ${d.term}!`,
        })),
        simulationVariables: [
          {
            name: 'activity_rate',
            label: 'Operational Rate',
            min: 1,
            max: 3,
            initial: 1,
            optimalValue: 2,
            unit: 'intensity',
            explanation: 'Level 2 represents optimal balanced conditions.',
          },
        ],
        challengeTasks: [
          {
            taskPrompt: `Assemble all core parts of ${topic} on the workbench, then set Operational Rate to Level 2.`,
            targetState: 'System fully functional and balanced',
            successMessage: `Outstanding! You successfully assembled the ${topic} model and achieved equilibrium!`,
          },
        ],
      },
    };
  }

  /**
   * Generates all 4 modalities in a single AI request (highly token-efficient).
   */
  public static async generateAllModalities(input: ModalityGenerationInput): Promise<{
    modalities: AllModalitiesPayload;
    isCached: boolean;
    source: string;
  }> {
    try {
      const prompt = PROMPTS.fourModalities({
        className: input.className,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        conceptMap: input.conceptMap,
      });

      const { data, isCached, model } = await AiProviderService.generateJson<AllModalitiesPayload>(
        prompt,
        {
          temperature: 0.35,
          useCache: !input.forceRefresh,
        }
      );

      const validation = QualityValidationService.validateWithSchema(
        allModalitiesRepresentationSchema,
        data,
        'AllModalities'
      );

      if (!validation.isValid || !validation.data) {
        return {
          modalities: this.buildDeterministicModalities(input),
          isCached: false,
          source: 'deterministic_fallback',
        };
      }

      return {
        modalities: validation.data,
        isCached,
        source: `groq (${model})`,
      };
    } catch {
      return {
        modalities: this.buildDeterministicModalities(input),
        isCached: false,
        source: 'deterministic_fallback',
      };
    }
  }
}
