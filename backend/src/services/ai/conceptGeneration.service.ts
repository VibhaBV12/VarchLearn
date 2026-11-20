import { AiProviderService } from './aiProvider.service';
import { PROMPTS } from './promptTemplates';
import { ConceptExplanationPayload, conceptExplanationSchema, ConceptMapPayload } from './generationSchemas';
import { QualityValidationService } from './qualityValidation.service';

export interface ConceptExplanationInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  conceptMap: ConceptMapPayload;
  forceRefresh?: boolean;
}

export class ConceptGenerationService {
  public static buildDeterministicExplanation(input: ConceptExplanationInput): ConceptExplanationPayload {
    const { className, subject, topic, conceptMap } = input;
    return {
      title: `${topic} — Comprehensive Conceptual Overview`,
      gradeLevel: className,
      targetAudience: `Students of ${className} studying ${subject}`,
      summary: `An in-depth conceptual study of ${topic}, examining core definitions, functioning mechanisms, and environmental interactions.`,
      sections: [
        {
          heading: `Introduction & Core Principles of ${topic}`,
          content: `${topic} represents a fundamental component of the ${className} ${subject} syllabus. Understanding ${topic} involves recognizing how individual parts collaborate to establish systemic function. ${conceptMap.definitions[0]?.definition || ''}`,
          realWorldConnection: conceptMap.realWorldApplications[0] || 'Everyday observation in natural and physical phenomena.',
          keyTakeaway: `${topic} functions through organized, interconnected scientific mechanisms.`,
        },
        {
          heading: 'Processes, Sequences, and Cause-and-Effect',
          content: conceptMap.processesAndMechanisms[0]
            ? `The primary process is ${conceptMap.processesAndMechanisms[0].name}, which proceeds through systematic stages: ${conceptMap.processesAndMechanisms[0].steps.join(' → ')}. ${conceptMap.causeAndEffect[0]?.cause ? `When ${conceptMap.causeAndEffect[0].cause}, the immediate result is ${conceptMap.causeAndEffect[0].effect}.` : ''}`
            : `Detailed sequential progression governing ${topic}.`,
          realWorldConnection: conceptMap.realWorldApplications[1] || 'Industrial, environmental, and technological adaptations.',
          keyTakeaway: 'Predictable scientific laws govern every stage of the cycle.',
        },
      ],
      vocabularyHighlights: conceptMap.definitions.map((d) => ({
        term: d.term,
        meaning: d.definition,
      })),
      reviewCheckpoints: [
        `How do the structural elements of ${topic} contribute to its overall function?`,
        `What occurs when one of the operational variables is disrupted?`,
      ],
    };
  }

  public static async generateExplanation(input: ConceptExplanationInput): Promise<{
    explanation: ConceptExplanationPayload;
    isCached: boolean;
    source: string;
  }> {
    try {
      const prompt = PROMPTS.conceptExplanation({
        className: input.className,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        conceptMap: input.conceptMap,
      });

      const { data, isCached, model } = await AiProviderService.generateJson<ConceptExplanationPayload>(
        prompt,
        {
          temperature: 0.3,
          useCache: !input.forceRefresh,
        }
      );

      const validation = QualityValidationService.validateWithSchema(
        conceptExplanationSchema,
        data,
        'ConceptExplanation'
      );

      if (!validation.isValid || !validation.data) {
        return {
          explanation: this.buildDeterministicExplanation(input),
          isCached: false,
          source: 'deterministic_fallback',
        };
      }

      return {
        explanation: validation.data,
        isCached,
        source: `groq (${model})`,
      };
    } catch {
      return {
        explanation: this.buildDeterministicExplanation(input),
        isCached: false,
        source: 'deterministic_fallback',
      };
    }
  }
}
