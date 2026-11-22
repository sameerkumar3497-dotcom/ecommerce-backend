import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/AppError';

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ValidationError(details));
    }

    // Replace the raw body with the cleaned, validated data
    req.body = result.data;
    next();
  };
}
