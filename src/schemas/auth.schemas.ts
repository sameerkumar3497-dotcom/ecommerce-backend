import { z } from 'zod';

// Trims spaces, lowercases, then checks it looks like an email
const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'A valid email is required' }));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must be at most 100 characters' }),
  email: emailField,
  password: z
    .string({ error: 'Password is required' })
    .min(8, { error: 'Password must be at least 8 characters' })
    .max(72, { error: 'Password must be at most 72 characters' }),
});

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: 'Password is required' })
    .min(1, { error: 'Password is required' })
    .max(72, { error: 'Password must be at most 72 characters' }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, { error: 'Refresh token is required' })
    .max(200, { error: 'Refresh token is invalid' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
