import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export type AccessTokenPayload = { userId: string; role: Role };

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ role }, env.jwtAccessSecret, {
    subject: userId,
    expiresIn: env.accessTokenTtlSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
  return { userId: payload.sub as string, role: payload.role as Role };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
