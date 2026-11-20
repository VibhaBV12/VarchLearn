import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { extractTextbookContent } from '../services/pdfService';

export const textbookController = {
  async listTextbooks(_req: Request, res: Response, next: NextFunction) {
    try {
      const textbooks = await prisma.textbook.findMany({
        include: { chapters: { include: { topics: true }, orderBy: { number: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, textbooks });
    } catch (err) {
      next(err);
    }
  },

  async uploadAndExtractPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('Please attach a PDF file in the "file" field.', 400);
      }
      const className = req.body.className || 'Class 6';
      const subject = req.body.subject || 'Science';

      const extracted = await extractTextbookContent(req.file.path, subject);

      const saved = await prisma.textbook.create({
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSizeBytes: req.file.size,
          className,
          subject,
          pageCount: extracted.pageCount,
          extractedRawText: extracted.rawText,
          uploadedByAdminId: req.user?.userId,
          chapters: {
            create: extracted.chapters.map((ch) => ({
              number: ch.number,
              title: ch.title,
              topics: {
                create: ch.topics.map((t) => ({
                  title: t.title,
                  subtopics: t.subtopics,
                  extractedConcepts: t.extractedConcepts,
                  extractedDiagrams: t.extractedDiagrams,
                })),
              },
            })),
          },
        },
        include: { chapters: { include: { topics: true }, orderBy: { number: 'asc' } } },
      });

      res.status(201).json({ success: true, textbook: saved });
    } catch (err) {
      next(err);
    }
  },

  async listChapters(req: Request, res: Response, next: NextFunction) {
    try {
      const where = req.query.textbookId ? { textbookId: String(req.query.textbookId) } : {};
      const chapters = await prisma.chapter.findMany({
        where,
        include: { topics: true },
        orderBy: { number: 'asc' },
      });
      res.json({ success: true, chapters });
    } catch (err) {
      next(err);
    }
  },
};
