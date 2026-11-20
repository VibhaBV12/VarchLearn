import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ConceptExtractionService,
  ConceptGenerationService,
  ModalityGenerationService,
  ActivityGenerationService,
  AssessmentGenerationService,
  DifficultyAdaptationService,
  QualityValidationService,
  AiProviderService,
  ActivityRequestInterpreter,
  ActivityPlanner,
  ActivityRendererResolver,
  ActivitySchemaValidator,
  ModalityActivityGenerator,
} from '../src/services/ai';
import { ENV } from '../src/config/env';

test('Concept Extraction: Extracts grounded knowledge map from textbook content', async () => {
  const excerpt = `Chapter 3: Respiration in Organisms
Topic: Cellular Respiration
Cellular respiration is the biochemical process in which glucose is broken down in the presence of oxygen to release energy in the form of ATP.
Carbon dioxide and water are produced as by-products.
Stage 1 begins with glycolysis in the cytoplasm, followed by the Krebs cycle and oxidative phosphorylation in the mitochondria.
Common misconception: Students often confuse breathing (gas exchange) with cellular respiration (cellular energy release).`;

  const result = await ConceptExtractionService.extractConcepts({
    className: 'Class 8',
    subject: 'Science',
    chapter: 'Chapter 3: Respiration in Organisms',
    topic: 'Cellular Respiration',
    excerpt,
  });

  assert.ok(result.conceptMap);
  assert.equal(result.conceptMap.topicTitle, 'Cellular Respiration');
  assert.ok(result.conceptMap.mainConcepts.length >= 1);
  assert.ok(result.conceptMap.definitions.length >= 1);
  assert.ok(result.conceptMap.learningObjectives.length >= 1);
});

test('Difficulty & Grade Adaptation: Adapts vocabulary, cognitive depth, and timing between Easy, Medium, and Hard', () => {
  const easyClass5 = DifficultyAdaptationService.getAdaptationProfile('Class 5', 'Easy');
  const hardClass9 = DifficultyAdaptationService.getAdaptationProfile('Class 9', 'Hard');

  assert.equal(easyClass5.vocabularyLevel, 'foundational');
  assert.equal(easyClass5.cognitiveDepth, 'recall_guided');
  assert.equal(easyClass5.guidanceLevel, 'explicit_step_by_step');
  assert.equal(easyClass5.starReward, 10);

  assert.equal(hardClass9.vocabularyLevel, 'advanced_rigorous');
  assert.equal(hardClass9.cognitiveDepth, 'analysis_synthesis_inference');
  assert.equal(hardClass9.guidanceLevel, 'minimal_independent');
  assert.equal(hardClass9.starReward, 20);
  assert.ok(hardClass9.estimatedMinutes > easyClass5.estimatedMinutes);
});

test('Modality Generation: Produces 4 distinct multimodal specifications grounded in concepts', async () => {
  const dummyMap = ConceptExtractionService.buildDeterministicConceptMap({
    className: 'Class 7',
    subject: 'Science',
    chapter: 'Light',
    topic: 'Reflection of Light',
    excerpt: 'Light bounces off shiny surfaces. Incident ray and reflected ray obey the law of reflection.',
  });

  const modalities = ModalityGenerationService.buildDeterministicModalities({
    className: 'Class 7',
    subject: 'Science',
    chapter: 'Light',
    topic: 'Reflection of Light',
    conceptMap: dummyMap,
  });

  assert.equal(modalities.visual.diagramType, 'annotated_diagram');
  assert.ok(modalities.visual.elements.length >= 2);
  assert.ok(modalities.auditory.narrationScript.length > 20);
  assert.ok(modalities.auditory.listeningQuestions.length >= 1);
  assert.ok(modalities.readWrite.readingPassage.length > 20);
  assert.ok(modalities.kinesthetic.interactiveComponents.length >= 2);
  assert.ok(modalities.kinesthetic.simulationVariables.length >= 1);
});

test('Assessment Generation: Builds 4-modality diagnostic questions with rubrics and varied formats', () => {
  const dummyMap = ConceptExtractionService.buildDeterministicConceptMap({
    className: 'Class 6',
    subject: 'Science',
    chapter: 'Water',
    topic: 'Water Cycle',
    excerpt: 'Water evaporates from oceans, condenses into clouds, and falls as precipitation.',
  });

  const asmt = AssessmentGenerationService.buildDeterministicAssessment({
    className: 'Class 6',
    subject: 'Science',
    chapter: 'Water',
    topic: 'Water Cycle',
    conceptMap: dummyMap,
    difficulty: 'Medium',
  });

  assert.equal(asmt.questions.length, 4);
  assert.equal(asmt.modalityCoverage.visual, 1);
  assert.equal(asmt.modalityCoverage.auditory, 1);
  assert.equal(asmt.modalityCoverage.read_write, 1);
  assert.equal(asmt.modalityCoverage.kinesthetic, 1);

  // Verify that short answer rubric exists
  const writtenQ = asmt.questions.find((q) => q.questionType === 'short_answer_rubric');
  assert.ok(writtenQ);
  assert.ok(writtenQ.rubric);
  assert.ok(writtenQ.rubric.fullMarksCondition);
});

test('Quality Validation: Repairs out-of-bounds indices and clamps values', () => {
  const malformed = {
    name: 'Test Activity',
    gameType: 'Diagram Detective',
    targetAbility: 'Visual matching',
    estimatedMinutes: -1,
    starReward: 0,
    customization: {
      gameTheme: 'Theme',
      backgroundStyle: 'Style',
      objects: ['Obj'],
      visualsDescription: 'Desc',
      mission: 'Mission',
      instructions: 'Do this',
      vocabulary: ['Term'],
      scenario: 'Scenario',
      rewardSteps: ['Step'],
      progressStages: ['Stage'],
    },
    questions: [
      {
        prompt: 'Which is correct?',
        options: ['A', 'B'],
        correctIndex: 99, // Out of bounds
      },
    ],
  };

  const res = QualityValidationService.validateAndRepairActivity(malformed);
  assert.equal(res.isValid, true);
  assert.equal(res.repaired, true);
  assert.equal(res.activity.questions[0].correctIndex, 0); // Repaired to within bounds
  assert.ok(res.activity.estimatedMinutes >= 1);
  assert.ok(res.activity.starReward >= 5);
});

test('Token Optimization & Caching: Cache statistics and clearing function properly', () => {
  AiProviderService.clearCache();
  const initialStats = AiProviderService.getCacheStats();
  assert.equal(initialStats.size, 0);
});

test('Batch 4-Modality Generation: Produces all 4 modality activities simultaneously with grounded custom inputs', async () => {
  const batch = await ActivityGenerationService.generateFourModalityBatch({
    className: 'Class 6',
    subject: 'Science',
    chapter: 'Chapter 2: Living World',
    topic: 'Plant Reproduction',
    category: 'games_puzzles',
    difficulty: 'Medium',
    chapterContext: 'Flowers produce pollen and seeds. Pollinators like bees carry pollen between flowers.',
  });

  assert.ok(batch.visual);
  assert.ok(batch.auditory);
  assert.ok(batch.read_write);
  assert.ok(batch.kinesthetic);

  assert.equal(batch.visual.customization.learningInput?.diagramTitle?.includes('Plant Reproduction'), true);
  assert.ok(batch.auditory.customization.learningInput?.audioTranscript?.length! > 20);
  assert.ok(batch.read_write.customization.learningInput?.sentenceBuilderTarget?.length! >= 3);
  assert.ok(batch.kinesthetic.customization.learningInput?.interactiveModelParts?.length! >= 2);

  // Assert genuine two-phase learningExperience objects are present and rich
  const visualExp = batch.visual.customization.learningExperience as any;
  assert.ok(visualExp && visualExp.nodes && visualExp.nodes.length >= 3);
  assert.ok(visualExp.connections && visualExp.connections.length >= 1);

  const auditoryExp = batch.auditory.customization.learningExperience as any;
  assert.ok(auditoryExp && auditoryExp.segments && auditoryExp.segments.length >= 2);
  assert.ok(auditoryExp.narrationScript && auditoryExp.narrationScript.length > 50);

  const readWriteExp = batch.read_write.customization.learningExperience as any;
  assert.ok(readWriteExp && readWriteExp.structuredPassage && readWriteExp.structuredPassage.length > 50);
  assert.ok(readWriteExp.vocabularyNotes && readWriteExp.vocabularyNotes.length >= 2);
  assert.ok(readWriteExp.fillInBlanks && readWriteExp.fillInBlanks.length >= 1);

  const kinestheticExp = batch.kinesthetic.customization.learningExperience as any;
  assert.ok(kinestheticExp && kinestheticExp.processSteps && kinestheticExp.processSteps.length >= 3);
  assert.ok(kinestheticExp.modelComponents && kinestheticExp.modelComponents.length >= 2);
  assert.ok(kinestheticExp.simulationVariables && kinestheticExp.simulationVariables.length >= 1);
});

test('Groq API Provider: Gracefully reports missing GROQ_API_KEY and enforces secure configuration', async () => {
  const originalKey = ENV.groqApiKey;
  try {
    ENV.groqApiKey = '';
    // If GROQ_API_KEY is empty, generateJson throws clear AppError
    await assert.rejects(
      async () => {
        await AiProviderService.generateJson('Test prompt', { useCache: false });
      },
      /GROQ_API_KEY is not configured/
    );
  } finally {
    ENV.groqApiKey = originalKey;
  }
});

test('Dedicated Activity Engine: Interprets teacher free-text prompts and resolves to supported renderer', () => {
  // Test Case 1: Kinesthetic process sequencing
  const prompt1 = 'Create an interactive water-cycle activity in which students drag the stages of evaporation, condensation and precipitation into the correct order. Include visual representations and immediate feedback.';
  const res1 = ActivityRequestInterpreter.interpret({
    teacherPrompt: prompt1,
    topic: 'Water Cycle',
    className: 'Class 6',
    subject: 'Science',
  });

  assert.equal(res1.targetModality, 'kinesthetic');
  assert.equal(res1.resolvedActivityType, 'process_sequencing');
  assert.ok(res1.identifiedItems.length >= 2);
  assert.equal(res1.requiresImmediateFeedback, true);

  // Test Case 2: Visual diagram labelling
  const prompt2 = 'Label the anatomical parts of a flowering plant including flower, stem, leaves and roots on an interactive diagram.';
  const res2 = ActivityRequestInterpreter.interpret({
    teacherPrompt: prompt2,
    topic: 'Parts of a Plant',
    className: 'Class 6',
    subject: 'Science',
  });

  assert.equal(res2.targetModality, 'visual');
  assert.equal(res2.resolvedActivityType, 'diagram_labelling');
  assert.ok(res2.identifiedItems.length >= 3);
});

test('Dedicated Activity Engine: Generates concept-appropriate specifications for all 4 modalities', async () => {
  // Visual test case
  const visualSpec = await ModalityActivityGenerator.generateActivitySpecification({
    className: 'Class 7',
    subject: 'Science',
    chapter: 'Light',
    topic: 'Reflection of Light',
    modality: 'visual',
    teacherInstruction: 'Label the normal, incident ray, and reflected ray on the mirror diagram.',
  });
  assert.equal(visualSpec.specification.modality, 'visual');
  assert.equal(visualSpec.specification.activityType, 'diagram_labelling');
  assert.ok(visualSpec.specification.interactionData.availableElements.length >= 2);
  assert.ok(visualSpec.specification.learningContent.overview.length > 20);

  // Kinesthetic test case with free-text instruction
  const kinestheticSpec = await ModalityActivityGenerator.generateActivitySpecification({
    className: 'Class 6',
    subject: 'Science',
    chapter: 'Water Cycle',
    topic: 'Water Cycle',
    modality: 'kinesthetic',
    teacherInstruction: 'Create an interactive water-cycle activity in which students drag the stages of evaporation, condensation and precipitation into the correct order.',
  });
  assert.equal(kinestheticSpec.specification.modality, 'kinesthetic');
  assert.equal(kinestheticSpec.specification.activityType, 'process_sequencing');
  assert.equal(kinestheticSpec.specification.interactionData.correctSolution.type, 'ordered_sequence');
  assert.ok(kinestheticSpec.specification.interactionData.correctSolution.expectedSequence!.length >= 3);

  // Confirm that the generated activity changes based on teacher instruction
  assert.notEqual(visualSpec.specification.activityType, kinestheticSpec.specification.activityType);
  assert.notEqual(visualSpec.specification.interactionData.availableElements[0].label, kinestheticSpec.specification.interactionData.availableElements[0].label);

  // Auditory test case
  const auditorySpec = await ModalityActivityGenerator.generateActivitySpecification({
    className: 'Class 8',
    subject: 'Science',
    chapter: 'Sound',
    topic: 'Propagation of Sound',
    modality: 'auditory',
    teacherInstruction: 'Listen to the audio explanation and sequence how sound travels through solids, liquids, and gases.',
  });
  assert.equal(auditorySpec.specification.modality, 'auditory');
  assert.ok(auditorySpec.specification.hints.length >= 1);
  assert.ok(auditorySpec.specification.feedback.correct.length > 5);

  // Read/Write test case
  const readWriteSpec = await ModalityActivityGenerator.generateActivitySpecification({
    className: 'Class 7',
    subject: 'Science',
    chapter: 'Nutrition in Plants',
    topic: 'Photosynthesis',
    modality: 'read_write',
    teacherInstruction: 'Read the scientific text and fill in the missing blanks for chloroplasts and glucose synthesis.',
  });
  assert.equal(readWriteSpec.specification.modality, 'read_write');
  assert.equal(readWriteSpec.specification.activityType, 'fill_missing_info');
  assert.equal(readWriteSpec.specification.interactionData.correctSolution.type, 'text_fill');
});

test('Dedicated Activity Engine: Validates and repairs corrupted activity specifications', () => {
  const malformedSpec: any = {
    title: '',
    modality: 'kinesthetic',
    activityType: 'unsupported_3d_vr_flying',
    learningContent: null,
    interactionData: {
      availableElements: [{ label: 'Item 1' }], // missing ID and minimum 2
    },
  };

  const validated = ActivitySchemaValidator.validateAndRepair(malformedSpec);
  assert.equal(validated.isValid, true);
  assert.equal(validated.repaired, true);
  assert.ok(validated.specification);
  assert.equal(validated.specification.schemaVersion, '2.0.0');
  assert.ok(validated.specification.interactionData.availableElements.length >= 2);
  assert.ok(validated.specification.interactionData.availableElements[0].id.length > 0);
  assert.ok(validated.specification.alternativeResolved);
});
