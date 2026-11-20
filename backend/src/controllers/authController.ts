import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  adminLoginSchema,
  changePasswordSchema,
  changePinSchema,
  resetPasswordSchema,
  studentLoginSchema,
  studentRegisterSchema,
  verifyPinSchema,
} from '../validators/schemas';
import { mapDbStudent } from '../utils/mappers';

const STUDENT_INCLUDE = {
  classGroup: true,
  learningPreferences: { include: { assessmentAttempt: true } },
  difficultyHistory: true,
};

export const authController = {
  async registerStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const body = studentRegisterSchema.parse(req.body);
      const cleanUser = body.username.trim().toLowerCase();

      const existing = await prisma.student.findUnique({ where: { username: cleanUser } });
      if (existing) {
        throw new AppError('That username is already taken. Try adding a number!', 409);
      }

      const cls =
        (await prisma.classGroup.findFirst({ where: { name: body.className } })) ||
        (await prisma.classGroup.findFirst());
      if (!cls) throw new AppError('No class found in database.', 400);

      const passwordHash = await bcrypt.hash(body.password, 10);
      const recoveryPinHash = await bcrypt.hash(body.recoveryPin, 10);

      const created = await prisma.student.create({
        data: {
          name: body.name.trim(),
          username: cleanUser,
          classId: cls.id,
          passwordHash,
          recoveryPinHash,
          avatarMascot: 'vee',
          status: 'Active',
          stars: 20,
          completedActivitiesCount: 0,
          badges: ['New Explorer'],
        },
        include: STUDENT_INCLUDE,
      });

      const token = signToken({
        userId: created.id,
        role: 'student',
        usernameOrEmail: created.username,
        classId: created.classId,
      });

      res.status(201).json({ success: true, token, student: mapDbStudent(created) });
    } catch (err) {
      next(err);
    }
  },

  async loginStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const body = studentLoginSchema.parse(req.body);
      const cleanUser = body.username.trim().toLowerCase();
      const student = await prisma.student.findUnique({
        where: { username: cleanUser },
        include: STUDENT_INCLUDE,
      });

      if (!student) throw new AppError('No student account found with that username.', 401);
      if (student.status === 'Inactive') {
        throw new AppError('This student account is currently inactive. Ask your Admin to activate it.', 403);
      }

      const valid = await bcrypt.compare(body.password, student.passwordHash);
      if (!valid) {
        throw new AppError('Incorrect password. Please try again or use Forgot Password.', 401);
      }

      const token = signToken({
        userId: student.id,
        role: 'student',
        usernameOrEmail: student.username,
        classId: student.classId,
      });

      res.json({ success: true, token, student: mapDbStudent(student) });
    } catch (err) {
      next(err);
    }
  },

  async loginAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const body = adminLoginSchema.parse(req.body);
      const admin = await prisma.admin.findUnique({
        where: { email: body.email.trim().toLowerCase() },
      });
      if (!admin) throw new AppError('Invalid admin email or password.', 401);

      const valid = await bcrypt.compare(body.password, admin.passwordHash);
      if (!valid) throw new AppError('Invalid admin email or password.', 401);

      const token = signToken({
        userId: admin.id,
        role: 'admin',
        usernameOrEmail: admin.email,
      });

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          roleTitle: admin.roleTitle,
          institution: admin.institution,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyRecoveryPin(req: Request, res: Response, next: NextFunction) {
    try {
      const body = verifyPinSchema.parse(req.body);
      const student = await prisma.student.findUnique({
        where: { username: body.username.trim().toLowerCase() },
      });
      if (!student) throw new AppError('Username not found.', 404);

      const valid = await bcrypt.compare(body.recoveryPin, student.recoveryPinHash);
      if (!valid) throw new AppError('Incorrect Recovery PIN. Please check your 4-digit PIN.', 401);

      res.json({ success: true, verified: true });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = resetPasswordSchema.parse(req.body);
      const student = await prisma.student.findUnique({
        where: { username: body.username.trim().toLowerCase() },
      });
      if (!student) throw new AppError('Username not found.', 404);

      const validPin = await bcrypt.compare(body.recoveryPin, student.recoveryPinHash);
      if (!validPin) throw new AppError('Incorrect Recovery PIN.', 401);

      const passwordHash = await bcrypt.hash(body.newPassword, 10);
      await prisma.student.update({
        where: { id: student.id },
        data: { passwordHash },
      });

      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = changePasswordSchema.parse(req.body);
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
      if (!student) throw new AppError('Student not found.', 404);

      const valid = await bcrypt.compare(body.currentPassword, student.passwordHash);
      if (!valid) throw new AppError('Current password does not match.', 400);

      const passwordHash = await bcrypt.hash(body.newPassword, 10);
      const updated = await prisma.student.update({
        where: { id: student.id },
        data: { passwordHash },
        include: STUDENT_INCLUDE,
      });

      res.json({ success: true, student: mapDbStudent(updated) });
    } catch (err) {
      next(err);
    }
  },

  async changeRecoveryPin(req: Request, res: Response, next: NextFunction) {
    try {
      const body = changePinSchema.parse(req.body);
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
      if (!student) throw new AppError('Student not found.', 404);

      const valid = await bcrypt.compare(body.currentPin, student.recoveryPinHash);
      if (!valid) throw new AppError('Current Recovery PIN does not match.', 400);

      const recoveryPinHash = await bcrypt.hash(body.newPin, 10);
      const updated = await prisma.student.update({
        where: { id: student.id },
        data: { recoveryPinHash },
        include: STUDENT_INCLUDE,
      });

      res.json({ success: true, student: mapDbStudent(updated) });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role === 'admin') {
        const admin = await prisma.admin.findUnique({ where: { id: req.user!.userId } });
        if (!admin) throw new AppError('Admin not found.', 404);
        return res.json({
          success: true,
          role: 'admin',
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            roleTitle: admin.roleTitle,
            institution: admin.institution,
          },
        });
      }

      const student = await prisma.student.findUnique({
        where: { id: req.user!.userId },
        include: STUDENT_INCLUDE,
      });
      if (!student) throw new AppError('Student not found.', 404);
      res.json({ success: true, role: 'student', student: mapDbStudent(student) });
    } catch (err) {
      next(err);
    }
  },
};
