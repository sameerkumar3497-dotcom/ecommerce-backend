import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body ?? {};

      if (
        typeof name !== 'string' ||
        name.trim().length === 0 ||
        name.length > 100
      ) {
        throw new AppError(400, 'Name is required (max 100 characters)');
      }
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        throw new AppError(400, 'A valid email is required');
      }
      if (
        typeof password !== 'string' ||
        password.length < 8 ||
        password.length > 72
      ) {
        throw new AppError(400, 'Password must be 8 to 72 characters');
      }

      const user = await authService.register({ name, email, password });
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body ?? {};

      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        email.length === 0 ||
        password.length === 0 ||
        password.length > 72
      ) {
        throw new AppError(400, 'Email and password are required');
      }

      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
