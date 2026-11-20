import {
  ActivityCategory,
  ActivityItem,
  ActivitySpecification,
  DifficultyLevel,
  ModalityKey,
  TextbookMock,
} from '../../../shared/types';
import { SEED_TEXTBOOKS } from '../../../shared/mock-data/seedData';
import { MODALITY_META } from '../../../shared/constants/theme';
import { ADMIN_API_CONFIG, adminApiRequest, adminUploadFile, simulateLatency } from './apiClient';

export interface ConceptMapData {
  topicTitle: string;
  gradeLevel: string;
  subject: string;
  mainConcepts: string[];
  supportingConcepts?: string[];
  definitions: { term: string; definition: string; example?: string }[];
  keyTerminology: string[];
  processesAndMechanisms?: { name: string; steps: string[]; significance?: string }[];
  causeAndEffect?: { cause: string; effect: string }[];
  sequencesAndStages?: { sequenceName: string; orderedStages: string[] }[];
  comparisons?: { itemA: string; itemB: string; differenceOrRelation: string }[];
  realWorldApplications: string[];
  importantFacts: string[];
  misconceptions?: { misconception: string; correction: string }[];
  learningObjectives: string[];
  recommendedDiagrams?: string[];
}

export interface ConceptExplanationData {
  title: string;
  gradeLevel: string;
  targetAudience: string;
  summary: string;
  sections: { heading: string; content: string; realWorldConnection?: string; keyTakeaway: string }[];
  vocabularyHighlights: { term: string; meaning: string }[];
  reviewCheckpoints?: string[];
}

export interface AllModalitiesData {
  topicTitle: string;
  gradeLevel: string;
  visual: {
    title: string;
    diagramType: string;
    description: string;
    elements: { id: string; label: string; description: string; x: number; y: number; role?: string }[];
    connections?: { from: string; to: string; label?: string }[];
    svgSpecification?: { viewBox: string; themeColor: string; instructions: string };
  };
  auditory: {
    title: string;
    narrationScript: string;
    speakerInstructions?: string;
    audioSegments: { index: number; title: string; transcriptSnippet: string; soundCue?: string; keyListenFor: string }[];
    listeningQuestions: { prompt: string; options: string[]; correctIndex: number; hint?: string; explanation: string }[];
  };
  readWrite: {
    title: string;
    readingPassage: string;
    analysisFocus: string;
    evidenceQuestions: { prompt: string; evidenceSentenceInPassage: string; options: string[]; correctIndex: number; explanation: string }[];
    sentenceBuilderTarget?: string[];
    sentenceBuilderScrambled?: string[];
    fillInTheBlanks?: { sentenceWithBlank: string; blankAnswer: string; options: string[]; explanation: string }[];
  };
  kinesthetic: {
    title: string;
    activityFormat: string;
    scenario: string;
    interactiveComponents: { id: string; name: string; categoryOrSlot: string; description: string }[];
    slotsOrZones?: { id: string; label: string; expectedComponentId: string; feedbackOnMatch: string }[];
    simulationVariables?: { name: string; label: string; min: number; max: number; initial: number; optimalValue: number; unit?: string }[];
    challengeTasks: { taskPrompt: string; targetState: string; successMessage: string }[];
  };
}

export interface GeneratedAssessmentData {
  name: string;
  description: string;
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  totalQuestions: number;
  totalMarks: number;
  estimatedMinutes: number;
  modalityCoverage: { visual: number; auditory: number; read_write: number; kinesthetic: number };
  questions: Array<{
    id?: string;
    questionType: string;
    modality: 'visual' | 'auditory' | 'read_write' | 'kinesthetic';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks: number;
    prompt: string;
    contextSnippet?: string;
    options?: string[];
    correctAnswer: any;
    correctIndex?: number;
    hint?: string;
    explanation: string;
    conceptTested: string;
    learningObjective: string;
    rubric?: {
      criteria: string;
      fullMarksCondition: string;
      partialMarksCondition?: string;
      zeroMarksCondition?: string;
    };
  }>;
}

export const aiContentService = {
  async simulatePdfExtraction(params: {
    file?: File | null;
    fileName: string;
    className: string;
    subject: string;
  }): Promise<TextbookMock> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      if (!params.file) {
        throw new Error('Please choose a textbook PDF file from your computer first.');
      }
      const fd = new FormData();
      fd.append('file', params.file);
      fd.append('className', params.className);
      fd.append('subject', params.subject);
      const res = await adminUploadFile<{ textbook: TextbookMock }>('/textbooks/upload', fd);
      return res.textbook;
    }

    await simulateLatency(900);
    const matched = SEED_TEXTBOOKS.find(
      (tb) => tb.className === params.className && tb.subject === params.subject
    );
    if (matched) {
      return { ...matched, fileName: params.fileName || matched.fileName };
    }
    return {
      id: `tb-${Date.now()}`,
      fileName: params.fileName,
      className: params.className,
      subject: params.subject,
      pageCount: 96,
      chapters: [
        {
          id: `ch-${Date.now()}`,
          number: 1,
          title: `${params.subject} Core Concepts`,
          topics: [
            {
              id: `top-${Date.now()}`,
              title: 'Foundational Concepts',
              subtopics: ['Key Principles', 'Real-World Examples'],
              extractedConcepts: ['Observation', 'Classification', 'Cause & Effect'],
              extractedDiagrams: ['Diagram 1.1: Concept Overview'],
            },
          ],
        },
      ],
    };
  },

  async extractConcepts(params: {
    textbookId?: string;
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    excerpt?: string;
    forceRefresh?: boolean;
  }): Promise<{ conceptMap: ConceptMapData; isCached: boolean; source: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/concept/extract', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(600);
    return {
      conceptMap: {
        topicTitle: params.topic,
        gradeLevel: params.className,
        subject: params.subject,
        mainConcepts: [params.topic, `${params.subject} Core Mechanism`],
        definitions: [
          {
            term: params.topic,
            definition: `A fundamental structure and system operating within ${params.subject}.`,
            example: `Real-world examples observed in ${params.className} syllabus.`,
          },
        ],
        keyTerminology: [params.topic, 'Structure', 'Mechanism', 'Equilibrium'],
        realWorldApplications: [`Everyday instances of ${params.topic} in action.`],
        importantFacts: [`${params.topic} is governed by consistent scientific principles.`],
        learningObjectives: [`Identify and explain the function of ${params.topic}.`],
      },
      isCached: false,
      source: 'offline_mock',
    };
  },

  async generateConceptExplanation(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: ConceptMapData;
    forceRefresh?: boolean;
  }): Promise<{ explanation: ConceptExplanationData; isCached: boolean; source: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/concept/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(600);
    return {
      explanation: {
        title: `${params.topic} — Conceptual Masterclass`,
        gradeLevel: params.className,
        targetAudience: `Students of ${params.className}`,
        summary: `Comprehensive conceptual overview of ${params.topic}.`,
        sections: [
          {
            heading: `Understanding ${params.topic}`,
            content: `${params.topic} functions through interconnected systems and mechanisms.`,
            keyTakeaway: 'Organized structures ensure consistent functionality.',
          },
        ],
        vocabularyHighlights: [{ term: params.topic, meaning: 'Core system component.' }],
      },
      isCached: false,
      source: 'offline_mock',
    };
  },

  async generateModalities(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: ConceptMapData;
    forceRefresh?: boolean;
  }): Promise<{ modalities: AllModalitiesData; isCached: boolean; source: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/modalities/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(800);
    return {
      modalities: {
        topicTitle: params.topic,
        gradeLevel: params.className,
        visual: {
          title: `${params.topic} Diagram`,
          diagramType: 'annotated_diagram',
          description: `Visual schematic of ${params.topic}`,
          elements: [
            { id: 'p1', label: `${params.topic} Core`, description: 'Primary hub', x: 50, y: 30 },
            { id: 'p2', label: 'Support System', description: 'Stabilizing base', x: 50, y: 75 },
          ],
        },
        auditory: {
          title: `${params.topic} Audio Guide`,
          narrationScript: `Spoken analysis explaining ${params.topic} clearly.`,
          audioSegments: [
            { index: 1, title: 'Introduction', transcriptSnippet: `Intro to ${params.topic}`, keyListenFor: 'Core definition' },
          ],
          listeningQuestions: [
            { prompt: `What is the role of ${params.topic}?`, options: ['Primary function', 'Inactive'], correctIndex: 0, explanation: 'Explained in audio.' },
          ],
        },
        readWrite: {
          title: `${params.topic} Reading Analysis`,
          readingPassage: `Technical passage detailing the mechanisms of ${params.topic}.`,
          analysisFocus: 'Evidence extraction',
          evidenceQuestions: [
            { prompt: `What does the text state about ${params.topic}?`, evidenceSentenceInPassage: 'Text states function.', options: ['Accurate fact', 'False'], correctIndex: 0, explanation: 'Direct evidence.' },
          ],
        },
        kinesthetic: {
          title: `${params.topic} Assembly Sandbox`,
          activityFormat: 'model_assembly',
          scenario: `Assemble and balance the ${params.topic} components.`,
          interactiveComponents: [
            { id: 'c1', name: `${params.topic} Hub`, categoryOrSlot: 'slot1', description: 'Central hub' },
          ],
          challengeTasks: [
            { taskPrompt: 'Assemble the components and achieve balance.', targetState: 'Balanced', successMessage: 'Success!' },
          ],
        },
      },
      isCached: false,
      source: 'offline_mock',
    };
  },

  async generateBatchActivities(params: {
    textbookId?: string;
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    subtopic?: string;
    category?: ActivityCategory;
    difficulty?: DifficultyLevel;
    forceRefresh?: boolean;
  }): Promise<{ activities: ActivityItem[] }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/activities/generate-batch', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(1200);
    const modalities: ModalityKey[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];
    return {
      activities: modalities.map((m) => ({
        id: `act-mock-${m}-${Date.now()}`,
        name: `${params.topic} — ${MODALITY_META[m].studentName}`,
        modality: m,
        category: params.category || 'games_puzzles',
        gameType: m === 'visual' ? 'Diagram Detective' : m === 'auditory' ? 'Audio Quiz' : m === 'read_write' ? 'Sentence Builder' : 'Model Builder',
        className: params.className,
        subject: params.subject,
        chapter: params.chapter,
        topic: params.topic,
        originalDifficulty: params.difficulty || 'Medium',
        difficulty: params.difficulty || 'Medium',
        targetAbility: `${MODALITY_META[m].technicalName} processing`,
        scoringMethod: 'correctness_only',
        approvalStatus: 'Pending Review',
        aiGenerated: true,
        estimatedMinutes: 5,
        starReward: 15,
        createdAt: new Date().toISOString().slice(0, 10),
        customization: {
          gameTheme: `${params.topic} Studio`,
          backgroundStyle: 'Studio',
          objects: [params.topic],
          visualsDescription: 'Activity input',
          mission: 'Master the concept',
          instructions: 'Complete the task',
          vocabulary: [params.topic],
          scenario: 'Study scenario',
          rewardSteps: ['Complete step', 'Earn Stars'],
          progressStages: ['Start', 'Done'],
        },
      })),
    };
  },

  async generateAssessment(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: ConceptMapData;
    questionCount?: number;
    difficulty?: DifficultyLevel;
    forceRefresh?: boolean;
  }): Promise<{ assessment: GeneratedAssessmentData; isCached: boolean; source: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/assessments/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(1000);
    return {
      assessment: {
        name: `${params.topic} — Diagnostic Assessment`,
        description: `Assessment on ${params.topic}`,
        className: params.className,
        subject: params.subject,
        chapter: params.chapter,
        topic: params.topic,
        totalQuestions: 4,
        totalMarks: 6,
        estimatedMinutes: 20,
        modalityCoverage: { visual: 1, auditory: 1, read_write: 1, kinesthetic: 1 },
        questions: [
          {
            id: 'q1',
            questionType: 'multiple_choice',
            modality: 'visual',
            difficulty: params.difficulty || 'Medium',
            marks: 1,
            prompt: `Identify the main structure of ${params.topic}:`,
            options: [params.topic, 'Unrelated item'],
            correctAnswer: params.topic,
            correctIndex: 0,
            explanation: 'Grounded concept.',
            conceptTested: params.topic,
            learningObjective: 'Recall structure',
          },
        ],
      },
      isCached: false,
      source: 'offline_mock',
    };
  },

  async saveGeneratedAssessment(params: {
    assessment: GeneratedAssessmentData;
    classIds: string[];
    publishNow?: boolean;
  }): Promise<{ success: boolean; assessmentId: string; message: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/assessments/save', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(500);
    return {
      success: true,
      assessmentId: `asmt-saved-${Date.now()}`,
      message: 'Assessment saved in offline demo mode.',
    };
  },

  async simulateActivityGeneration(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    subtopic?: string;
    modality: ModalityKey;
    category: ActivityCategory;
    difficulty: DifficultyLevel;
    textbookId?: string;
    textbookSource?: string;
  }): Promise<ActivityItem> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      const res = await adminApiRequest<{ activity: ActivityItem }>('/activities/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return res.activity;
    }

    await simulateLatency(1000);
    const { className, subject, chapter, topic, subtopic, modality, category, difficulty, textbookSource } = params;
    const meta = MODALITY_META[modality];
    const isPlantDemo = topic.toLowerCase().includes('plant');
    const gameTypeByModality: Record<ModalityKey, string> = {
      visual: category === 'question_sets' ? 'Question Set' : 'Diagram Detective',
      auditory: category === 'question_sets' ? 'Question Set' : 'Audio Quiz',
      read_write: category === 'question_sets' ? 'Question Set' : 'Sentence Builder',
      kinesthetic: category === 'question_sets' ? 'Question Set' : 'Model Builder',
    };
    const starMap: Record<DifficultyLevel, number> = { Easy: 10, Medium: 15, Hard: 20 };

    return {
      id: `act-ai-${Date.now()}`,
      name: `${topic} — ${meta.studentName} (${gameTypeByModality[modality]})`,
      modality,
      category,
      gameType: gameTypeByModality[modality],
      className,
      subject,
      chapter,
      topic,
      subtopic,
      originalDifficulty: difficulty,
      difficulty,
      targetAbility: `${meta.technicalName} processing tailored to ${topic}`,
      scoringMethod: 'correctness_only',
      approvalStatus: 'Pending Review',
      textbookSource,
      aiGenerated: true,
      estimatedMinutes: difficulty === 'Hard' ? 7 : 5,
      starReward: starMap[difficulty],
      createdAt: new Date().toISOString().slice(0, 10),
      customization: {
        gameTheme: `${topic} Explorer Studio`,
        backgroundStyle: `${meta.mascotName} learning studio`,
        objects: isPlantDemo ? ['Roots', 'Stem', 'Leaves', 'Flower'] : [topic],
        visualsDescription: `${meta.technicalName}-first learning input`,
        mission: `Explore ${topic} with ${meta.mascotName}!`,
        instructions: 'Complete the learning input before answering.',
        vocabulary: [topic, subject],
        scenario: `${meta.mascotName} explores ${chapter}.`,
        rewardSteps: ['Complete input', `Earn ${starMap[difficulty]} Stars`],
        progressStages: ['Explore', 'Practice', 'Mastered'],
      },
    };
  },

  async generateCustomActivity(params: {
    className: string;
    subject: string;
    chapter?: string;
    topic: string;
    concept?: string;
    difficulty?: DifficultyLevel;
    modality?: ModalityKey;
    teacherInstruction?: string;
    learningObjective?: string;
    textbookId?: string;
    forceRefresh?: boolean;
  }): Promise<{ specification: ActivitySpecification; isCached: boolean; source: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/activities/generate-custom', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(800);
    const elemNames = params.teacherInstruction?.toLowerCase().includes('water')
      ? ['Evaporation', 'Condensation', 'Precipitation', 'Collection']
      : [`${params.topic} Core`, 'Transfer Conduit', 'Anchor Base', 'Equilibrium'];

    const elements = elemNames.map((n, i) => ({
      id: `elem_${n.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i + 1}`,
      label: n,
      description: `Essential stage/component of ${params.topic}`,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 4],
    }));

    const spec: ActivitySpecification = {
      schemaVersion: '2.0.0',
      id: `act_custom_${Date.now()}`,
      title: `${params.topic} Active Studio Challenge`,
      description: `Complete the interactive activity for ${params.topic}.`,
      subject: params.subject,
      grade: params.className,
      topic: params.topic,
      conceptId: params.concept || params.topic,
      modality: params.modality || 'kinesthetic',
      activityType: params.teacherInstruction?.toLowerCase().includes('drag') ? 'process_sequencing' : 'diagram_labelling',
      rendererType: params.teacherInstruction?.toLowerCase().includes('drag') ? 'SequenceBuilderRenderer' : 'DiagramLabelRenderer',
      difficulty: params.difficulty || 'Medium',
      learningObjective: params.learningObjective || `Master the principles of ${params.topic}.`,
      studentInstructions: 'Drag the stages below into the correct chronological order, then observe immediate feedback.',
      teacherPrompt: params.teacherInstruction,
      estimatedDurationMinutes: params.difficulty === 'Hard' ? 8 : 5,
      starReward: params.difficulty === 'Hard' ? 20 : 15,
      sourceReferences: [`Unit: ${params.topic}`],
      learningContent: {
        overview: `${params.topic} functions as an integrated scientific system where components operate in a coordinated balance.`,
        demonstration: {
          type: 'diagram_inspection',
          data: { topic: params.topic },
        },
        keyTakeaway: `Mastery of ${params.topic} requires understanding both individual components and their functional flow.`,
      },
      interactionData: {
        availableElements: elements,
        targetZones: elements.map((el, i) => ({
          id: `zone_step_${i + 1}`,
          label: `Stage ${i + 1}: ${el.label}`,
          orderIndex: i + 1,
          expectedElementId: el.id,
          feedbackOnMatch: `Step ${i + 1} (${el.label}) correctly placed!`,
        })),
        correctSolution: {
          type: 'ordered_sequence',
          expectedSequence: elements.map((e) => e.id),
        },
        validationRules: {
          allowPartialCredit: true,
          immediateFeedback: true,
        },
      },
      hints: ['Review the primary sequence.', 'Notice which step must occur first.'],
      feedback: {
        correct: `Outstanding! You successfully solved the ${params.topic} challenge.`,
        incorrect: 'Not quite. Check the stage order and try again.',
        partial: 'Good progress! Check remaining elements.',
      },
      completionCriteria: {
        minimumCorrectPercent: 75,
      },
    };

    return {
      specification: spec,
      isCached: false,
      source: 'offline_mock',
    };
  },

  async saveCustomActivity(params: {
    specification: ActivitySpecification;
    chapter?: string;
    textbookId?: string;
    textbookSource?: string;
    approvalStatus?: string;
  }): Promise<{ success: boolean; activity: ActivityItem; message: string }> {
    if (!ADMIN_API_CONFIG.useMockApi) {
      return adminApiRequest('/ai/activities/save', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    }

    await simulateLatency(400);
    const spec = params.specification;
    return {
      success: true,
      activity: {
        id: spec.id,
        name: spec.title,
        modality: spec.modality,
        category: 'games_puzzles',
        gameType: spec.activityType,
        className: spec.grade,
        subject: spec.subject,
        chapter: params.chapter || `Unit: ${spec.topic}`,
        topic: spec.topic,
        originalDifficulty: spec.difficulty,
        difficulty: spec.difficulty,
        targetAbility: spec.learningObjective,
        scoringMethod: 'correctness_only',
        approvalStatus: 'Approved',
        aiGenerated: true,
        estimatedMinutes: spec.estimatedDurationMinutes,
        starReward: spec.starReward,
        createdAt: new Date().toISOString().slice(0, 10),
        customization: {
          gameTheme: `${spec.topic} Studio`,
          backgroundStyle: 'VarchLearn Studio',
          objects: spec.interactionData.availableElements.map((e) => e.label),
          visualsDescription: spec.description,
          mission: spec.learningObjective,
          instructions: spec.studentInstructions,
          vocabulary: spec.interactionData.availableElements.map((e) => e.label),
          scenario: spec.description,
          rewardSteps: ['Complete Task', `Earn ${spec.starReward} Stars`],
          progressStages: ['Explore', 'Practice', 'Master'],
          activitySpec: spec,
        },
      },
      message: `Activity "${spec.title}" saved.`,
    };
  },
};
