import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { mapDbStudent } from '../utils/mappers';
import { getRequiredParam } from '../utils/params';

const INCLUDE = {
  classGroup: true,
  learningPreferences: { include: { assessmentAttempt: true } },
  difficultyHistory: true,
};

export const studentController = {
  async listStudents(_req: Request, res: Response, next: NextFunction) {
    try {
      const students = await prisma.student.findMany({
        include: INCLUDE,
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, students: students.map(mapDbStudent) });
    } catch (err) {
      next(err);
    }
  },

  async getStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.id, 'id');
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: INCLUDE,
      });
      if (!student) throw new AppError('Student not found.', 404);
      res.json({ success: true, student: mapDbStudent(student) });
    } catch (err) {
      next(err);
    }
  },

  async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, username, classId, password = 'learn123', recoveryPin = '1234', avatarMascot = 'vee' } = req.body;
      if (!name || !username || !classId) {
        throw new AppError('name, username, and classId are required.', 400);
      }
      const cleanUser = String(username).trim().toLowerCase();
      const exists = await prisma.student.findUnique({ where: { username: cleanUser } });
      if (exists) throw new AppError('Username already exists.', 409);

      const passwordHash = await bcrypt.hash(password, 10);
      const recoveryPinHash = await bcrypt.hash(recoveryPin, 10);

      const created = await prisma.student.create({
        data: {
          name: String(name).trim(),
          username: cleanUser,
          classId,
          passwordHash,
          recoveryPinHash,
          avatarMascot,
          badges: ['New Explorer'],
        },
        include: INCLUDE,
      });
      res.status(201).json({ success: true, student: mapDbStudent(created) });
    } catch (err) {
      next(err);
    }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.id, 'id');
      const { name, username, classId, avatarMascot, status, recoveryPin } = req.body;
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (username !== undefined && req.user!.role === 'admin') data.username = String(username).trim().toLowerCase();
      if (classId !== undefined && req.user!.role === 'admin') data.classId = classId;
      if (status !== undefined && req.user!.role === 'admin') data.status = status;
      if (avatarMascot !== undefined) data.avatarMascot = avatarMascot;
      if (recoveryPin !== undefined && req.user!.role === 'admin') {
        data.recoveryPinHash = await bcrypt.hash(String(recoveryPin), 10);
      }

      const updated = await prisma.student.update({
        where: { id: studentId },
        data,
        include: INCLUDE,
      });
      res.json({ success: true, student: mapDbStudent(updated) });
    } catch (err) {
      next(err);
    }
  },

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.id, 'id');
      const current = await prisma.student.findUnique({ where: { id: studentId } });
      if (!current) throw new AppError('Student not found.', 404);
      const updated = await prisma.student.update({
        where: { id: current.id },
        data: { status: current.status === 'Active' ? 'Inactive' : 'Active' },
        include: INCLUDE,
      });
      res.json({ success: true, student: mapDbStudent(updated) });
    } catch (err) {
      next(err);
    }
  },

  async removeStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = getRequiredParam(req.params.id, 'id');
      await prisma.student.delete({ where: { id: studentId } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
