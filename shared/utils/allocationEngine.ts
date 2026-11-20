import {
  ActivityItem,
  AllocationProposal,
  DailyPathNode,
  ModalityKey,
  ModalityScores,
} from '../types';

export const MAX_DAILY_ACTIVITIES = 12;
const ALL_MODALITIES: ModalityKey[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];

/**
 * Finds all modalities tied for the lowest score in the student's latest completed assessment.
 * If no assessment exists, returns empty array (default balanced allocation).
 */
export function getWeakestModalities(scores: ModalityScores | null): ModalityKey[] {
  if (!scores) return [];
  const minScore = Math.min(
    scores.visual,
    scores.auditory,
    scores.read_write,
    scores.kinesthetic
  );
  return ALL_MODALITIES.filter((m) => scores[m] === minScore);
}

/**
 * Computes the exact daily activity allocation per Part 9 rules:
 * - Weakest modality (or each tied weakest modality): 2 Games/Puzzles + 1 Question Set (10 Qs: 6 academic + 4 general)
 * - Non-weakest modality: 1 Game/Puzzle + 1 Question Set (5 Qs: 3 academic + 2 general)
 * - Totals before carry-forward: 1 weakest -> 9, 2 tied -> 10, 3 tied -> 11, 4 tied -> 12
 * - Carry-forward pending activities count first; max 12 total items; never duplicate pending activities.
 */
export function computeDailyAllocation(params: {
  studentId: string;
  latestScores: ModalityScores | null;
  pendingCarryForward: DailyPathNode[];
  approvedBank: ActivityItem[];
  studentClassName?: string;
}): AllocationProposal {
  const { studentId, latestScores, pendingCarryForward, approvedBank, studentClassName } = params;

  const weakestModalities = getWeakestModalities(latestScores);
  const breakdownByModality = {} as AllocationProposal['breakdownByModality'];

  // Filter approved bank (preferring student's class if available, falling back to all approved)
  const eligibleBank = approvedBank.filter((a) => a.approvalStatus === 'Approved');
  const pendingIds = new Set(pendingCarryForward.map((n) => n.activityId));

  // Build desired new items list: prioritize weakest modalities first so if truncated by carry-forward, weakest get priority
  const orderedModalities = [
    ...weakestModalities,
    ...ALL_MODALITIES.filter((m) => !weakestModalities.includes(m)),
  ];

  const desiredNewItems: ActivityItem[] = [];

  for (const modality of ALL_MODALITIES) {
    const isWeakest = weakestModalities.includes(modality);
    breakdownByModality[modality] = {
      isWeakest,
      gamesCount: isWeakest ? 2 : 1,
      questionSetsCount: 1,
      questionsPerSet: isWeakest ? 10 : 5,
    };
  }

  for (const modality of orderedModalities) {
    const spec = breakdownByModality[modality];

    const pickActivities = (
      category: 'games_puzzles' | 'question_sets',
      count: number
    ): ActivityItem[] => {
      const candidates = eligibleBank.filter(
        (a) =>
          a.modality === modality &&
          a.category === category &&
          !pendingIds.has(a.id) &&
          !desiredNewItems.some((d) => d.id === a.id)
      );
      // Prefer same class first
      const sorted = [...candidates].sort((a, b) => {
        const aMatch = studentClassName && a.className === studentClassName ? 0 : 1;
        const bMatch = studentClassName && b.className === studentClassName ? 0 : 1;
        return aMatch - bMatch;
      });
      return sorted.slice(0, count);
    };

    const games = pickActivities('games_puzzles', spec.gamesCount);
    const qSets = pickActivities('question_sets', spec.questionSetsCount);
    desiredNewItems.push(...games, ...qSets);
  }

  const remainingSlots = Math.max(0, MAX_DAILY_ACTIVITIES - pendingCarryForward.length);
  const wasTruncated = desiredNewItems.length > remainingSlots;
  const proposedNewActivities = desiredNewItems.slice(0, remainingSlots);
  const totalCount = pendingCarryForward.length + proposedNewActivities.length;

  let truncationReason: string | undefined;
  if (wasTruncated) {
    truncationReason = `${pendingCarryForward.length} incomplete activit${
      pendingCarryForward.length === 1 ? 'y was' : 'ies were'
    } carried forward from earlier days. To respect the maximum of ${MAX_DAILY_ACTIVITIES} daily activities, new assignments were reduced from ${desiredNewItems.length} to ${proposedNewActivities.length} slots (prioritizing weakest modalities).`;
  }

  return {
    studentId,
    weakestModalities,
    carriedForwardNodes: pendingCarryForward,
    proposedNewActivities,
    totalCount,
    maxLimit: MAX_DAILY_ACTIVITIES,
    wasTruncated,
    truncationReason,
    breakdownByModality,
  };
}
