import {
  ActivityItem,
  AdminSettings,
  Assessment,
  AssessmentResultRecord,
  DailyPathNode,
  ModalityKey,
  ModalityScores,
  Student,
  StudentAssessmentProgress,
} from '../../../../shared/types';
import {
  SEED_AARAV_DAILY_PATH,
  SEED_ACTIVITY_BANK,
  SEED_ADMIN_SETTINGS,
  SEED_ASSESSMENTS,
} from '../../../../shared/mock-data/seedData';
import { computeDailyAllocation, MAX_DAILY_ACTIVITIES } from '../../../../shared/utils/allocationEngine';
import { API_CONFIG, apiRequest, simulatedDelay } from './apiClient';
import { storageService } from './storageService';

const PATH_KEY_PREFIX = 'varchlearn_daily_path_';
const ASMT_PROGRESS_PREFIX = 'varchlearn_asmt_prog_';

export const VARK_SECTION_ORDER: ModalityKey[] = [
  'kinesthetic',
  'auditory',
  'visual',
  'read_write',
];

export function sortAssessmentByVarkOrder(assessment: Assessment): Assessment {
  return {
    ...assessment,
    activities: [...assessment.activities]
      .sort(
        (a, b) =>
          VARK_SECTION_ORDER.indexOf(a.activity.modality) -
          VARK_SECTION_ORDER.indexOf(b.activity.modality)
      )
      .map((cfg, idx) => ({ ...cfg, order: idx + 1 })),
  };
}

export interface InitialAssessmentStatusResponse {
  status: 'not_started' | 'in_progress' | 'completed';
  assessment: Assessment | null;
  progress: StudentAssessmentProgress | null;
  latestResult: AssessmentResultRecord | null;
}

export const studentDataService = {
  async getInitialAssessmentStatus(student: Student): Promise<InitialAssessmentStatusResponse> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<InitialAssessmentStatusResponse>('/assessments/initial/status');
      return {
        ...res,
        assessment: res.assessment ? sortAssessmentByVarkOrder(res.assessment) : null,
      };
    }

    const rawAsmt = SEED_ASSESSMENTS.find(
      (a) => a.status === 'Published' && a.targetClassIds.includes(student.classId)
    );
    if (!rawAsmt) {
      return { status: 'completed', assessment: null, progress: null, latestResult: student.latestAssessmentResult };
    }
    const assessment = sortAssessmentByVarkOrder(rawAsmt);

    if (student.latestAssessmentResult) {
      return {
        status: 'completed',
        assessment,
        progress: {
          assessmentId: assessment.id,
          studentId: student.id,
          status: 'completed',
          currentActivityIndex: assessment.activities.length,
          completedActivityIds: assessment.activities.map((a) => a.activityId),
          activityResults: {},
        },
        latestResult: student.latestAssessmentResult,
      };
    }

    const prog = await this.getAssessmentProgress(student.id, assessment.id);
    return {
      status: prog.status === 'paused' || prog.status === 'in_progress' ? 'in_progress' : 'not_started',
      assessment,
      progress: prog,
      latestResult: null,
    };
  },

  async getDailyPath(student: Student): Promise<DailyPathNode[]> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ nodes: DailyPathNode[] }>(`/assignments/student/${student.id}`);
      return res.nodes;
    }

    await simulatedDelay(180);
    const key = `${PATH_KEY_PREFIX}${student.id}`;
    const existing = await storageService.getItem<DailyPathNode[]>(key);
    if (existing && existing.length > 0) return existing;

    if (student.id === 'stu-aarav') {
      await storageService.setItem(key, SEED_AARAV_DAILY_PATH);
      return SEED_AARAV_DAILY_PATH;
    }

    const proposal = computeDailyAllocation({
      studentId: student.id,
      latestScores: student.latestAssessmentResult?.scores || null,
      pendingCarryForward: [],
      approvedBank: SEED_ACTIVITY_BANK,
      studentClassName: student.className,
    });

    const today = new Date().toISOString().slice(0, 10);
    const nodes: DailyPathNode[] = proposal.proposedNewActivities
      .slice(0, MAX_DAILY_ACTIVITIES)
      .map((activity, idx) => ({
        id: `node-${student.id}-${idx}`,
        activityId: activity.id,
        activity,
        assignedDate: today,
        isCarriedForward: false,
        status: idx === 0 ? 'current' : idx <= 2 ? 'available' : 'locked',
        orderIndex: idx,
      }));

    await storageService.setItem(key, nodes);
    return nodes;
  },

  async completePathNode(
    studentId: string,
    nodeId: string,
    earnedStars: number
  ): Promise<DailyPathNode[]> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ nodes: DailyPathNode[] }>(`/assignments/nodes/${nodeId}/complete`, {
        method: 'POST',
      });
      return res.nodes;
    }

    const key = `${PATH_KEY_PREFIX}${studentId}`;
    const nodes = (await storageService.getItem<DailyPathNode[]>(key)) || [];
    let unlockedNext = false;

    const updated = nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, status: 'completed' as const, completedAt: new Date().toISOString(), earnedStars };
      }
      if (!unlockedNext && (node.status === 'locked' || node.status === 'available')) {
        unlockedNext = true;
        return { ...node, status: 'current' as const };
      }
      return node;
    });

    await storageService.setItem(key, updated);
    return updated;
  },

  async simulateNextDayRollover(student: Student): Promise<DailyPathNode[]> {
    if (!API_CONFIG.useMockApi) {
      return this.getDailyPath(student);
    }

    const key = `${PATH_KEY_PREFIX}${student.id}`;
    const current = (await storageService.getItem<DailyPathNode[]>(key)) || [];
    const pendingCarryForward: DailyPathNode[] = current
      .filter((n) => n.status !== 'completed')
      .map((n, idx) => ({
        ...n,
        isCarriedForward: true,
        status: idx === 0 ? 'current' : idx <= 2 ? 'available' : 'locked',
        orderIndex: idx,
      }));

    const proposal = computeDailyAllocation({
      studentId: student.id,
      latestScores: student.latestAssessmentResult?.scores || null,
      pendingCarryForward,
      approvedBank: SEED_ACTIVITY_BANK,
      studentClassName: student.className,
    });

    const today = new Date().toISOString().slice(0, 10);
    const newNodes: DailyPathNode[] = proposal.proposedNewActivities.map((act, idx) => {
      const orderIndex = pendingCarryForward.length + idx;
      return {
        id: `node-${Date.now()}-${idx}`,
        activityId: act.id,
        activity: act,
        assignedDate: today,
        isCarriedForward: false,
        status: orderIndex === 0 ? 'current' : orderIndex <= 2 ? 'available' : 'locked',
        orderIndex,
      };
    });

    const combined = [...pendingCarryForward, ...newNodes].slice(0, MAX_DAILY_ACTIVITIES);
    await storageService.setItem(key, combined);
    return combined;
  },

  async getActivitiesByModality(modality: ModalityKey): Promise<ActivityItem[]> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ activities: ActivityItem[] }>(`/activities?modality=${modality}`);
      return res.activities;
    }
    await simulatedDelay(120);
    return SEED_ACTIVITY_BANK.filter((a) => a.modality === modality && a.approvalStatus === 'Approved');
  },

  async getPublishedAssessmentsForClass(classId: string): Promise<Assessment[]> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ assessments: Assessment[] }>('/assessments');
      return res.assessments.map(sortAssessmentByVarkOrder);
    }
    await simulatedDelay(150);
    return SEED_ASSESSMENTS.filter((a) => a.status === 'Published' && a.targetClassIds.includes(classId)).map(
      sortAssessmentByVarkOrder
    );
  },

  async getAssessmentProgress(studentId: string, assessmentId: string): Promise<StudentAssessmentProgress> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ progress: StudentAssessmentProgress }>(`/assessments/${assessmentId}/attempt`);
      return res.progress;
    }
    const key = `${ASMT_PROGRESS_PREFIX}${studentId}_${assessmentId}`;
    const saved = await storageService.getItem<StudentAssessmentProgress>(key);
    if (saved) return saved;
    return {
      assessmentId,
      studentId,
      status: 'not_started',
      currentActivityIndex: 0,
      completedActivityIds: [],
      activityResults: {},
    };
  },

  async saveAssessmentProgress(progress: StudentAssessmentProgress): Promise<void> {
    if (!API_CONFIG.useMockApi) {
      await apiRequest(`/assessments/${progress.assessmentId}/attempt`, {
        method: 'PUT',
        body: JSON.stringify(progress),
      });
      return;
    }
    const key = `${ASMT_PROGRESS_PREFIX}${progress.studentId}_${progress.assessmentId}`;
    await storageService.setItem(key, { ...progress, lastSavedAt: new Date().toISOString() });
  },

  async submitAssessment(
    student: Student,
    assessment: Assessment,
    progress: StudentAssessmentProgress
  ): Promise<AssessmentResultRecord> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ result: AssessmentResultRecord }>(
        `/assessments/${assessment.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ activityResults: progress.activityResults }),
        }
      );
      return res.result;
    }

    await simulatedDelay(300);
    const modalityBuckets: Record<ModalityKey, number[]> = { visual: [], auditory: [], read_write: [], kinesthetic: [] };
    let totalTime = 0;

    for (const cfg of assessment.activities) {
      const res = progress.activityResults[cfg.activityId];
      if (res) {
        modalityBuckets[cfg.activity.modality].push(res.scorePercent);
        totalTime += res.timeTakenSeconds;
      }
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0;

    const scores: ModalityScores = {
      kinesthetic: avg(modalityBuckets.kinesthetic),
      auditory: avg(modalityBuckets.auditory),
      visual: avg(modalityBuckets.visual),
      read_write: avg(modalityBuckets.read_write),
    };

    const record: AssessmentResultRecord = {
      id: `res-${Date.now()}`,
      assessmentId: assessment.id,
      assessmentName: assessment.name,
      studentId: student.id,
      completedAt: new Date().toISOString().slice(0, 10),
      scores,
      totalTimeSeconds: totalTime,
      scoringMethodUsed: assessment.activities[0]?.scoringMethod || 'correctness_only',
    };

    await this.saveAssessmentProgress({ ...progress, status: 'completed', completedAt: new Date().toISOString() });
    return record;
  },

  getAdminVisibilitySettings(): AdminSettings['assessmentSettings'] {
    return SEED_ADMIN_SETTINGS.assessmentSettings;
  },
};
