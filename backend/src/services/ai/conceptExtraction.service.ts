import { AiProviderService } from './aiProvider.service';
import { PROMPTS } from './promptTemplates';
import { ConceptMapPayload, conceptMapSchema } from './generationSchemas';
import { QualityValidationService } from './qualityValidation.service';
import { AppError } from '../../middleware/errorHandler';

export interface ConceptExtractionInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  excerpt: string;
  forceRefresh?: boolean;
}

export class ConceptExtractionService {
  /**
   * Deterministic grounded concept fallback builder when AI provider is in fallback mode.
   */
  public static buildDeterministicConceptMap(input: ConceptExtractionInput): ConceptMapPayload {
    const { className, subject, chapter, topic, excerpt } = input;
    const lines = excerpt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 10);

    const primaryConcepts = [
      topic,
      ...(lines.slice(0, 3).map((l) => l.split(/[:.]/)[0].trim()).filter((s) => s.length > 3 && s.length < 35)),
    ].slice(0, 4);

    return {
      topicTitle: topic,
      gradeLevel: className,
      subject,
      mainConcepts: primaryConcepts.length > 0 ? primaryConcepts : [topic, `${subject} Core Concept`],
      supportingConcepts: [
        `Structure and functionality in ${topic}`,
        `Environmental and operational factors influencing ${topic}`,
      ],
      definitions: [
        {
          term: topic,
          definition: lines[0] || `${topic} is a foundational concept in ${className} ${subject}.`,
          example: `Practical observation of ${topic} in everyday environments.`,
        },
        {
          term: 'Functionality & Interaction',
          definition: lines[1] || 'The mechanism through which components interact and sustain their purpose.',
          example: 'Systemic operation and balance.',
        },
      ],
      keyTerminology: [topic, subject, 'Mechanism', 'Process', 'System'],
      processesAndMechanisms: [
        {
          name: `${topic} Operation Cycle`,
          steps: [
            lines[0]?.slice(0, 60) || 'Initial intake or stimulus',
            lines[1]?.slice(0, 60) || 'Internal transfer and transformation',
            lines[2]?.slice(0, 60) || 'Output generation or stabilization',
          ],
          significance: `Enables predictable function in ${topic}.`,
        },
      ],
      causeAndEffect: [
        {
          cause: `Balanced operation of ${topic}`,
          effect: 'Optimal functioning and systemic equilibrium.',
        },
        {
          cause: `Deficiency or disruption in key variables`,
          effect: 'Impaired progression or altered performance.',
        },
      ],
      sequencesAndStages: [
        {
          sequenceName: `${topic} Progression Sequence`,
          orderedStages: ['Stage 1: Inception', 'Stage 2: Active Growth/Transfer', 'Stage 3: Full Maturation/Equilibrium'],
        },
      ],
      comparisons: [
        {
          itemA: 'Primary Component',
          itemB: 'Supporting Component',
          differenceOrRelation: 'Primary components drive the core mechanism, while supporting components provide structural or transport stabilization.',
        },
      ],
      realWorldApplications: [
        `Application of ${topic} in environmental and industrial systems.`,
        `Daily human and natural reliance on ${topic} mechanisms.`,
      ],
      importantFacts: [
        `${topic} forms a fundamental unit of study in ${className} ${subject}.`,
        lines[0] || `${topic} operates in conjunction with surrounding biological or physical laws.`,
      ],
      misconceptions: [
        {
          misconception: `${topic} occurs instantaneously without intermediate processes.`,
          correction: `${topic} consists of coordinated multi-stage biochemical or physical interactions.`,
        },
      ],
      learningObjectives: [
        `Identify and describe the structural elements of ${topic}.`,
        `Explain the cause-and-effect mechanisms operating within ${topic}.`,
        `Apply knowledge of ${topic} to solve unfamiliar real-world scenarios.`,
      ],
      recommendedDiagrams: [
        `Annotated cross-section of ${topic}`,
        `Flowchart of ${topic} process sequence`,
      ],
    };
  }

  /**
   * Extracts grounded concepts from the textbook text using Groq or deterministic fallback.
   */
  public static async extractConcepts(input: ConceptExtractionInput): Promise<{
    conceptMap: ConceptMapPayload;
    isCached: boolean;
    source: string;
  }> {
    if (!input.excerpt || input.excerpt.trim().length < 20) {
      throw new AppError('Textbook content excerpt is required to extract concepts.', 400);
    }

    try {
      const prompt = PROMPTS.conceptExtraction({
        className: input.className,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        excerpt: input.excerpt,
      });

      const { data, isCached, model } = await AiProviderService.generateJson<ConceptMapPayload>(
        prompt,
        {
          temperature: 0.2, // Low temperature for high factual precision
          useCache: !input.forceRefresh,
        }
      );

      const validation = QualityValidationService.validateWithSchema(
        conceptMapSchema,
        data,
        'ConceptMap'
      );

      if (!validation.isValid || !validation.data) {
        console.warn('Concept extraction schema mismatch; falling back to deterministic synthesis.', validation.errors);
        return {
          conceptMap: this.buildDeterministicConceptMap(input),
          isCached: false,
          source: 'deterministic_fallback',
        };
      }

      return {
        conceptMap: validation.data,
        isCached,
        source: `groq (${model})`,
      };
    } catch (err: any) {
      console.warn(`Groq concept extraction failed (${err?.message}); using grounded deterministic builder.`);
      return {
        conceptMap: this.buildDeterministicConceptMap(input),
        isCached: false,
        source: 'deterministic_fallback',
      };
    }
  }
}
