export type ModalityKey = 'visual' | 'auditory' | 'read_write' | 'kinesthetic';

export type ActivityCategory = 'games_puzzles' | 'question_sets';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type ApprovalStatus = 'Approved' | 'Pending Review' | 'Rejected' | 'Archived';

export type ScoringMethod = 'time_and_correctness' | 'correctness_only';

export type MascotId = 'vee' | 'pixie' | 'echo' | 'winky' | 'bouncy';

export type MascotExpression =
  | 'happy'
  | 'excited'
  | 'curious'
  | 'thinking'
  | 'surprised'
  | 'encouraging'
  | 'celebrating';

export type UserRole = 'student' | 'admin';

export interface ClassGroup {
  id: string;
  name: string; // e.g. "Class 5"
  section: string; // e.g. "A"
  gradeLevel: number; // e.g. 5
  studentCount: number;
  subjects: string[];
  createdAt: string;
}

export interface ModalityScores {
  visual: number; // 0-100
  auditory: number; // 0-100
  read_write: number; // 0-100
  kinesthetic: number; // 0-100
}

export interface AssessmentResultRecord {
  id: string;
  assessmentId: string;
  assessmentName: string;
  studentId: string;
  completedAt: string;
  scores: ModalityScores;
  totalTimeSeconds: number;
  scoringMethodUsed: ScoringMethod;
}

export interface DifficultyAdjustmentRecord {
  id: string;
  date: string;
  modality: ModalityKey;
  fromDifficulty: DifficultyLevel;
  toDifficulty: DifficultyLevel;
  reason: string;
}

export interface Student {
  id: string;
  name: string;
  username: string;
  classId: string;
  className: string;
  passwordHash: string; // Simulated frontend-only mock
  recoveryPin: string; // Simulated 4-digit PIN
  avatarMascot: MascotId;
  status: 'Active' | 'Inactive';
  registrationDate: string;
  stars: number;
  completedActivitiesCount: number;
  badges: string[];
  latestAssessmentResult: AssessmentResultRecord | null;
  assessmentHistory: AssessmentResultRecord[];
  currentAdaptedDifficulty: Record<ModalityKey, DifficultyLevel>;
  difficultyHistory: DifficultyAdjustmentRecord[];
}

export interface QuestionItem {
  id: string;
  type: 'academic' | 'general';
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation?: string;
}

export interface VisualDiagramNode {
  id: string;
  label: string;
  role: string;
  description: string;
  x: number; // 0..100 %
  y: number; // 0..100 %
  color?: string;
  icon?: string;
}

export interface VisualDiagramConnection {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface VisualLearningData {
  visualType: 'annotated_diagram' | 'process_flow' | 'concept_map' | 'comparison_chart';
  title: string;
  description: string;
  nodes: VisualDiagramNode[];
  connections: VisualDiagramConnection[];
  instructions: string;
  inspectionTasks: string[];
  challenge?: {
    prompt: string;
    targetNodeId: string;
    options: { id: string; label: string }[];
  };
}

export interface AuditoryAudioSegment {
  index: number;
  title: string;
  transcriptSnippet: string;
  soundCue?: string;
  listenTarget: string;
  durationSec: number;
}

export interface AuditoryListeningExercise {
  id: string;
  prompt: string;
  requiredSegmentIndex?: number;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AuditoryLearningData {
  audioTitle: string;
  narrationScript: string;
  speakerInstructions?: string;
  segments: AuditoryAudioSegment[];
  listeningExercises: AuditoryListeningExercise[];
  recapScript?: string;
}

export interface ReadWriteVocabularyNote {
  term: string;
  definition: string;
  contextSentence: string;
}

export interface ReadWriteFillInBlank {
  sentenceWithBlank: string;
  blankAnswer: string;
  options: string[];
  explanation: string;
}

export interface ReadWriteTermPair {
  term: string;
  definition: string;
}

export interface ReadWriteLearningData {
  passageTitle: string;
  structuredPassage: string;
  analysisFocus: string;
  vocabularyNotes: ReadWriteVocabularyNote[];
  fillInBlanks: ReadWriteFillInBlank[];
  termPairs: ReadWriteTermPair[];
  sentenceBuilder?: {
    targetSentence: string[];
    scrambledWords: string[];
    contextHint?: string;
  };
}

export interface KinestheticProcessStep {
  id: string;
  stepNumber: number; // 1-based correct order
  label: string;
  description: string;
}

export interface KinestheticComponent {
  id: string;
  name: string;
  description: string;
}

export interface KinestheticSlot {
  id: string;
  label: string;
  expectedComponentId: string;
  feedbackOnMatch: string;
}

export interface KinestheticSortingBucket {
  id: string;
  name: string;
  description: string;
}

export interface KinestheticSortingItem {
  id: string;
  text: string;
  bucketId: string;
}

export interface KinestheticSimulationVariable {
  name: string;
  label: string;
  min: number;
  max: number;
  initial: number;
  optimalValue: number;
  unit?: string;
  explanation: string;
}

export interface KinestheticLearningData {
  kinestheticType: 'process_sequencing' | 'model_assembly' | 'category_sorting' | 'variable_simulation';
  scenario: string;
  instructions: string;
  processSteps?: KinestheticProcessStep[];
  modelComponents?: KinestheticComponent[];
  workbenchSlots?: KinestheticSlot[];
  sortingBuckets?: KinestheticSortingBucket[];
  sortingItems?: KinestheticSortingItem[];
  simulationVariables?: KinestheticSimulationVariable[];
  goalMessage: string;
  completionFeedback: string;
}

export type SupportedActivityType =
  // Visual
  | 'diagram_labelling'
  | 'diagram_completion'
  | 'visual_matching'
  | 'concept_map_completion'
  | 'flowchart_construction'
  // Auditory
  | 'listen_and_identify'
  | 'listen_and_sequence'
  | 'listen_and_complete'
  | 'spoken_explanation'
  // Read/Write
  | 'reading_comprehension'
  | 'fill_missing_info'
  | 'vocabulary_matching'
  | 'sentence_building'
  | 'note_completion'
  // Kinesthetic
  | 'drag_and_drop_assembly'
  | 'process_sequencing'
  | 'sorting_categorisation'
  | 'variable_simulation';

export type ActivityRendererType =
  | 'DiagramLabelRenderer'
  | 'VisualMatchingRenderer'
  | 'AudioSequenceRenderer'
  | 'ListeningComprehensionRenderer'
  | 'ReadingChallengeRenderer'
  | 'FillBlankRenderer'
  | 'DragDropRenderer'
  | 'SequenceBuilderRenderer'
  | 'SortingRenderer'
  | 'VariableSimulationRenderer';

export interface ActivitySpecification {
  schemaVersion: '2.0.0';
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  topic: string;
  conceptId?: string;
  modality: ModalityKey;
  activityType: SupportedActivityType;
  rendererType: ActivityRendererType;
  difficulty: DifficultyLevel;
  learningObjective: string;
  studentInstructions: string;
  teacherPrompt?: string;
  estimatedDurationMinutes: number;
  starReward: number;
  sourceReferences?: string[];
  alternativeResolved?: {
    originalRequest: string;
    resolvedType: SupportedActivityType;
    reason: string;
  };
  learningContent: {
    overview: string;
    demonstration?: {
      type: 'diagram_inspection' | 'audio_narration' | 'reading_notes' | 'simulation_preview';
      data: any;
    };
    keyTakeaway: string;
  };
  interactionData: {
    availableElements: Array<{
      id: string;
      label: string;
      description?: string;
      assetKey?: string;
      color?: string;
      data?: any;
    }>;
    targetZones?: Array<{
      id: string;
      label: string;
      expectedElementId?: string;
      category?: string;
      orderIndex?: number;
      feedbackOnMatch?: string;
    }>;
    correctSolution: {
      type: 'ordered_sequence' | 'element_mapping' | 'category_bins' | 'variable_state' | 'text_fill';
      expectedSequence?: string[];
      expectedPairs?: Array<{ elementId: string; zoneId: string }>;
      expectedCategories?: Record<string, string[]>;
      expectedVariables?: Record<string, number>;
      expectedFills?: Record<string, string>;
    };
    validationRules: {
      allowPartialCredit: boolean;
      maxAttempts?: number;
      immediateFeedback: boolean;
    };
  };
  hints: string[];
  feedback: {
    correct: string;
    incorrect: string;
    partial?: string;
  };
  completionCriteria: {
    minimumCorrectPercent: number;
    requiredInteractionsCount?: number;
  };
  embeddedQuestions?: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export type MultimodalLearningExperience =
  | { modality: 'visual'; data: VisualLearningData }
  | { modality: 'auditory'; data: AuditoryLearningData }
  | { modality: 'read_write'; data: ReadWriteLearningData }
  | { modality: 'kinesthetic'; data: KinestheticLearningData };

export interface ActivityCustomization {
  gameTheme: string;
  backgroundStyle: string;
  objects: string[];
  visualsDescription: string;
  mission: string;
  instructions: string;
  vocabulary: string[];
  scenario: string;
  rewardSteps: string[];
  progressStages: string[];
  activitySpec?: ActivitySpecification;
  learningExperience?:
    | VisualLearningData
    | AuditoryLearningData
    | ReadWriteLearningData
    | KinestheticLearningData
    | Record<string, any>;
  learningInput?: {
    diagramTitle?: string;
    diagramParts?: { id: string; label: string; description: string; x: number; y: number }[];
    audioTranscript?: string;
    readingPassage?: string;
    interactiveModelParts?: string[];
    sentenceBuilderTarget?: string[];
    sentenceBuilderScrambled?: string[];
    [key: string]: any;
  };
}

export interface ActivityItem {
  id: string;
  name: string;
  modality: ModalityKey;
  category: ActivityCategory;
  gameType: string; // One of the 24 specific activity types or 'Question Set'
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic?: string;
  originalDifficulty: DifficultyLevel;
  difficulty: DifficultyLevel;
  targetAbility: string;
  scoringMethod: ScoringMethod;
  approvalStatus: ApprovalStatus;
  textbookSource?: string;
  aiGenerated: boolean;
  estimatedMinutes: number;
  starReward: number;
  customization: ActivityCustomization;
  questions?: QuestionItem[]; // Used when category === 'question_sets' or quiz-based
  createdAt: string;
}

export interface DailyPathNode {
  id: string;
  activityId: string;
  activity: ActivityItem;
  assignedDate: string; // YYYY-MM-DD — preserved on carry-forward!
  isCarriedForward: boolean;
  status: 'completed' | 'current' | 'available' | 'locked';
  completedAt?: string;
  earnedStars?: number;
  orderIndex: number;
}

export interface AssessmentActivityConfig {
  activityId: string;
  activity: ActivityItem;
  order: number;
  scoringMethod: ScoringMethod;
}

export interface Assessment {
  id: string;
  name: string;
  description: string;
  targetClassIds: string[];
  targetClassNames: string[];
  activities: AssessmentActivityConfig[];
  status: 'Draft' | 'Published';
  publishedAt?: string;
  createdAt: string;
  allowRetake: boolean;
  retakeCondition: string;
}

export interface StudentAssessmentProgress {
  assessmentId: string;
  studentId: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  currentActivityIndex: number;
  completedActivityIds: string[];
  activityResults: Record<
    string,
    {
      questionType?: string;
      correctCount: number;
      totalCount: number;
      timeTakenSeconds: number;
      scorePercent: number;
    }
  >;
  startedAt?: string;
  lastSavedAt?: string;
  completedAt?: string;
}

export interface TextbookChapter {
  id: string;
  number: number;
  title: string;
  topics: {
    id: string;
    title: string;
    subtopics: string[];
    extractedConcepts: string[];
    extractedDiagrams: string[];
  }[];
}

export interface TextbookMock {
  id: string;
  fileName: string;
  className: string;
  subject: string;
  pageCount: number;
  chapters: TextbookChapter[];
}

export interface AllocationProposal {
  studentId: string;
  weakestModalities: ModalityKey[];
  carriedForwardNodes: DailyPathNode[];
  proposedNewActivities: ActivityItem[];
  totalCount: number;
  maxLimit: number; // 12
  wasTruncated: boolean;
  truncationReason?: string;
  breakdownByModality: Record<
    ModalityKey,
    {
      isWeakest: boolean;
      gamesCount: number;
      questionSetsCount: number;
      questionsPerSet: number;
    }
  >;
}

export interface AdminSettings {
  adminProfile: {
    name: string;
    email: string;
    roleTitle: string;
    institution: string;
  };
  assessmentSettings: {
    showResultsToStudents: boolean;
    showModalityPercentages: boolean;
    allowRetakes: boolean;
    retakeCondition: string;
    publishingFrequency: 'Monthly' | 'Quarterly' | 'Term-wise' | 'On-demand';
  };
  scoringConfig: {
    defaultScoringMethod: ScoringMethod;
    allowPerActivityOverride: boolean;
    speedNeverOverridesAccuracy: boolean;
  };
  activitySettings: {
    maxDailyActivities: number; // 12
    enableCarryForward: boolean;
    enableAdaptiveDifficulty: boolean;
  };
  aiSettings: {
    requireAdminApprovalBeforeBank: boolean;
    defaultDifficultyByClass: boolean;
    simulationMode: boolean;
  };
  generalSettings: {
    appName: string;
    supportMessage: string;
    academicYear: string;
  };
}
