import { ModalityKey, ApprovalStatus, Student, ActivityItem, Assessment, DailyPathNode } from '../../../shared/types';

export function dbApprovalToFrontend(status: string): ApprovalStatus {
  if (status === 'Pending_Review') return 'Pending Review';
  return status as ApprovalStatus;
}

export function frontendApprovalToDb(status: ApprovalStatus): 'Approved' | 'Pending_Review' | 'Rejected' | 'Archived' {
  if (status === 'Pending Review') return 'Pending_Review';
  return status;
}

export function mapDbActivity(a: any): ActivityItem {
  return {
    id: a.id,
    name: a.name,
    modality: a.modality,
    category: a.category,
    gameType: a.gameType,
    className: a.className,
    subject: a.subject,
    chapter: a.chapter,
    topic: a.topic,
    subtopic: a.subtopic ?? undefined,
    originalDifficulty: a.originalDifficulty,
    difficulty: a.difficulty,
    targetAbility: a.targetAbility,
    scoringMethod: a.scoringMethod,
    approvalStatus: dbApprovalToFrontend(a.approvalStatus),
    textbookSource: a.textbookSource ?? undefined,
    aiGenerated: a.aiGenerated,
    estimatedMinutes: a.estimatedMinutes,
    starReward: a.starReward,
    customization: a.customization,
    questions: a.questions
      ? a.questions
          .sort((q1: any, q2: any) => q1.orderIndex - q2.orderIndex)
          .map((q: any) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            hint: q.hint ?? undefined,
            explanation: q.explanation ?? undefined,
          }))
      : undefined,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString().slice(0, 10) : String(a.createdAt),
  };
}

export function mapDbStudent(s: any): Student {
  const history = (s.learningPreferences || [])
    .slice()
    .sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((lp: any) => ({
      id: lp.id,
      assessmentId: lp.assessmentAttempt?.assessmentId || lp.assessmentAttemptId,
      assessmentName: lp.assessmentName,
      studentId: lp.studentId,
      completedAt: lp.recordedAt instanceof Date ? lp.recordedAt.toISOString().slice(0, 10) : String(lp.recordedAt),
      scores: {
        visual: lp.visual,
        auditory: lp.auditory,
        read_write: lp.readWrite,
        kinesthetic: lp.kinesthetic,
      },
      totalTimeSeconds: lp.totalTimeSeconds,
      scoringMethodUsed: lp.scoringMethodUsed,
    }));

  const latestAssessmentResult = history.length > 0 ? history[history.length - 1] : null;

  return {
    id: s.id,
    name: s.name,
    username: s.username,
    classId: s.classId,
    className: s.classGroup?.name || '',
    passwordHash: '', // Never expose passwordHash to client
    recoveryPin: '',  // Never expose recoveryPinHash to client
    avatarMascot: s.avatarMascot,
    status: s.status,
    registrationDate:
      s.registrationDate instanceof Date
        ? s.registrationDate.toISOString().slice(0, 10)
        : String(s.registrationDate),
    stars: s.stars,
    completedActivitiesCount: s.completedActivitiesCount,
    badges: s.badges || [],
    latestAssessmentResult,
    assessmentHistory: history,
    currentAdaptedDifficulty: (s.adaptedDifficulty as Record<ModalityKey, any>) || {
      visual: 'Easy',
      auditory: 'Easy',
      read_write: 'Easy',
      kinesthetic: 'Easy',
    },
    difficultyHistory: (s.difficultyHistory || []).map((dh: any) => ({
      id: dh.id,
      date: dh.adjustedAt instanceof Date ? dh.adjustedAt.toISOString().slice(0, 10) : String(dh.adjustedAt),
      modality: dh.modality,
      fromDifficulty: dh.fromDifficulty,
      toDifficulty: dh.toDifficulty,
      reason: dh.reason,
    })),
  };
}

export function mapDbAssessment(a: any): Assessment {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    targetClassIds: (a.classes || []).map((c: any) => c.classId),
    targetClassNames: (a.classes || []).map((c: any) => c.classGroup?.name || ''),
    activities: (a.activities || [])
      .slice()
      .sort((x: any, y: any) => x.orderIndex - y.orderIndex)
      .map((cfg: any) => ({
        activityId: cfg.activityId,
        activity: mapDbActivity(cfg.activity),
        order: cfg.orderIndex,
        scoringMethod: cfg.scoringMethod,
      })),
    status: a.status,
    publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : undefined,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString().slice(0, 10) : String(a.createdAt),
    allowRetake: a.allowRetake,
    retakeCondition: a.retakeCondition,
  };
}

export function mapDbDailyNode(n: any): DailyPathNode {
  return {
    id: n.id,
    activityId: n.activityId,
    activity: mapDbActivity(n.activity),
    assignedDate: n.assignedDate,
    isCarriedForward: n.isCarriedForward,
    status: n.status,
    completedAt: n.completedAt ? new Date(n.completedAt).toISOString() : undefined,
    earnedStars: n.earnedStars ?? undefined,
    orderIndex: n.orderIndex,
  };
}
