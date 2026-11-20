import { ModalityKey, ModalityScores } from '../../../shared/types';

export const ASSESSMENT_MODALITY_ORDER: ModalityKey[] = [
  'kinesthetic',
  'auditory',
  'visual',
  'read_write',
];

export interface SubmittedActivityEntry {
  activityId: string;
  questionType?: 'knowledge' | 'vark_preference';
  // For knowledge-based activities/questions:
  correctCount?: number;
  totalCount?: number;
  // Optional per-question answers keyed by questionId for server-side validation:
  questionAnswers?: Record<string, number>;
  // For VARK preference questions (weighted responses):
  preferenceWeights?: Array<{
    questionId: string;
    selectedWeight: number; // e.g., 1..4
    maxWeight: number;      // e.g., 4
  }>;
  timeTakenSeconds?: number;
}

export interface ServerQuestionBankEntry {
  id: string;
  correctIndex: number;
  type?: string;
}

/**
 * Sorts assessment activities into the mandatory 4-section VARK order:
 * 1. Kinesthetic -> 2. Auditory -> 3. Visual -> 4. Read/Write
 */
export function sortActivitiesByVarkOrder<T extends { activity: { modality: ModalityKey } }>(
  activities: T[]
): T[] {
  return [...activities].sort((a, b) => {
    const idxA = ASSESSMENT_MODALITY_ORDER.indexOf(a.activity.modality);
    const idxB = ASSESSMENT_MODALITY_ORDER.indexOf(b.activity.modality);
    return idxA - idxB;
  });
}

/**
 * Computes separate 0–100% scores for Kinesthetic, Auditory, Visual, and Read/Write.
 * - Knowledge-based: (correctAnswers / totalScoredQuestions) * 100, validated against DB correctIndex when questionAnswers are supplied.
 * - VARK preference: sum(selectedWeight) / sum(maxWeight) * 100 (never marked right or wrong).
 * - Deduplicates by activityId and questionId so duplicate answers cannot inflate scores.
 * - Never generates random or hardcoded fallback scores.
 */
export function computeAssessmentModalityScores(params: {
  assessmentActivities: Array<{
    activityId: string;
    modality: ModalityKey;
    questions?: ServerQuestionBankEntry[];
  }>;
  submittedResults: Record<string, SubmittedActivityEntry>;
}): {
  scores: ModalityScores;
  totalTimeSeconds: number;
  completedModalities: ModalityKey[];
} {
  const { assessmentActivities, submittedResults } = params;

  const modalityTotals: Record<ModalityKey, { earned: number; possible: number }> = {
    kinesthetic: { earned: 0, possible: 0 },
    auditory: { earned: 0, possible: 0 },
    visual: { earned: 0, possible: 0 },
    read_write: { earned: 0, possible: 0 },
  };

  const seenActivityIds = new Set<string>();
  const completedModalitiesSet = new Set<ModalityKey>();
  let totalTimeSeconds = 0;

  for (const cfg of assessmentActivities) {
    if (seenActivityIds.has(cfg.activityId)) continue;
    const entry = submittedResults[cfg.activityId];
    if (!entry) continue;

    seenActivityIds.add(cfg.activityId);
    completedModalitiesSet.add(cfg.modality);
    totalTimeSeconds += Math.max(0, Number(entry.timeTakenSeconds || 0));

    // Case B: VARK Preference Questions (weighted modality responses, not right/wrong)
    if (entry.questionType === 'vark_preference' && Array.isArray(entry.preferenceWeights)) {
      const seenQ = new Set<string>();
      for (const pw of entry.preferenceWeights) {
        if (seenQ.has(pw.questionId)) continue;
        seenQ.add(pw.questionId);
        const maxW = Math.max(1, Number(pw.maxWeight || 4));
        const selW = Math.max(0, Math.min(maxW, Number(pw.selectedWeight || 0)));
        modalityTotals[cfg.modality].earned += selW;
        modalityTotals[cfg.modality].possible += maxW;
      }
      continue;
    }

    // Case A: Knowledge-Based Questions
    if (entry.questionAnswers && cfg.questions && cfg.questions.length > 0) {
      const seenQ = new Set<string>();
      const questionMap = new Map(cfg.questions.map((q) => [q.id, q]));
      for (const [qId, selectedIdx] of Object.entries(entry.questionAnswers)) {
        if (seenQ.has(qId)) continue;
        const dbQ = questionMap.get(qId);
        if (!dbQ) continue;
        seenQ.add(qId);
        modalityTotals[cfg.modality].possible += 1;
        if (Number(selectedIdx) === dbQ.correctIndex) {
          modalityTotals[cfg.modality].earned += 1;
        }
      }
    } else {
      const total = Math.max(1, Number(entry.totalCount || 1));
      const correct = Math.max(0, Math.min(total, Number(entry.correctCount || 0)));
      modalityTotals[cfg.modality].earned += correct;
      modalityTotals[cfg.modality].possible += total;
    }
  }

  const toPercent = (m: ModalityKey) => {
    const { earned, possible } = modalityTotals[m];
    if (possible <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((earned / possible) * 100)));
  };

  return {
    scores: {
      kinesthetic: toPercent('kinesthetic'),
      auditory: toPercent('auditory'),
      visual: toPercent('visual'),
      read_write: toPercent('read_write'),
    },
    totalTimeSeconds,
    completedModalities: Array.from(completedModalitiesSet),
  };
}
