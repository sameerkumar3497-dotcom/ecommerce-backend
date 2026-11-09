import { Prisma, Role } from '@prisma/client';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { hashPassword, comparePassword, DUMMY_HASH } from '../utils/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/tokens';
import { AppError } from '../utils/AppError';

import type { LoginInput, RegisterInput } from '../schemas/auth.schemas';

const DAY_MS = 24 * 60 * 60 * 1000;

// Creates a new access token + a new refresh token (and saves the refresh token's hash)
async function issueTokens(user: { id: string; role: Role }) {
  const accessToken = signAccessToken(user.id, user.role);

  const refreshToken = generateRefreshToken();
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * DAY_MS),
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register({ name, email, password }: RegisterInput) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError(409, 'Email is already registered');
    }

    const passwordHash = await hashPassword(password);

    try {
      return await userRepository.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError(409, 'Email is already registered');
      }
      throw err;
    }
  },

  async login({ email, password }: LoginInput) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase());

    // Always run bcrypt, even if the user doesn't exist (keeps timing equal)
    const passwordOk = await comparePassword(
      password,
      user ? user.passwordHash : DUMMY_HASH,
    );

    if (!user || !passwordOk) {
      throw new AppError(401, 'Invalid email or password');
    }

    const tokens = await issueTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    const stored = await refreshTokenRepository.findByHash(
      hashToken(refreshToken),
    );

    // 1. Token doesn't exist
    if (!stored) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // 2. Token was already used or logged out: possible theft, revoke everything
    if (stored.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new AppError(401, 'Invalid refresh token');
    }

    // 3. Token is too old
    if (stored.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token expired');
    }

    // 4. Atomically mark it used. If someone else got there first, treat it as reuse
    const claimed = await refreshTokenRepository.revokeIfActive(stored.id);
    if (!claimed) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new AppError(401, 'Invalid refresh token');
    }

    // 5. Issue a fresh pair
    return issueTokens(stored.user);
  },

  async logout(refreshToken: string) {
    // Silently does nothing if the token is unknown or already revoked
    await refreshTokenRepository.revokeByHash(hashToken(refreshToken));
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      // Token was valid but the account no longer exists
      throw new AppError(401, 'Authentication required');
    }
    return user;
  },

  async logoutAll(userId: string) {
    await refreshTokenRepository.revokeAllForUser(userId);
  },
};
