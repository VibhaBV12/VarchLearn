import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ENV } from '../config/env';
import { AppError } from './errorHandler';

const uploadPath = path.resolve(process.cwd(), ENV.uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

export const pdfUpload = multer({
  storage,
  limits: {
    fileSize: ENV.maxPdfSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new AppError('Only PDF files are allowed for textbook uploads.', 400));
    }
    cb(null, true);
  },
});
