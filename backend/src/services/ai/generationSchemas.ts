import { z } from 'zod';
import { ModalityKey, ActivityCategory, DifficultyLevel, ScoringMethod } from '../../../../shared/types';

// ==========================================
// 1. CONCEPT MAP & CONCEPT EXTRACTION SCHEMAS
// ==========================================

export const conceptMapSchema = z.object({
  topicTitle: z.string().min(2),
  gradeLevel: z.string().min(2),
  subject: z.string().min(2),
  mainConcepts: z.array(z.string()).min(1),
  supportingConcepts: z.array(z.string()).default([]),
  definitions: z.array(z.object({
    term: z.string().min(1),
    definition: z.string().min(5),
    example: z.string().optional(),
  })).min(1),
  keyTerminology: z.array(z.string()).min(2),
  processesAndMechanisms: z.array(z.object({
    name: z.string().min(2),
    steps: z.array(z.string()).min(1),
    significance: z.string().optional(),
  })).default([]),
  causeAndEffect: z.array(z.object({
    cause: z.string().min(2),
    effect: z.string().min(2),
  })).default([]),
  sequencesAndStages: z.array(z.object({
    sequenceName: z.string().min(2),
    orderedStages: z.array(z.string()).min(2),
  })).default([]),
  comparisons: z.array(z.object({
    itemA: z.string().min(1),
    itemB: z.string().min(1),
    differenceOrRelation: z.string().min(5),
  })).default([]),
  realWorldApplications: z.array(z.string()).min(1),
  importantFacts: z.array(z.string()).min(1),
  misconceptions: z.array(z.object({
    misconception: z.string().min(3),
    correction: z.string().min(5),
  })).default([]),
  learningObjectives: z.array(z.string()).min(1),
  recommendedDiagrams: z.array(z.string()).default([]),
});

export type ConceptMapPayload = z.infer<typeof conceptMapSchema>;

// ==========================================
// 2. CONCEPT EXPLANATION SCHEMA
// ==========================================

export const conceptExplanationSchema = z.object({
  title: z.string().min(3),
  gradeLevel: z.string().min(2),
  targetAudience: z.string(),
  summary: z.string().min(20),
  sections: z.array(z.object({
    heading: z.string().min(2),
    content: z.string().min(20),
    realWorldConnection: z.string().optional(),
    keyTakeaway: z.string().min(5),
  })).min(1),
  vocabularyHighlights: z.array(z.object({
    term: z.string(),
    meaning: z.string(),
  })).min(1),
  reviewCheckpoints: z.array(z.string()).default([]),
});

export type ConceptExplanationPayload = z.infer<typeof conceptExplanationSchema>;

// ==========================================
// 3. FOUR MODALITY REPRESENTATIONS SCHEMA
// ==========================================

export const visualRepresentationSchema = z.object({
  title: z.string().min(2),
  diagramType: z.enum(['concept_map', 'flowchart', 'annotated_diagram', 'comparison_matrix', 'process_timeline']),
  description: z.string().min(10),
  elements: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    role: z.string().optional(),
  })).min(2),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
  })).default([]),
  svgSpecification: z.object({
    viewBox: z.string().default('0 0 100 100'),
    themeColor: z.string().default('#7041C6'),
    instructions: z.string().default('Inspect the visual diagram components.'),
  }).optional(),
});

export const auditoryRepresentationSchema = z.object({
  title: z.string().min(2),
  narrationScript: z.string().min(30),
  speakerInstructions: z.string().default('Speak clearly at an engaging, moderate tempo suitable for the grade level.'),
  audioSegments: z.array(z.object({
    index: z.number().int().min(1),
    title: z.string(),
    transcriptSnippet: z.string().min(10),
    soundCue: z.string().optional(),
    keyListenFor: z.string(),
  })).min(1),
  listeningQuestions: z.array(z.object({
    prompt: z.string().min(5),
    options: z.array(z.string()).min(2).max(4),
    correctIndex: z.number().int().min(0),
    hint: z.string().optional(),
    explanation: z.string(),
  })).min(1),
});

export const readWriteRepresentationSchema = z.object({
  title: z.string().min(2),
  readingPassage: z.string().min(40),
  analysisFocus: z.string().min(5),
  evidenceQuestions: z.array(z.object({
    prompt: z.string().min(5),
    evidenceSentenceInPassage: z.string().min(5),
    options: z.array(z.string()).min(2).max(4),
    correctIndex: z.number().int().min(0),
    explanation: z.string(),
  })).min(1),
  sentenceBuilderTarget: z.array(z.string()).min(3),
  sentenceBuilderScrambled: z.array(z.string()).min(3),
  fillInTheBlanks: z.array(z.object({
    sentenceWithBlank: z.string().min(5),
    blankAnswer: z.string().min(1),
    options: z.array(z.string()).min(2).max(4),
    explanation: z.string(),
  })).default([]),
});

export const kinestheticRepresentationSchema = z.object({
  title: z.string().min(2),
  activityFormat: z.enum(['model_assembly', 'virtual_experiment', 'process_sequencing', 'cause_and_effect_sandbox', 'sorting_challenge']),
  scenario: z.string().min(15),
  interactiveComponents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    categoryOrSlot: z.string(),
    description: z.string(),
    behaviorOnInteract: z.string().optional(),
  })).min(2),
  slotsOrZones: z.array(z.object({
    id: z.string(),
    label: z.string(),
    expectedComponentId: z.string(),
    feedbackOnMatch: z.string(),
  })).default([]),
  simulationVariables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    min: z.number().default(1),
    max: z.number().default(3),
    initial: z.number().default(1),
    optimalValue: z.number().default(2),
    unit: z.string().optional(),
    explanation: z.string(),
  })).default([]),
  challengeTasks: z.array(z.object({
    taskPrompt: z.string().min(5),
    targetState: z.string().min(3),
    successMessage: z.string().min(5),
  })).min(1),
});

export const allModalitiesRepresentationSchema = z.object({
  topicTitle: z.string(),
  gradeLevel: z.string(),
  visual: visualRepresentationSchema,
  auditory: auditoryRepresentationSchema,
  readWrite: readWriteRepresentationSchema,
  kinesthetic: kinestheticRepresentationSchema,
});

export type AllModalitiesPayload = z.infer<typeof allModalitiesRepresentationSchema>;

// ==========================================
// 4. ACTIVITY GENERATION SCHEMAS
// ==========================================

export const visualLearningDataSchema = z.object({
  visualType: z.enum(['annotated_diagram', 'process_flow', 'concept_map', 'comparison_chart']).default('annotated_diagram'),
  title: z.string().min(2),
  description: z.string().min(5),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    role: z.string().default(''),
    description: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    color: z.string().optional(),
    icon: z.string().optional(),
  })).min(2),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
    style: z.enum(['solid', 'dashed']).default('solid'),
  })).default([]),
  instructions: z.string().default('Tap each interactive component on the diagram to inspect its structure and role.'),
  inspectionTasks: z.array(z.string()).default([]),
  challenge: z.object({
    prompt: z.string(),
    targetNodeId: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })),
  }).optional(),
});

export const auditoryLearningDataSchema = z.object({
  audioTitle: z.string().min(2),
  narrationScript: z.string().min(20),
  speakerInstructions: z.string().optional(),
  segments: z.array(z.object({
    index: z.number().int().min(1),
    title: z.string(),
    transcriptSnippet: z.string(),
    soundCue: z.string().optional(),
    listenTarget: z.string(),
    durationSec: z.number().default(5),
  })).min(1),
  listeningExercises: z.array(z.object({
    id: z.string(),
    prompt: z.string(),
    requiredSegmentIndex: z.number().optional(),
    options: z.array(z.string()).min(2),
    correctIndex: z.number().int().min(0),
    explanation: z.string(),
  })).min(1),
  recapScript: z.string().optional(),
});

export const readWriteLearningDataSchema = z.object({
  passageTitle: z.string().min(2),
  structuredPassage: z.string().min(20),
  analysisFocus: z.string().default('Close reading and evidence synthesis'),
  vocabularyNotes: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    contextSentence: z.string().default(''),
  })).default([]),
  fillInBlanks: z.array(z.object({
    sentenceWithBlank: z.string(),
    blankAnswer: z.string(),
    options: z.array(z.string()).min(2),
    explanation: z.string().default(''),
  })).default([]),
  termPairs: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })).default([]),
  sentenceBuilder: z.object({
    targetSentence: z.array(z.string()),
    scrambledWords: z.array(z.string()),
    contextHint: z.string().optional(),
  }).optional(),
});

export const kinestheticLearningDataSchema = z.object({
  kinestheticType: z.enum(['process_sequencing', 'model_assembly', 'category_sorting', 'variable_simulation']),
  scenario: z.string().min(5),
  instructions: z.string().min(5),
  processSteps: z.array(z.object({
    id: z.string(),
    stepNumber: z.number().int().min(1),
    label: z.string(),
    description: z.string(),
  })).optional(),
  modelComponents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  })).optional(),
  workbenchSlots: z.array(z.object({
    id: z.string(),
    label: z.string(),
    expectedComponentId: z.string(),
    feedbackOnMatch: z.string(),
  })).optional(),
  sortingBuckets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  })).optional(),
  sortingItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    bucketId: z.string(),
  })).optional(),
  simulationVariables: z.array(z.object({
    name: z.string(),
    label: z.string(),
    min: z.number().default(1),
    max: z.number().default(3),
    initial: z.number().default(1),
    optimalValue: z.number().default(2),
    unit: z.string().optional(),
    explanation: z.string(),
  })).optional(),
  goalMessage: z.string().default('Harmonize and balance the interactive system.'),
  completionFeedback: z.string().default('System successfully completed and balanced!'),
});

export const activityQuestionSchema = z.object({
  type: z.enum(['academic', 'general']).default('academic'),
  prompt: z.string().min(5),
  options: z.array(z.string().min(1)).min(2).max(5),
  correctIndex: z.number().int().min(0),
  hint: z.string().optional(),
  explanation: z.string().optional(),
}).refine((q) => q.correctIndex < q.options.length, {
  message: 'correctIndex must be within options bounds',
});

export const activityCustomizationSchema = z.object({
  gameTheme: z.string().min(2),
  backgroundStyle: z.string().min(2),
  objects: z.array(z.string()).min(1),
  visualsDescription: z.string().min(2),
  mission: z.string().min(2),
  instructions: z.string().min(5),
  vocabulary: z.array(z.string()).min(1),
  scenario: z.string().min(3),
  rewardSteps: z.array(z.string()).min(1),
  progressStages: z.array(z.string()).min(1),
  learningExperience: z.union([
    visualLearningDataSchema,
    auditoryLearningDataSchema,
    readWriteLearningDataSchema,
    kinestheticLearningDataSchema,
    z.record(z.any()),
  ]).optional(),
  learningInput: z.object({
    diagramTitle: z.string().optional(),
    diagramParts: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
      x: z.number(),
      y: z.number(),
    })).optional(),
    audioTranscript: z.string().optional(),
    audioSegments: z.array(z.any()).optional(),
    readingPassage: z.string().optional(),
    sentenceBuilderTarget: z.array(z.string()).optional(),
    sentenceBuilderScrambled: z.array(z.string()).optional(),
    interactiveModelParts: z.array(z.string()).optional(),
    interactiveComponents: z.array(z.any()).optional(),
    slots: z.array(z.any()).optional(),
    simulationVariables: z.array(z.any()).optional(),
    experimentGoal: z.string().optional(),
  }).optional(),
});

export const generatedActivitySchema = z.object({
  name: z.string().min(3),
  gameType: z.string().min(2),
  targetAbility: z.string().min(3),
  estimatedMinutes: z.number().int().min(1).max(30).default(5),
  starReward: z.number().int().min(5).max(50).default(15),
  customization: activityCustomizationSchema,
  questions: z.array(activityQuestionSchema).min(1),
});

export type GeneratedActivityData = z.infer<typeof generatedActivitySchema>;

// ==========================================
// 5. ASSESSMENT GENERATION SCHEMAS
// ==========================================

export const assessmentQuestionSchema = z.object({
  id: z.string().optional(),
  questionType: z.enum([
    'multiple_choice',
    'multiple_select',
    'true_false_justification',
    'fill_in_the_blank',
    'ordering_sequence',
    'matching_classification',
    'assertion_reasoning',
    'diagram_interpretation',
    'short_answer_rubric',
  ]),
  modality: z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  marks: z.number().int().min(1).max(10).default(1),
  prompt: z.string().min(5),
  contextSnippet: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
  correctIndex: z.number().int().min(0).optional(),
  hint: z.string().optional(),
  explanation: z.string().min(5),
  conceptTested: z.string().min(2),
  learningObjective: z.string().min(2),
  rubric: z.object({
    criteria: z.string(),
    fullMarksCondition: z.string(),
    partialMarksCondition: z.string().optional(),
    zeroMarksCondition: z.string().optional(),
  }).optional(),
});

export type AssessmentQuestionPayload = z.infer<typeof assessmentQuestionSchema>;

export const generatedAssessmentSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  className: z.string(),
  subject: z.string(),
  chapter: z.string(),
  topic: z.string(),
  totalQuestions: z.number().int().min(1),
  totalMarks: z.number().int().min(1),
  estimatedMinutes: z.number().int().min(5).max(120).default(20),
  modalityCoverage: z.object({
    visual: z.number().int().min(0),
    auditory: z.number().int().min(0),
    read_write: z.number().int().min(0),
    kinesthetic: z.number().int().min(0),
  }),
  questions: z.array(assessmentQuestionSchema).min(4),
});

export type GeneratedAssessmentPayload = z.infer<typeof generatedAssessmentSchema>;
