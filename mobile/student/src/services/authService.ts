import { Student } from '../../../../shared/types';
import { SEED_CLASSES, SEED_STUDENTS } from '../../../../shared/mock-data/seedData';
import { API_CONFIG, TOKEN_KEY, apiRequest, simulatedDelay } from './apiClient';
import { storageService } from './storageService';

const STUDENTS_KEY = 'varchlearn_mock_students_v1';
const SESSION_KEY = 'varchlearn_mock_session_v1';

async function loadStudents(): Promise<Student[]> {
  const stored = await storageService.getItem<Student[]>(STUDENTS_KEY);
  if (stored && stored.length > 0) return stored;
  await storageService.setItem(STUDENTS_KEY, SEED_STUDENTS);
  return SEED_STUDENTS;
}

export const authService = {
  async login(username: string, password: string): Promise<Student> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ token: string; student: Student }>('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      await storageService.setItem(TOKEN_KEY, res.token);
      return res.student;
    }

    await simulatedDelay(300);
    const cleanUser = username.trim().toLowerCase();
    const students = await loadStudents();
    const found = students.find((s) => s.username.toLowerCase() === cleanUser);
    if (!found) throw new Error('No student account found with that username.');
    if (found.status === 'Inactive') throw new Error('This student account is currently inactive.');
    if (found.passwordHash !== password) throw new Error('Incorrect password.');
    await storageService.setItem(SESSION_KEY, found.id);
    return found;
  },

  async register(input: {
    name: string;
    username: string;
    className: string;
    password: string;
    recoveryPin: string;
  }): Promise<Student> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ token: string; student: Student }>('/auth/student/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await storageService.setItem(TOKEN_KEY, res.token);
      return res.student;
    }

    await simulatedDelay(350);
    const students = await loadStudents();
    const cleanUser = input.username.trim().toLowerCase();
    if (students.some((s) => s.username.toLowerCase() === cleanUser)) {
      throw new Error('That username is already taken. Try adding a number!');
    }
    const cls = SEED_CLASSES.find((c) => c.name === input.className) || SEED_CLASSES[1];
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      name: input.name.trim(),
      username: cleanUser,
      classId: cls.id,
      className: cls.name,
      passwordHash: input.password,
      recoveryPin: input.recoveryPin,
      avatarMascot: 'vee',
      status: 'Active',
      registrationDate: new Date().toISOString().slice(0, 10),
      stars: 20,
      completedActivitiesCount: 0,
      badges: ['New Explorer'],
      latestAssessmentResult: null,
      assessmentHistory: [],
      currentAdaptedDifficulty: { visual: 'Easy', auditory: 'Easy', read_write: 'Easy', kinesthetic: 'Easy' },
      difficultyHistory: [],
    };
    await storageService.setItem(STUDENTS_KEY, [...students, newStudent]);
    await storageService.setItem(SESSION_KEY, newStudent.id);
    return newStudent;
  },

  async restoreSession(): Promise<Student | null> {
    if (!API_CONFIG.useMockApi) {
      const token = await storageService.getItem<string>(TOKEN_KEY);
      if (!token) return null;
      try {
        const res = await apiRequest<{ role: string; student?: Student }>('/auth/me');
        return res.student || null;
      } catch {
        await storageService.removeItem(TOKEN_KEY);
        return null;
      }
    }

    const id = await storageService.getItem<string>(SESSION_KEY);
    if (!id) return null;
    const students = await loadStudents();
    return students.find((s) => s.id === id) || null;
  },

  async logout(): Promise<void> {
    await storageService.removeItem(TOKEN_KEY);
    await storageService.removeItem(SESSION_KEY);
  },

  async verifyRecoveryPin(username: string, pin: string): Promise<void> {
    if (!API_CONFIG.useMockApi) {
      await apiRequest('/auth/student/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ username, recoveryPin: pin }),
      });
      return;
    }

    await simulatedDelay(250);
    const students = await loadStudents();
    const found = students.find((s) => s.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) throw new Error('Username not found.');
    if (found.recoveryPin !== pin.trim()) throw new Error('Incorrect Recovery PIN.');
  },

  async resetPassword(username: string, newPassword: string, recoveryPin = '1234'): Promise<void> {
    if (!API_CONFIG.useMockApi) {
      await apiRequest('/auth/student/reset-password', {
        method: 'POST',
        body: JSON.stringify({ username, recoveryPin, newPassword }),
      });
      return;
    }

    await simulatedDelay(250);
    const students = await loadStudents();
    const updated = students.map((s) =>
      s.username.toLowerCase() === username.trim().toLowerCase() ? { ...s, passwordHash: newPassword } : s
    );
    await storageService.setItem(STUDENTS_KEY, updated);
  },

  async changePassword(studentId: string, currentPassword: string, newPassword: string): Promise<Student> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ student: Student }>('/auth/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return res.student;
    }

    await simulatedDelay(250);
    const students = await loadStudents();
    const target = students.find((s) => s.id === studentId);
    if (!target || target.passwordHash !== currentPassword) throw new Error('Current password does not match.');
    const updatedStudent = { ...target, passwordHash: newPassword };
    await storageService.setItem(STUDENTS_KEY, students.map((s) => (s.id === studentId ? updatedStudent : s)));
    return updatedStudent;
  },

  async changeRecoveryPin(studentId: string, currentPin: string, newPin: string): Promise<Student> {
    if (!API_CONFIG.useMockApi) {
      const res = await apiRequest<{ student: Student }>('/auth/student/change-pin', {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      });
      return res.student;
    }

    await simulatedDelay(250);
    const students = await loadStudents();
    const target = students.find((s) => s.id === studentId);
    if (!target || target.recoveryPin !== currentPin) throw new Error('Current Recovery PIN does not match.');
    const updatedStudent = { ...target, recoveryPin: newPin };
    await storageService.setItem(STUDENTS_KEY, students.map((s) => (s.id === studentId ? updatedStudent : s)));
    return updatedStudent;
  },

  async updateStudentRecord(updatedStudent: Student): Promise<void> {
    if (!API_CONFIG.useMockApi) {
      await apiRequest(`/students/${updatedStudent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: updatedStudent.name,
          avatarMascot: updatedStudent.avatarMascot,
        }),
      });
      return;
    }

    const students = await loadStudents();
    await storageService.setItem(
      STUDENTS_KEY,
      students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  },
};
