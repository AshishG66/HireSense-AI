import prisma from '../lib/prisma';

export class RefreshTokensRepository {
  async save(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async find(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async delete(token: string) {
    return prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteManyForUser(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

export const refreshTokensRepository = new RefreshTokensRepository();
export default refreshTokensRepository;
