import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { AppError, NotFoundError } from '../utils/AppError';

// Runs when no route matched the request
export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError('Route not found'));
}

function sendError(
  res: Response,
  status: number,
  message: string,
  details?: unknown,
): void {
  res.status(status).json({ error: message, ...(details ? { details } : {}) });
}

// Express recognises an error handler by its 4 parameters, so _next must stay
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1. Errors we threw on purpose
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.details);
  }

  // 2. Errors from Express's body parser
  const type =
    typeof err === 'object' && err !== null && 'type' in err
      ? err.type
      : undefined;
  if (type === 'entity.parse.failed') {
    return sendError(res, 400, 'Invalid JSON in request body');
  }
  if (type === 'entity.too.large') {
    return sendError(res, 413, 'Request body is too large');
  }

  // 3. Database errors we can explain safely
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendError(res, 409, 'A record with this value already exists');
    }
    if (err.code === 'P2025') {
      return sendError(res, 404, 'Record not found');
    }
  }

  // 4. Anything else is a bug: log it privately, tell the client nothing
  console.error(err);
  sendError(res, 500, 'Internal server error');
}
