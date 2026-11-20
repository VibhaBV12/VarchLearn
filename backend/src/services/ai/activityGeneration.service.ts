import { AiProviderService } from './aiProvider.service';
import { PROMPTS } from './promptTemplates';
import { GeneratedActivityData, generatedActivitySchema } from './generationSchemas';
import { QualityValidationService } from './qualityValidation.service';
import { DifficultyAdaptationService } from './difficultyAdaptation.service';
import { ActivityCategory, DifficultyLevel, ModalityKey } from '../../../../shared/types';
import { MODALITY_META } from '../../../../shared/constants/theme';
import { AppError } from '../../middleware/errorHandler';

export interface ActivityGenerationInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic?: string;
  modality: ModalityKey;
  category: ActivityCategory;
  difficulty: DifficultyLevel;
  chapterContext?: string;
  forceRefresh?: boolean;
}

export class ActivityGenerationService {
  /**
   * Deterministic activity builder for fallback or offline mode
   */
  public static buildGroundedFallbackActivity(input: ActivityGenerationInput): GeneratedActivityData {
    const { className, subject, chapter, topic, subtopic, modality, category, difficulty, chapterContext } = input;
    const meta = MODALITY_META[modality];
    const profile = DifficultyAdaptationService.getAdaptationProfile(className, difficulty);

    const gameTypeByModality: Record<ModalityKey, string> = {
      visual: category === 'question_sets' ? 'Question Set' : 'Diagram Detective',
      auditory: category === 'question_sets' ? 'Question Set' : 'Audio Quiz',
      read_write: category === 'question_sets' ? 'Question Set' : 'Sentence Builder',
      kinesthetic: category === 'question_sets' ? 'Question Set' : 'Model Builder',
    };

    const gameType = gameTypeByModality[modality];

    // Modality-specific rich learning input and two-phase learning experience
    const learningInput: any = {};
    let learningExperience: any = undefined;

    if (modality === 'visual') {
      learningInput.diagramTitle = `${topic} Structural Model`;
      learningInput.diagramParts = [
        { id: 'part_core', label: `${topic} Core`, description: `The primary functional center of ${topic}.`, x: 50, y: 25 },
        { id: 'part_transfer', label: 'Transfer Mechanism', description: 'Transports nutrients, signals, or forces across the structure.', x: 75, y: 50 },
        { id: 'part_support', label: 'Support Base', description: 'Anchors the system and stabilizes overall balance.', x: 25, y: 50 },
        { id: 'part_boundary', label: 'Boundary Layer', description: 'Regulates exchange with the surrounding environment.', x: 50, y: 80 },
      ];
      learningExperience = {
        visualType: 'annotated_diagram',
        title: `${topic} Structural Model`,
        description: `Detailed structural layout of ${topic} based on ${chapter}.`,
        instructions: 'Tap and inspect each component node to understand its function in the system.',
        nodes: [
          { id: 'part_core', label: `${topic} Core`, description: `The primary functional engine and center of ${topic}.`, x: 50, y: 25, color: '#3B82F6' },
          { id: 'part_transfer', label: 'Transfer Mechanism', description: 'Transports essential energy, signals, or nutrients throughout.', x: 75, y: 50, color: '#10B981' },
          { id: 'part_support', label: 'Support Base', description: 'Provides stability and anchors the entire physical system.', x: 25, y: 50, color: '#F59E0B' },
          { id: 'part_boundary', label: 'Boundary Layer', description: 'Regulates exchange with the surrounding environment.', x: 50, y: 80, color: '#8B5CF6' },
        ],
        connections: [
          { fromId: 'part_core', toId: 'part_transfer', label: 'Powers transfer', direction: 'unidirectional' },
          { fromId: 'part_support', toId: 'part_core', label: 'Anchors', direction: 'unidirectional' },
          { fromId: 'part_transfer', toId: 'part_boundary', label: 'Delivers to', direction: 'unidirectional' },
        ],
        inspectionTasks: [
          `Inspect the ${topic} Core and note how it coordinates system output.`,
          'Examine the Transfer Mechanism and observe where material flows.',
          'Check the Support Base to see how equilibrium is preserved.',
        ],
        challenge: {
          prompt: `Which node serves as the primary functional center in ${topic}?`,
          targetNodeId: 'part_core',
          options: [
            { id: 'part_core', label: `${topic} Core` },
            { id: 'part_boundary', label: 'Boundary Layer' },
            { id: 'part_support', label: 'Support Base' },
          ],
        },
      };
    } else if (modality === 'auditory') {
      const audioScript = `Listen carefully to Echo's guide on ${topic}. In ${chapter}, ${topic} operates through distinct, interconnected mechanisms. First, note that ${topic} requires coordinated balance to function properly. Second, observe how inputs are converted into useful functional work. Finally, notice that any disruption to the core elements causes downstream instability. Keep these three principles in mind as you answer the challenge questions.`;
      learningInput.audioTranscript = audioScript;
      learningInput.audioSegments = [
        { index: 1, title: 'Concept Introduction', snippet: `Introduction to ${topic}` },
        { index: 2, title: 'Functional Principles', snippet: 'Mechanisms and interactions' },
        { index: 3, title: 'System Stability', snippet: 'Conditions required for system equilibrium' },
      ];
      learningExperience = {
        audioTitle: `Audio Masterclass: ${topic}`,
        narrationScript: audioScript,
        speakerInstructions: 'Deliver in an articulate, engaging documentary voice with deliberate pauses before key terms.',
        segments: [
          {
            index: 1,
            title: `Introduction to ${topic}`,
            transcriptSnippet: `In ${className} ${subject}, ${topic} is governed by coordinated interactions across its key parts.`,
            soundCue: 'chime',
            listenTarget: 'Core definition and role of the mechanism',
            durationSec: 15,
          },
          {
            index: 2,
            title: 'Mechanisms and Flow',
            transcriptSnippet: 'Energy and material flow systematically from the source into the active conversion zones.',
            soundCue: 'pulse',
            listenTarget: 'Direction and path of energy flow',
            durationSec: 20,
          },
          {
            index: 3,
            title: 'System Stability and Equilibrium',
            transcriptSnippet: 'When the primary conduit stabilizes, the overall system maintains sustainable equilibrium.',
            soundCue: 'bell',
            listenTarget: 'Conditions required for system equilibrium',
            durationSec: 18,
          },
        ],
        listeningExercises: [
          {
            id: 'aud_ex_1',
            prompt: `According to the audio narration, what is required for ${topic} to operate stably?`,
            requiredSegmentIndex: 3,
            options: [
              'Sustainable equilibrium maintained through coordinated balance',
              'Complete isolation from any external interactions',
              'Continuous random fluctuations without control',
            ],
            correctIndex: 0,
            explanation: 'Segment 3 emphasizes that coordinated balance maintains sustainable equilibrium.',
          },
        ],
        recapScript: `In summary, ${topic} balances input, processing, and output to maintain steady equilibrium.`,
      };
    } else if (modality === 'read_write') {
      const passage = `${topic} is an essential unit of study in ${className} ${subject}. Scientific observation from ${chapter} shows that components within ${topic} work cooperatively to ensure equilibrium. Understanding these relationships allows us to analyze complex systems with precision. When one element undergoes stress, compensatory mechanisms activate to restore stability.`;
      learningInput.readingPassage = passage;
      learningInput.sentenceBuilderTarget = [topic, 'maintains', 'systemic', 'equilibrium'];
      learningInput.sentenceBuilderScrambled = ['equilibrium', topic, 'systemic', 'maintains'];
      learningExperience = {
        passageTitle: `Analytical Study: ${topic}`,
        structuredPassage: passage,
        analysisFocus: `Mechanisms of balance and interdependence in ${topic}`,
        vocabularyNotes: [
          {
            term: `${topic} Core`,
            definition: `The central active operational unit within ${topic}.`,
            contextSentence: `The central core initiates primary activities across the system.`,
          },
          {
            term: 'Equilibrium',
            definition: 'A state of physical or chemical balance where opposing forces neutralize each other.',
            contextSentence: 'Feedback mechanisms trigger compensatory reactions to restore equilibrium.',
          },
          {
            term: 'Interdependence',
            definition: 'Mutual reliance between multiple components for system viability.',
            contextSentence: 'Stability depends upon mutual interdependence.',
          },
        ],
        fillInBlanks: [
          {
            sentenceWithBlank: `Components within ${topic} work cooperatively to ensure ____.`,
            blankAnswer: 'equilibrium',
            options: ['chaos', 'equilibrium', 'separation'],
            explanation: 'The passage explicitly states that components work cooperatively to ensure equilibrium.',
          },
          {
            sentenceWithBlank: 'When one element undergoes stress, ____ mechanisms activate.',
            blankAnswer: 'compensatory',
            options: ['destructive', 'compensatory', 'random'],
            explanation: 'The text notes that compensatory mechanisms activate to restore stability.',
          },
        ],
        termPairs: [
          { term: `${topic} Core`, definition: 'Initiates primary system activities' },
          { term: 'Compensatory', definition: 'Restores balance when stress occurs' },
          { term: 'Equilibrium', definition: 'State of balanced opposing forces' },
        ],
        sentenceBuilder: {
          targetSentence: [topic, 'maintains', 'systemic', 'equilibrium'],
          scrambledWords: ['equilibrium', topic, 'systemic', 'maintains'],
          contextHint: 'Reconstruct the core thesis statement from the reading passage.',
        },
      };
    } else if (modality === 'kinesthetic') {
      learningInput.interactiveModelParts = [`${topic} Core`, 'Transfer Conduit', 'Anchor Base'];
      learningInput.simulationVariables = [
        { name: 'balance_level', label: 'System Balance', min: 1, max: 3, initial: 1, optimalValue: 2 },
      ];
      learningExperience = {
        kinestheticType: 'process_sequencing',
        scenario: `You are in charge of assembling and regulating the ${topic} mechanism in the lab. Follow the physical sequence to ensure smooth operations.`,
        instructions: 'Arrange the sequence stages in functional order from start to finish, then test your configuration.',
        processSteps: [
          { id: 'step_1', stepNumber: 1, label: 'Stage 1: System Activation', description: `Initialize the primary inputs for ${topic}.` },
          { id: 'step_2', stepNumber: 2, label: 'Stage 2: Throughput Transfer', description: 'Route material and energy through the conduit.' },
          { id: 'step_3', stepNumber: 3, label: 'Stage 3: Functional Synthesis', description: 'Synthesize the output and stabilize feedback.' },
          { id: 'step_4', stepNumber: 4, label: 'Stage 4: Steady State Equilibrium', description: 'Verify that balance is maintained across all components.' },
        ],
        modelComponents: [
          { id: 'comp_core', name: `${topic} Core Module`, description: 'Primary engine generating functional output.' },
          { id: 'comp_conduit', name: 'Distribution Conduit', description: 'Carries signals and energy throughout the system.' },
          { id: 'comp_stabilizer', name: 'Equilibrium Stabilizer', description: 'Prevents overload and maintains system safety.' },
        ],
        workbenchSlots: [
          { id: 'slot_1', label: 'Primary Input Bay', expectedComponentId: 'comp_core', feedbackOnMatch: 'Core Module firmly docked!' },
          { id: 'slot_2', label: 'Distribution Hub', expectedComponentId: 'comp_conduit', feedbackOnMatch: 'Conduit routed cleanly!' },
          { id: 'slot_3', label: 'Safety Stabilizer Zone', expectedComponentId: 'comp_stabilizer', feedbackOnMatch: 'Stabilizer online and calibrated!' },
        ],
        sortingBuckets: [
          { id: 'b_active', name: 'Active Mechanisms', description: 'Components directly driving action' },
          { id: 'b_passive', name: 'Support & Structural', description: 'Components providing balance and framing' },
        ],
        sortingItems: [
          { id: 'item_1', text: `${topic} Primary Drive`, bucketId: 'b_active' },
          { id: 'item_2', text: 'Conduit Flow Line', bucketId: 'b_active' },
          { id: 'item_3', text: 'Structural Framing', bucketId: 'b_passive' },
          { id: 'item_4', text: 'Protective Base', bucketId: 'b_passive' },
        ],
        simulationVariables: [
          { name: 'input_flow', label: 'Input Flow Rate', min: 1, max: 5, initial: 2, optimalValue: 3, unit: 'units/s', explanation: 'Controls the volume entering the system. Optimal rate is 3 units/s.' },
          { name: 'conduit_resistance', label: 'Conduit Resistance', min: 1, max: 4, initial: 2, optimalValue: 2, unit: 'ohms', explanation: 'Regulates passage speed. 2 maintains ideal pressure.' },
        ],
        goalMessage: `Harmonize the ${topic} apparatus to achieve 100% operational efficiency.`,
        completionFeedback: `Outstanding hands-on mastery! The ${topic} system is operating at peak equilibrium.`,
      };
    }

    const questionPrompt = category === 'question_sets'
      ? DifficultyAdaptationService.enrichQuestionWithDifficulty(
          `Which statement accurately describes the function of ${topic} in ${chapter}?`,
          difficulty,
          DifficultyAdaptationService.parseGradeLevel(className)
        )
      : `Based on your interactive exploration, which component plays the central role in ${topic}?`;

    return {
      name: `${topic} — ${meta.studentName} (${gameType})`,
      gameType,
      targetAbility: `${meta.technicalName} reasoning tailored to ${topic}`,
      estimatedMinutes: profile.estimatedMinutes,
      starReward: profile.starReward,
      customization: {
        gameTheme: `${topic} Laboratory & Studio`,
        backgroundStyle: `${meta.mascotName} studio`,
        objects: [topic, subject, 'Mechanism'],
        visualsDescription: `${meta.technicalName}-first learning environment grounded in ${chapter}`,
        mission: `Investigate and master ${topic} with ${meta.mascotName}!`,
        instructions: `Examine the interactive ${meta.technicalName} material, then answer the questions to prove your mastery.`,
        vocabulary: [topic, subject, 'Equilibrium', 'Structure'],
        scenario: `${meta.mascotName} is conducting experiments on ${topic} from ${chapter}.`,
        rewardSteps: ['Complete interactive study', `Earn ${profile.starReward} Stars`],
        progressStages: ['Explore', 'Practice', 'Mastered'],
        learningInput,
        learningExperience,
      },
      questions: [
        {
          type: 'academic',
          prompt: questionPrompt,
          options: [
            `${topic} Core provides the primary functional drive.`,
            'The system functions completely at random with no structure.',
            'None of the components interact with one another.',
          ],
          correctIndex: 0,
          hint: `Recall the primary definition from ${chapter}.`,
          explanation: `${topic} functions through coordinated interactions as introduced in ${chapter}.`,
        },
      ],
    };
  }

  /**
   * Generates a single high-quality activity for a specific modality.
   */
  public static async generateActivity(input: ActivityGenerationInput): Promise<{
    activity: GeneratedActivityData;
    isCached: boolean;
    source: string;
  }> {
    const context = input.chapterContext?.trim() || `Subject: ${input.subject}\nChapter: ${input.chapter}\nTopic: ${input.topic}`;

    try {
      const prompt = PROMPTS.modalityActivity({
        className: input.className,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        subtopic: input.subtopic,
        modality: input.modality,
        category: input.category,
        difficulty: input.difficulty,
        excerptOrConcept: context,
      });

      const { data, isCached, model } = await AiProviderService.generateJson<GeneratedActivityData>(
        prompt,
        {
          temperature: 0.35,
          useCache: !input.forceRefresh,
        }
      );

      const validated = QualityValidationService.validateAndRepairActivity(data);
      if (!validated.isValid || !validated.activity) {
        console.warn('Activity validation failed; falling back to grounded builder.', validated.errors);
        return {
          activity: this.buildGroundedFallbackActivity(input),
          isCached: false,
          source: 'deterministic_fallback',
        };
      }

      return {
        activity: validated.activity,
        isCached,
        source: `groq (${model})`,
      };
    } catch (err: any) {
      console.warn(`Groq activity generation error (${err?.message}); using grounded fallback.`);
      return {
        activity: this.buildGroundedFallbackActivity(input),
        isCached: false,
        source: 'deterministic_fallback',
      };
    }
  }

  /**
   * Batch generates activities for all 4 modalities simultaneously to minimize token usage.
   */
  public static async generateFourModalityBatch(
    baseInput: Omit<ActivityGenerationInput, 'modality'>
  ): Promise<Record<ModalityKey, GeneratedActivityData>> {
    const modalities: ModalityKey[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];
    const results = await Promise.all(
      modalities.map(async (modality) => {
        const res = await this.generateActivity({ ...baseInput, modality });
        return { modality, activity: res.activity };
      })
    );

    const map: Partial<Record<ModalityKey, GeneratedActivityData>> = {};
    for (const r of results) {
      map[r.modality] = r.activity;
    }
    return map as Record<ModalityKey, GeneratedActivityData>;
  }
}
