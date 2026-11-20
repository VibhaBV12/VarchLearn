import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityItem,
  AdminSettings,
  ApprovalStatus,
  Assessment,
  ClassGroup,
  DailyPathNode,
  Student,
} from '../../../shared/types';
import {
  SEED_AARAV_DAILY_PATH,
  SEED_ACTIVITY_BANK,
  SEED_ADMIN_SETTINGS,
  SEED_ASSESSMENTS,
  SEED_CLASSES,
  SEED_STUDENTS,
} from '../../../shared/mock-data/seedData';
import { ADMIN_API_CONFIG, ADMIN_TOKEN_KEY, adminApiRequest } from '../services/apiClient';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  institution: string;
}

interface AdminContextValue {
  adminUser: AdminUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;

  classes: ClassGroup[];
  students: Student[];
  activityBank: ActivityItem[];
  assessments: Assessment[];
  settings: AdminSettings;
  studentPendingNodes: Record<string, DailyPathNode[]>;
  publishedAssignments: Record<string, DailyPathNode[]>;

  addClass: (cls: Omit<ClassGroup, 'id' | 'createdAt'>) => void;
  updateClass: (cls: ClassGroup) => void;

  addStudent: (stu: Omit<Student, 'id' | 'registrationDate'>) => void;
  updateStudent: (stu: Student) => void;
  toggleStudentStatus: (id: string) => void;
  removeStudent: (id: string) => void;

  addActivityToBank: (act: ActivityItem) => void;
  updateActivity: (act: ActivityItem) => Promise<void>;
  setActivityApproval: (id: string, status: ApprovalStatus) => Promise<void>;

  saveAssessment: (asmt: Assessment) => void;
  publishAssessment: (id: string) => void;

  publishDailyAssignment: (studentId: string, nodes: DailyPathNode[]) => void;
  updateSettings: (next: AdminSettings) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(
    ADMIN_API_CONFIG.useMockApi
      ? { id: 'admin-mock', ...SEED_ADMIN_SETTINGS.adminProfile }
      : null
  );
  const [authLoading, setAuthLoading] = useState(!ADMIN_API_CONFIG.useMockApi);

  const [classes, setClasses] = useState<ClassGroup[]>(ADMIN_API_CONFIG.useMockApi ? SEED_CLASSES : []);
  const [students, setStudents] = useState<Student[]>(ADMIN_API_CONFIG.useMockApi ? SEED_STUDENTS : []);
  const [activityBank, setActivityBank] = useState<ActivityItem[]>(
    ADMIN_API_CONFIG.useMockApi ? SEED_ACTIVITY_BANK : []
  );
  const [assessments, setAssessments] = useState<Assessment[]>(
    ADMIN_API_CONFIG.useMockApi ? SEED_ASSESSMENTS : []
  );
  const [settings, setSettings] = useState<AdminSettings>(SEED_ADMIN_SETTINGS);

  const [studentPendingNodes] = useState<Record<string, DailyPathNode[]>>({
    'stu-aarav': [SEED_AARAV_DAILY_PATH[0], SEED_AARAV_DAILY_PATH[1]],
  });
  const [publishedAssignments, setPublishedAssignments] = useState<Record<string, DailyPathNode[]>>({});

  const loadAllFromBackend = async () => {
    const [clsRes, stuRes, actRes, asmtRes, setRes] = await Promise.all([
      adminApiRequest<{ classes: ClassGroup[] }>('/classes'),
      adminApiRequest<{ students: Student[] }>('/students'),
      adminApiRequest<{ activities: ActivityItem[] }>('/activities'),
      adminApiRequest<{ assessments: Assessment[] }>('/assessments'),
      adminApiRequest<{ settings: AdminSettings }>('/settings'),
    ]);
    setClasses(clsRes.classes);
    setStudents(stuRes.students);
    setActivityBank(actRes.activities);
    setAssessments(asmtRes.assessments);
    setSettings(setRes.settings);
  };

  useEffect(() => {
    if (ADMIN_API_CONFIG.useMockApi) return;
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAuthLoading(false);
      return;
    }
    adminApiRequest<{ role: string; admin?: AdminUser }>('/auth/me')
      .then(async (res) => {
        if (res.role === 'admin' && res.admin) {
          setAdminUser(res.admin);
          await loadAllFromBackend();
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      })
      .catch(() => localStorage.removeItem(ADMIN_TOKEN_KEY))
      .finally(() => setAuthLoading(false));
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    if (ADMIN_API_CONFIG.useMockApi) {
      setAdminUser({ id: 'admin-mock', ...SEED_ADMIN_SETTINGS.adminProfile });
      return;
    }
    const res = await adminApiRequest<{ token: string; admin: AdminUser }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
    setAdminUser(res.admin);
    await loadAllFromBackend();
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminUser(null);
  };

  const addClass = (cls: Omit<ClassGroup, 'id' | 'createdAt'>) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ classGroup: ClassGroup }>('/classes', {
        method: 'POST',
        body: JSON.stringify(cls),
      }).then((r) => setClasses((prev) => [...prev, r.classGroup]));
      return;
    }
    setClasses((prev) => [...prev, { ...cls, id: `cls-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]);
  };

  const updateClass = (cls: ClassGroup) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ classGroup: ClassGroup }>(`/classes/${cls.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: cls.name, section: cls.section, gradeLevel: cls.gradeLevel }),
      }).then((r) => setClasses((prev) => prev.map((c) => (c.id === cls.id ? r.classGroup : c))));
      return;
    }
    setClasses((prev) => prev.map((c) => (c.id === cls.id ? cls : c)));
  };

  const addStudent = (stu: Omit<Student, 'id' | 'registrationDate'>) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ student: Student }>('/students', {
        method: 'POST',
        body: JSON.stringify(stu),
      }).then((r) => setStudents((prev) => [...prev, r.student]));
      return;
    }
    setStudents((prev) => [...prev, { ...stu, id: `stu-${Date.now()}`, registrationDate: new Date().toISOString().slice(0, 10) }]);
  };

  const updateStudent = (stu: Student) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ student: Student }>(`/students/${stu.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: stu.name, username: stu.username, classId: stu.classId, recoveryPin: stu.recoveryPin }),
      }).then((r) => setStudents((prev) => prev.map((s) => (s.id === stu.id ? r.student : s))));
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === stu.id ? stu : s)));
  };

  const toggleStudentStatus = (id: string) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ student: Student }>(`/students/${id}/toggle-status`, {
        method: 'PATCH',
      }).then((r) => setStudents((prev) => prev.map((s) => (s.id === id ? r.student : s))));
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s)));
  };

  const removeStudent = (id: string) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest(`/students/${id}`, { method: 'DELETE' }).then(() =>
        setStudents((prev) => prev.filter((s) => s.id !== id))
      );
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const addActivityToBank = (act: ActivityItem) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      if (act.aiGenerated) {
        adminApiRequest<{ activity: ActivityItem }>(`/activities/${act.id}/approval`, {
          method: 'PATCH',
          body: JSON.stringify({ approvalStatus: act.approvalStatus }),
        }).then((r) => setActivityBank((prev) => [r.activity, ...prev.filter((a) => a.id !== r.activity.id)]));
      } else {
        adminApiRequest<{ activity: ActivityItem }>('/activities', {
          method: 'POST',
          body: JSON.stringify(act),
        }).then((r) => setActivityBank((prev) => [r.activity, ...prev]));
      }
      return;
    }
    setActivityBank((prev) => [act, ...prev]);
  };

  const updateActivity = async (act: ActivityItem) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      const r = await adminApiRequest<{ activity: ActivityItem }>(`/activities/${act.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: act.name, difficulty: act.difficulty, customization: act.customization }),
      });
      setActivityBank((prev) => {
        const exists = prev.some((a) => a.id === act.id);
        return exists ? prev.map((a) => (a.id === act.id ? r.activity : a)) : [r.activity, ...prev];
      });
      return;
    }
    setActivityBank((prev) => prev.map((a) => (a.id === act.id ? act : a)));
  };

  const setActivityApproval = async (id: string, status: ApprovalStatus) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      const r = await adminApiRequest<{ activity: ActivityItem }>(`/activities/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: status }),
      });
      setActivityBank((prev) => {
        const exists = prev.some((a) => a.id === id);
        return exists ? prev.map((a) => (a.id === id ? r.activity : a)) : [r.activity, ...prev];
      });
      return;
    }
    setActivityBank((prev) => prev.map((a) => (a.id === id ? { ...a, approvalStatus: status } : a)));
  };

  const saveAssessment = (asmt: Assessment) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ assessment: Assessment }>('/assessments', {
        method: 'POST',
        body: JSON.stringify({
          name: asmt.name,
          description: asmt.description,
          targetClassIds: asmt.targetClassIds,
          status: asmt.status,
          allowRetake: asmt.allowRetake,
          retakeCondition: asmt.retakeCondition,
          activities: asmt.activities.map((c) => ({
            activityId: c.activityId,
            order: c.order,
            scoringMethod: c.scoringMethod,
          })),
        }),
      }).then((r) => setAssessments((prev) => [r.assessment, ...prev]));
      return;
    }
    setAssessments((prev) => {
      const exists = prev.some((a) => a.id === asmt.id);
      return exists ? prev.map((a) => (a.id === asmt.id ? asmt : a)) : [asmt, ...prev];
    });
  };

  const publishAssessment = (id: string) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ assessment: Assessment }>(`/assessments/${id}/publish`, {
        method: 'PATCH',
      }).then((r) => setAssessments((prev) => prev.map((a) => (a.id === id ? r.assessment : a))));
      return;
    }
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Published', publishedAt: new Date().toISOString().slice(0, 10) } : a))
    );
  };

  const publishDailyAssignment = (studentId: string, nodes: DailyPathNode[]) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ nodes: DailyPathNode[] }>(`/assignments/publish/${studentId}`, {
        method: 'POST',
        body: JSON.stringify({ activityIds: nodes.filter((n) => !n.isCarriedForward).map((n) => n.activityId) }),
      }).then((r) => setPublishedAssignments((prev) => ({ ...prev, [studentId]: r.nodes })));
      return;
    }
    setPublishedAssignments((prev) => ({ ...prev, [studentId]: nodes }));
  };

  const updateSettings = (next: AdminSettings) => {
    if (!ADMIN_API_CONFIG.useMockApi) {
      adminApiRequest<{ settings: AdminSettings }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      }).then((r) => setSettings(r.settings));
      return;
    }
    setSettings(next);
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        authLoading,
        isAuthenticated: Boolean(adminUser),
        loginAdmin,
        logoutAdmin,
        classes,
        students,
        activityBank,
        assessments,
        settings,
        studentPendingNodes,
        publishedAssignments,
        addClass,
        updateClass,
        addStudent,
        updateStudent,
        toggleStudentStatus,
        removeStudent,
        addActivityToBank,
        updateActivity,
        setActivityApproval,
        saveAssessment,
        publishAssessment,
        publishDailyAssignment,
        updateSettings,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
