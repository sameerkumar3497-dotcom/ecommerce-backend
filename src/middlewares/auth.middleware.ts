import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError } from '../utils/AppError';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = header.slice('Bearer '.length);

  try {
    const { userId, role } = verifyAccessToken(token);
    req.user = { id: userId, role };
    next();
  } catch {
    // Wrong signature, tampered, malformed or expired
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
