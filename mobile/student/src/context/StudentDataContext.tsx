import React, { createContext, useContext, useEffect, useState } from 'react';
import { Assessment, DailyPathNode } from '../../../../shared/types';
import { useAuth } from './AuthContext';
import {
  InitialAssessmentStatusResponse,
  studentDataService,
} from '../services/studentDataService';

interface StudentDataContextValue {
  dailyPath: DailyPathNode[];
  publishedAssessments: Assessment[];
  initialAssessment: InitialAssessmentStatusResponse | null;
  loadingPath: boolean;
  loadingInitialCheck: boolean;
  refreshDailyPath: () => Promise<void>;
  refreshInitialAssessment: () => Promise<void>;
  markInitialAssessmentCompleted: () => void;
  completeNode: (nodeId: string, earnedStars: number) => Promise<void>;
  simulateNextDay: () => Promise<void>;
}

const StudentDataContext = createContext<StudentDataContextValue | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student, updateStudent } = useAuth();
  const [dailyPath, setDailyPath] = useState<DailyPathNode[]>([]);
  const [publishedAssessments, setPublishedAssessments] = useState<Assessment[]>([]);
  const [initialAssessment, setInitialAssessment] = useState<InitialAssessmentStatusResponse | null>(null);
  const [loadingPath, setLoadingPath] = useState(false);
  const [loadingInitialCheck, setLoadingInitialCheck] = useState(false);

  const refreshInitialAssessment = async () => {
    if (!student) {
      setInitialAssessment(null);
      return;
    }
    setLoadingInitialCheck(true);
    try {
      const statusRes = await studentDataService.getInitialAssessmentStatus(student);
      setInitialAssessment(statusRes);
    } finally {
      setLoadingInitialCheck(false);
    }
  };

  const refreshDailyPath = async () => {
    if (!student) {
      setDailyPath([]);
      setPublishedAssessments([]);
      return;
    }
    setLoadingPath(true);
    try {
      const [path, assessments] = await Promise.all([
        studentDataService.getDailyPath(student),
        studentDataService.getPublishedAssessmentsForClass(student.classId),
      ]);
      setDailyPath(path);
      setPublishedAssessments(assessments);
    } finally {
      setLoadingPath(false);
    }
  };

  useEffect(() => {
    if (!student) {
      setInitialAssessment(null);
      setDailyPath([]);
      setPublishedAssessments([]);
      return;
    }
    refreshInitialAssessment();
    refreshDailyPath();
  }, [student?.id]);

  const markInitialAssessmentCompleted = () => {
    setInitialAssessment((prev) => (prev ? { ...prev, status: 'completed' } : prev));
  };

  const completeNode = async (nodeId: string, earnedStars: number) => {
    if (!student) return;
    const updatedPath = await studentDataService.completePathNode(student.id, nodeId, earnedStars);
    setDailyPath(updatedPath);
    const updatedStudent = {
      ...student,
      stars: student.stars + earnedStars,
      completedActivitiesCount: student.completedActivitiesCount + 1,
    };
    await updateStudent(updatedStudent);
  };

  const simulateNextDay = async () => {
    if (!student) return;
    const rolledOver = await studentDataService.simulateNextDayRollover(student);
    setDailyPath(rolledOver);
  };

  return (
    <StudentDataContext.Provider
      value={{
        dailyPath,
        publishedAssessments,
        initialAssessment,
        loadingPath,
        loadingInitialCheck,
        refreshDailyPath,
        refreshInitialAssessment,
        markInitialAssessmentCompleted,
        completeNode,
        simulateNextDay,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudentData must be used within StudentDataProvider');
  return ctx;
}
