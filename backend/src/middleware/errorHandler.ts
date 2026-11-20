import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err?.statusCode || (err?.name === 'ZodError' ? 400 : 500);
  const message =
    err?.name === 'ZodError'
      ? err.issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ')
      : err?.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('[VarchLearn API Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
