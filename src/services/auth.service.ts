import { Prisma } from '../generated/prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/AppError';

type RegisterInput = { name: string; email: string; password: string };

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
};
