import prisma from '../lib/prisma';
import { CreateUserDto } from '../validators/users.validator';

export class UsersRepository {
  async create(data: CreateUserDto & { password?: string }) {
    const firstName = data.name.split(' ')[0] || 'First';
    const lastName = data.name.split(' ')[1] || 'Last';
    const roleName = data.role || 'RECRUITER';

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: 'mock_hashed_password', // Temporary value, will be hashed in AuthService
        role: {
          connectOrCreate: {
            where: { name: roleName },
            create: { name: roleName },
          },
        },
        ...(roleName === 'CANDIDATE'
          ? {
              candidateProfile: {
                create: { firstName, lastName },
              },
            }
          : {
              recruiterProfile: {
                create: {
                  firstName,
                  lastName,
                  company: {
                    connectOrCreate: {
                      where: { name: 'Default Company' },
                      create: { name: 'Default Company' },
                    },
                  },
                },
              },
            }),
      },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }

  async findAll() {
    return prisma.user.findMany({
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.user.count();
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }

  async findByVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: { verificationToken: token },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }

  async findByResetToken(token: string) {
    return prisma.user.findFirst({
      where: { resetPasswordToken: token },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
        role: true,
      },
    });
  }
}

export const usersRepository = new UsersRepository();
export default usersRepository;
