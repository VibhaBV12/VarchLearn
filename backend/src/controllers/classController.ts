import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { classSchema } from '../validators/schemas';
import { getRequiredParam } from '../utils/params';

export const classController = {
  async listClasses(_req: Request, res: Response, next: NextFunction) {
    try {
      const classes = await prisma.classGroup.findMany({
        include: { _count: { select: { students: true } } },
        orderBy: { gradeLevel: 'asc' },
      });
      res.json({
        success: true,
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          section: c.section,
          gradeLevel: c.gradeLevel,
          subjects: c.subjects,
          studentCount: c._count.students,
          createdAt: c.createdAt.toISOString().slice(0, 10),
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const body = classSchema.parse(req.body);
      const created = await prisma.classGroup.create({
        data: body,
        include: { _count: { select: { students: true } } },
      });
      res.status(201).json({
        success: true,
        classGroup: {
          id: created.id,
          name: created.name,
          section: created.section,
          gradeLevel: created.gradeLevel,
          subjects: created.subjects,
          studentCount: created._count.students,
          createdAt: created.createdAt.toISOString().slice(0, 10),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = getRequiredParam(req.params.id, 'id');
      const body = classSchema.partial().parse(req.body);
      const updated = await prisma.classGroup.update({
        where: { id: classId },
        data: body,
        include: { _count: { select: { students: true } } },
      });
      res.json({
        success: true,
        classGroup: {
          id: updated.id,
          name: updated.name,
          section: updated.section,
          gradeLevel: updated.gradeLevel,
          subjects: updated.subjects,
          studentCount: updated._count.students,
          createdAt: updated.createdAt.toISOString().slice(0, 10),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
