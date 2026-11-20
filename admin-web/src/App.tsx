import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassStudentManagementPage } from './pages/ClassStudentManagementPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { ActivityBankPage } from './pages/ActivityBankPage';
import { TextbookAiGenerationPage } from './pages/TextbookAiGenerationPage';
import { ActivityAssignmentPage } from './pages/ActivityAssignmentPage';
import { StudentAnalysisPage } from './pages/StudentAnalysisPage';
import { ClassAnalysisPage } from './pages/ClassAnalysisPage';
import { ProgressAnalysisPage } from './pages/ProgressAnalysisPage';
import { SettingsPage } from './pages/SettingsPage';

const AdminRoutes: React.FC = () => {
  const { isAuthenticated, authLoading } = useAdmin();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6FC] text-[#7041C6] font-bold">
        Loading VarchLearn Admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="classes-students" element={<ClassStudentManagementPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="activity-bank" element={<ActivityBankPage />} />
        <Route path="ai-generation" element={<TextbookAiGenerationPage />} />
        <Route path="activity-assignment" element={<ActivityAssignmentPage />} />
        <Route path="student-analysis" element={<StudentAnalysisPage />} />
        <Route path="class-analysis" element={<ClassAnalysisPage />} />
        <Route path="progress-analysis" element={<ProgressAnalysisPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <AdminRoutes />
      </BrowserRouter>
    </AdminProvider>
  );
}
