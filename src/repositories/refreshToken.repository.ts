import { prisma } from '../config/prisma';

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  // Revokes the token only if it is still active.
  // Returns true if THIS call revoked it, false if it was already revoked.
  async revokeIfActive(id: string): Promise<boolean> {
    const { count } = await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
