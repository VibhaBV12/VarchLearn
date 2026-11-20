import React, { createContext, useContext, useEffect, useState } from 'react';
import { Student } from '../../../../shared/types';
import { authService } from '../services/authService';

interface AuthContextValue {
  student: Student | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    username: string;
    className: string;
    password: string;
    recoveryPin: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateStudent: (updated: Student) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .restoreSession()
      .then((restored) => setStudent(restored))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const loggedIn = await authService.login(username, password);
    setStudent(loggedIn);
  };

  const register = async (input: {
    name: string;
    username: string;
    className: string;
    password: string;
    recoveryPin: string;
  }) => {
    const created = await authService.register(input);
    setStudent(created);
  };

  const logout = async () => {
    await authService.logout();
    setStudent(null);
  };

  const updateStudent = async (updated: Student) => {
    await authService.updateStudentRecord(updated);
    setStudent(updated);
  };

  return (
    <AuthContext.Provider value={{ student, loading, login, register, logout, updateStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
