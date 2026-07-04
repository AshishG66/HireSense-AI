import prisma from './lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, recruiterProfile: true, candidateProfile: true },
  });
  console.log('--- USERS ---');
  users.forEach((u) => {
    console.log(`Email: ${u.email}, Role: ${u.role.name}, Verified: ${u.isEmailVerified}`);
  });

  const jobs = await prisma.job.findMany({
    include: { company: true },
  });
  console.log('--- JOBS ---');
  jobs.forEach((j) => {
    console.log(`Title: ${j.title}, Company: ${j.company.name}, Status: ${j.status}`);
  });

  const codingQuestions = await prisma.codingQuestion.findMany();
  console.log('--- CODING QUESTIONS ---');
  codingQuestions.forEach((q) => {
    console.log(`Title: ${q.title}, Category: ${q.category}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
