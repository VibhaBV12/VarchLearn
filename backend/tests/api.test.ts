import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDailyAllocation, getWeakestModalities } from '../../shared/utils/allocationEngine';
import { SEED_ACTIVITY_BANK } from '../../shared/mock-data/seedData';
import { extractRelevantChapterContext } from '../src/services/pdfService';
import { buildVarkGroqPrompt, groqResponseSchema } from '../src/services/aiGeneratorService';
import {
  ASSESSMENT_MODALITY_ORDER,
  computeAssessmentModalityScores,
  sortActivitiesByVarkOrder,
} from '../src/utils/assessmentScoring';

test('Allocation Engine: 1 weakest modality yields 9 items (5 games + 4 question sets)', () => {
  const weakest = getWeakestModalities({ visual: 80, auditory: 45, read_write: 75, kinesthetic: 70 });
  assert.deepEqual(weakest, ['auditory']);

  const proposal = computeDailyAllocation({
    studentId: 'stu-test',
    latestScores: { visual: 80, auditory: 45, read_write: 75, kinesthetic: 70 },
    pendingCarryForward: [],
    approvedBank: SEED_ACTIVITY_BANK,
    studentClassName: 'Class 5',
  });

  assert.equal(proposal.totalCount, 9);
});

test('Assessment Order: enforces Kinesthetic -> Auditory -> Visual -> Read/Write', () => {
  const shuffled = [
    { activity: { modality: 'read_write' as const } },
    { activity: { modality: 'visual' as const } },
    { activity: { modality: 'kinesthetic' as const } },
    { activity: { modality: 'auditory' as const } },
  ];
  const sorted = sortActivitiesByVarkOrder(shuffled);
  assert.deepEqual(
    sorted.map((s) => s.activity.modality),
    ASSESSMENT_MODALITY_ORDER
  );
});

test('Assessment Scoring: Knowledge-based & VARK preference calculations remain separate & bounded 0-100', () => {
  const { scores, completedModalities } = computeAssessmentModalityScores({
    assessmentActivities: [
      {
        activityId: 'k1',
        modality: 'kinesthetic',
        questions: [
          { id: 'q1', correctIndex: 0 },
          { id: 'q2', correctIndex: 2 },
        ],
      },
      { activityId: 'a1', modality: 'auditory' },
      { activityId: 'v1', modality: 'visual' },
      { activityId: 'r1', modality: 'read_write' },
    ],
    submittedResults: {
      k1: {
        activityId: 'k1',
        questionType: 'knowledge',
        questionAnswers: { q1: 0, q2: 1 }, // 1 of 2 correct => 50%
        timeTakenSeconds: 30,
      },
      a1: {
        activityId: 'a1',
        questionType: 'vark_preference',
        preferenceWeights: [
          { questionId: 'pq1', selectedWeight: 3, maxWeight: 4 },
          { questionId: 'pq1', selectedWeight: 4, maxWeight: 4 }, // duplicate questionId ignored!
          { questionId: 'pq2', selectedWeight: 4, maxWeight: 4 },
        ], // (3 + 4) / (4 + 4) = 87.5 => 88%
        timeTakenSeconds: 25,
      },
      v1: {
        activityId: 'v1',
        questionType: 'knowledge',
        correctCount: 4,
        totalCount: 4, // 100%
        timeTakenSeconds: 20,
      },
      r1: {
        activityId: 'r1',
        questionType: 'knowledge',
        correctCount: 1,
        totalCount: 4, // 25%
        timeTakenSeconds: 35,
      },
    },
  });

  assert.equal(scores.kinesthetic, 50);
  assert.equal(scores.auditory, 88);
  assert.equal(scores.visual, 100);
  assert.equal(scores.read_write, 25);
  assert.equal(completedModalities.length, 4);
});

test('Live API Integration: Assessment flow, retake lock (409), and independent student status', async (t) => {
  const base = process.env.API_TEST_URL || 'http://localhost:4000/api/v1';
  try {
    const health = await fetch('http://localhost:4000/health');
    if (!health.ok) {
      t.skip('Backend server not running on port 4000');
      return;
    }
  } catch {
    t.skip('Backend server not running on port 4000');
    return;
  }

  // Register a fresh student to test one-time initial assessment lifecycle
  const uniqueUser = `test_stu_${Date.now()}`;
  const regRes = await fetch(`${base}/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Explorer',
      username: uniqueUser,
      className: 'Class 5',
      password: 'password123',
      recoveryPin: '1234',
    }),
  });
  assert.equal(regRes.status, 201);
  const regJson: any = await regRes.json();
  const token = regJson.token;

  // 1. Initial status is not_started
  const initRes = await fetch(`${base}/assessments/initial/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(initRes.status, 200);
  const initJson: any = await initRes.json();
  assert.equal(initJson.status, 'not_started');
  const assessment = initJson.assessment;
  assert.ok(assessment);
  assert.deepEqual(
    assessment.activities.map((a: any) => a.activity.modality),
    ['kinesthetic', 'auditory', 'visual', 'read_write']
  );

  // 2. Save partial progress (Kinesthetic done) -> status becomes in_progress
  const firstAct = assessment.activities[0];
  const putRes = await fetch(`${base}/assessments/${assessment.id}/attempt`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      status: 'in_progress',
      currentActivityIndex: 1,
      completedActivityIds: [firstAct.activityId],
      activityResults: {
        [firstAct.activityId]: { questionType: 'knowledge', correctCount: 3, totalCount: 4, timeTakenSeconds: 20 },
      },
    }),
  });
  assert.equal(putRes.status, 200);

  // 3. Submit all 4 sections
  const fullResults: Record<string, any> = {};
  for (const cfg of assessment.activities) {
    fullResults[cfg.activityId] = {
      questionType: 'knowledge',
      correctCount: 3,
      totalCount: 4,
      timeTakenSeconds: 20,
    };
  }
  const subRes = await fetch(`${base}/assessments/${assessment.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ activityResults: fullResults }),
  });
  assert.equal(subRes.status, 200);
  const subJson: any = await subRes.json();
  assert.equal(subJson.result.scores.kinesthetic, 75);

  // 4. Retake / duplicate submission must be rejected with 409
  const dupSubmit = await fetch(`${base}/assessments/${assessment.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ activityResults: fullResults }),
  });
  assert.equal(dupSubmit.status, 409);

  const dupPut = await fetch(`${base}/assessments/${assessment.id}/attempt`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'in_progress', currentActivityIndex: 0 }),
  });
  assert.equal(dupPut.status, 409);
});

test('PDF Grounding: extractRelevantChapterContext slices selected chapter text', () => {
  const longText = 'Chapter 1: Solar System\nPlanets orbit the Sun. '.repeat(250) +
    '\nChapter 2: Parts of a Plant\nRoots absorb water and minerals from soil. Leaves perform photosynthesis.';
  const excerpt = extractRelevantChapterContext(longText, 'Chapter 2: Parts of a Plant', 'Parts of a Plant', 600);
  assert.ok(excerpt.includes('Roots absorb water'));
  assert.ok(!excerpt.startsWith('Chapter 1: Solar System'));
});

test('Groq Prompt & Schema: distinct VARK instructions & strict question validation', () => {
  const prompt = buildVarkGroqPrompt({
    className: 'Class 6',
    subject: 'Science',
    chapter: 'Chapter 2: Parts of a Plant',
    topic: 'Photosynthesis',
    modality: 'kinesthetic',
    category: 'games_puzzles',
    difficulty: 'Medium',
    chapterContext: 'Chlorophyll in green leaves captures sunlight to make glucose.',
  });
  assert.ok(prompt.includes('Chlorophyll in green leaves'));
  assert.ok(prompt.includes('KINESTHETIC'));

  const bad = groqResponseSchema.safeParse({
    name: 'Test',
    gameType: 'Model Builder',
    targetAbility: 'Kinesthetic',
    customization: {
      gameTheme: 'Lab', backgroundStyle: 'Green', objects: ['Leaf'], visualsDescription: 'Desc',
      mission: 'Build', instructions: 'Build the leaf model', vocabulary: ['Leaf'],
      scenario: 'Lab', rewardSteps: ['Done'], progressStages: ['1']
    },
    questions: [{ type: 'academic', prompt: 'What captures sunlight?', options: ['Leaf', 'Root'], correctIndex: 5 }],
  });
  assert.equal(bad.success, false);
});

test('PDF Grounding: short PDF still slices only selected chapter & unmatched chapter throws', () => {
  const shortBook = 'Chapter 1: Magnets\nMagnets attract iron.\nChapter 2: Water Cycle\nEvaporation turns water into vapor.';
  const ch2 = extractRelevantChapterContext(shortBook, 'Chapter 2: Water Cycle', 'Water Cycle', 7000);
  assert.ok(ch2.includes('Evaporation turns water into vapor.'));
  assert.ok(!ch2.includes('Magnets attract iron.'));

  assert.throws(
    () => extractRelevantChapterContext(shortBook, 'Chapter 9: Electricity', 'Circuits', 7000),
    /Could not reliably (?:locate|identify)/
  );
});

test('PDF Grounding: TOC entry is skipped in favor of actual chapter body', () => {
  const bookWithToc =
    'Table of Contents\nChapter 1: Solar System ........ 3\nChapter 2: Parts of a Plant ........ 18\n\n' +
    'Chapter 1: Solar System\nPlanets orbit the Sun in elliptical paths.\n' +
    'Chapter 2: Parts of a Plant\nRoots absorb water and minerals from the soil while leaves make food using sunlight.';
  const excerpt = extractRelevantChapterContext(bookWithToc, 'Chapter 2: Parts of a Plant', 'Parts of a Plant', 7000);
  assert.ok(excerpt.includes('Roots absorb water and minerals'));
  assert.ok(!excerpt.includes('........ 18'));
});

test('PDF Grounding: narrows to selected topic inside chapter & supports unnumbered headings', () => {
  const multiTopicBook =
    'Table of Contents\nChapter 2: Plant World ........ 10\n\n' +
    'Chapter 2: Plant World\n' +
    'Roots and Soil\n' +
    'Roots anchor the plant and absorb water and minerals from the soil.\n' +
    'Photosynthesis in Leaves\n' +
    'Green leaves contain chlorophyll and capture sunlight to make glucose.\n';

  const leafOnly = extractRelevantChapterContext(multiTopicBook, 'Chapter 2: Plant World', 'Photosynthesis in Leaves', 6000);
  assert.ok(leafOnly.includes('chlorophyll and capture sunlight'));
  assert.ok(!leafOnly.includes('Roots anchor the plant'));

  assert.throws(
    () => extractRelevantChapterContext(multiTopicBook, 'Chapter 2: Plant World', 'Nonexistent Topic', 6000),
    /Could not reliably locate topic/
  );
});
