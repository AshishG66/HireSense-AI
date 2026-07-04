import { PrismaClient } from '@prisma/client';
import env from './config/env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

async function testCreate() {
  try {
    const email = `test_db_err_${Date.now()}@example.com`;
    console.log('Attempting to create user with email:', email);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'test_hash',
        role: {
          connectOrCreate: {
            where: { name: 'CANDIDATE' },
            create: { name: 'CANDIDATE' },
          },
        },
        candidateProfile: {
          create: { firstName: 'Test', lastName: 'User' },
        },
      },
    });
    console.log('Success:', user);
  } catch (err: any) {
    console.error('FAILED WITH ERROR:');
    console.error(err);
  }
}

testCreate().catch(console.error).finally(() => prisma.$disconnect());
