export interface AuthPayload {
  userId: string;
  role: 'student' | 'admin';
  usernameOrEmail: string;
  classId?: string;
}
