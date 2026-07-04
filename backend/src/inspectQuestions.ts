import prisma from './lib/prisma';

async function countQuestions() {
  const count = await prisma.codingQuestion.count();
  console.log(`=== DATABASE QUESTIONS COUNT ===`);
  console.log(`Total coding questions: ${count}`);
}

countQuestions();
