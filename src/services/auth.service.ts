import { Prisma } from '@prisma/client';
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

type RegisterInput = { name: string; email: string; password: string };
type LoginInput = { email: string; password: string };

const DAY_MS = 24 * 60 * 60 * 1000;

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

    const accessToken = signAccessToken(user.id, user.role);

    const refreshToken = generateRefreshToken();
    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * DAY_MS),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },
};
