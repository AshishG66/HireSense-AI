import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  console.log("Setting up users for README screenshots...");
  
  // 1. Get or create roles
  const candidateRole = await prisma.role.upsert({
    where: { name: 'CANDIDATE' },
    update: {},
    create: { name: 'CANDIDATE' }
  });
  
  const recruiterRole = await prisma.role.upsert({
    where: { name: 'RECRUITER' },
    update: {},
    create: { name: 'RECRUITER' }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' }
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Candidate
  const candidate = await prisma.user.upsert({
    where: { email: 'readme_candidate_1@hiresense.ai' },
    update: { passwordHash },
    create: {
      email: 'readme_candidate_1@hiresense.ai',
      passwordHash,
      roleId: candidateRole.id,
      isEmailVerified: true
    }
  });

  // Ensure candidate profile exists
  await prisma.candidateProfile.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      firstName: 'Alex',
      lastName: 'Candidate',
      skills: ['React', 'TypeScript', 'Node.js', 'Express']
    }
  });

  // 3. Recruiter
  // Recruiter needs a company
  const company = await prisma.company.upsert({
    where: { name: 'HireSense Inc.' },
    update: {},
    create: {
      name: 'HireSense Inc.',
      website: 'https://hiresense.ai',
      industry: 'Technology'
    }
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'readme_recruiter_1@hiresense.ai' },
    update: { passwordHash },
    create: {
      email: 'readme_recruiter_1@hiresense.ai',
      passwordHash,
      roleId: recruiterRole.id,
      isEmailVerified: true
    }
  });

  await prisma.recruiterProfile.upsert({
    where: { userId: recruiter.id },
    update: {},
    create: {
      userId: recruiter.id,
      firstName: 'Sarah',
      lastName: 'Recruiter',
      companyId: company.id
    }
  });

  // 4. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'readme_admin_1@hiresense.ai' },
    update: { passwordHash },
    create: {
      email: 'readme_admin_1@hiresense.ai',
      passwordHash,
      roleId: adminRole.id,
      isEmailVerified: true
    }
  });

  console.log("Readme users created / updated successfully!");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
