import { AiProviderService } from './aiProvider.service';
import { PROMPTS } from './promptTemplates';
import { GeneratedAssessmentPayload, generatedAssessmentSchema } from './generationSchemas';
import { QualityValidationService } from './qualityValidation.service';
import { ConceptMapPayload } from './generationSchemas';
import { DifficultyLevel } from '../../../../shared/types';

export interface AssessmentGenerationInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  conceptMap: ConceptMapPayload;
  questionCount?: number;
  difficulty?: DifficultyLevel;
  forceRefresh?: boolean;
}

export class AssessmentGenerationService {
  /**
   * Deterministic assessment builder for fallback or offline mode
   */
  public static buildDeterministicAssessment(input: AssessmentGenerationInput): GeneratedAssessmentPayload {
    const { className, subject, chapter, topic, conceptMap } = input;
    const diff = input.difficulty || 'Medium';

    const def0 = conceptMap.definitions[0] || { term: topic, definition: `Foundational study of ${topic}.` };
    const cause0 = conceptMap.causeAndEffect[0] || { cause: `Active operation in ${topic}`, effect: 'Systemic stability' };

    return {
      name: `${topic} — 4-Modality Mastery Diagnostic Assessment`,
      description: `A comprehensive assessment evaluating conceptual, structural, and analytical mastery of ${topic} across all 4 VARK modalities.`,
      className,
      subject,
      chapter,
      topic,
      totalQuestions: 4,
      totalMarks: 6,
      estimatedMinutes: 20,
      modalityCoverage: {
        visual: 1,
        auditory: 1,
        read_write: 1,
        kinesthetic: 1,
      },
      questions: [
        {
          id: 'asmt-q1',
          questionType: 'multiple_choice',
          modality: 'visual',
          difficulty: diff,
          marks: 1,
          prompt: `In an annotated diagram of ${topic}, which component constitutes the primary operational center?`,
          options: [
            def0.term,
            'Outer protective boundary only',
            'Passive inactive filler',
            'Unrelated background artifact',
          ],
          correctAnswer: def0.term,
          correctIndex: 0,
          hint: `Refer to the structural definition of ${def0.term}.`,
          explanation: `${def0.term} serves as the primary functional component as defined in the source textbook.`,
          conceptTested: def0.term,
          learningObjective: `Identify structural elements of ${topic} visually.`,
        },
        {
          id: 'asmt-q2',
          questionType: 'assertion_reasoning',
          modality: 'auditory',
          difficulty: diff,
          marks: 1,
          prompt: `Evaluate the following statement based on audio explanation principles:\nAssertion (A): ${cause0.cause} leads to ${cause0.effect}.\nReason (R): Coordinated scientific mechanisms govern systemic balance.`,
          options: [
            'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
            'Both (A) and (R) are true, but (R) is not the correct explanation of (A).',
            '(A) is true, but (R) is false.',
            'Both (A) and (R) are false.',
          ],
          correctAnswer: 'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
          correctIndex: 0,
          hint: 'Consider the cause-and-effect relationship between mechanism and balance.',
          explanation: `The assertion correctly states the cause-and-effect relationship, and the reason provides the valid scientific principle.`,
          conceptTested: 'Systemic Equilibrium',
          learningObjective: `Analyze cause-and-effect relationships from audio explanations.`,
        },
        {
          id: 'asmt-q3',
          questionType: 'short_answer_rubric',
          modality: 'read_write',
          difficulty: diff,
          marks: 3,
          prompt: `Based on your textual analysis, explain how ${def0.term} functions to maintain system stability in ${topic}. Provide at least two specific pieces of evidence.`,
          correctAnswer: `${def0.term} serves as the primary mechanism by driving operational activity and stabilizing interacting variables, ensuring system balance.`,
          hint: 'State the function clearly, then cite two structural or procedural pieces of evidence.',
          explanation: 'Full marks require defining the function and citing two concrete grounded evidence points.',
          conceptTested: 'Textual Evidence Synthesis',
          learningObjective: 'Synthesize textual evidence and justify conceptual conclusions in writing.',
          rubric: {
            criteria: 'Conceptual clarity and evidence grounding',
            fullMarksCondition: 'Accurately describes primary function and cites two specific supporting evidence points.',
            partialMarksCondition: 'Describes the function but provides only one evidence point or vague reasoning.',
            zeroMarksCondition: 'Fails to describe the function or presents factually contradicted claims.',
          },
        },
        {
          id: 'asmt-q4',
          questionType: 'ordering_sequence',
          modality: 'kinesthetic',
          difficulty: diff,
          marks: 1,
          prompt: `Arrange the interactive model assembly stages for ${topic} in the correct operational sequence:`,
          options: [
            '1. Anchor base component → 2. Connect transfer conduits → 3. Activate core mechanism',
            '1. Activate core mechanism → 2. Anchor base component → 3. Connect transfer conduits',
            '1. Connect transfer conduits → 2. Activate core mechanism → 3. Anchor base component',
          ],
          correctAnswer: '1. Anchor base component → 2. Connect transfer conduits → 3. Activate core mechanism',
          correctIndex: 0,
          hint: 'A physical system must be stabilized at its base before conduits and mechanisms are activated.',
          explanation: 'Correct physical assembly begins with anchoring the foundation, routing connections, and initiating active function.',
          conceptTested: 'Physical System Sequencing',
          learningObjective: 'Demonstrate operational sequencing of mechanisms.',
        },
      ],
    };
  }

  /**
   * Generates a comprehensive assessment with all modalities and question formats.
   */
  public static async generateAssessment(input: AssessmentGenerationInput): Promise<{
    assessment: GeneratedAssessmentPayload;
    isCached: boolean;
    source: string;
  }> {
    try {
      const prompt = PROMPTS.assessmentGeneration({
        className: input.className,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        conceptMap: input.conceptMap,
        questionCount: input.questionCount || 8,
        difficulty: input.difficulty || 'Medium',
      });

      const { data, isCached, model } = await AiProviderService.generateJson<GeneratedAssessmentPayload>(
        prompt,
        {
          temperature: 0.3,
          useCache: !input.forceRefresh,
        }
      );

      const validated = QualityValidationService.validateAndRepairAssessment(data);
      if (!validated.isValid || !validated.assessment) {
        console.warn('Assessment validation failed; falling back to grounded builder.', validated.errors);
        return {
          assessment: this.buildDeterministicAssessment(input),
          isCached: false,
          source: 'deterministic_fallback',
        };
      }

      return {
        assessment: validated.assessment,
        isCached,
        source: `groq (${model})`,
      };
    } catch (err: any) {
      console.warn(`Groq assessment generation failed (${err?.message}); using grounded builder.`);
      return {
        assessment: this.buildDeterministicAssessment(input),
        isCached: false,
        source: 'deterministic_fallback',
      };
    }
  }
}
