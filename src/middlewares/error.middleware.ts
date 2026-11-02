import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

// Express recognises an error handler by its 4 parameters, so _next must stay
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
