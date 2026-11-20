import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthPayload } from '../types/auth';
import { AppError } from './errorHandler';
import { getRequiredParam } from '../utils/params';

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, ENV.jwtSecret, {
    expiresIn: ENV.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required.', 401));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
}

export function requireRole(...roles: Array<'student' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions.', 403));
    }
    next();
  };
}

export function requireSelfOrAdmin(paramKey = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required.', 401));
    if (req.user.role === 'admin') return next();
    const targetId = getRequiredParam(req.params[paramKey], paramKey);
    if (targetId !== req.user.userId) {
      return next(new AppError('Forbidden: you can only access your own records.', 403));
    }
    next();
  };
}
