import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import env from './config/env';

const dbUrl = env.DATABASE_URL.includes('?') 
  ? `${env.DATABASE_URL}&connection_limit=1`
  : `${env.DATABASE_URL}?connection_limit=1`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

const BACKEND_URL = 'http://localhost:5000/api/v1';

async function retryPrisma<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.log(`Prisma query failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

async function runTests() {
  console.log('=== STARTING AUTOMATED END-TO-END WORKFLOW VERIFICATION ===\n');

  const timestamp = Date.now();
  const candidateEmail = `candidate_${timestamp}@test.com`;
  const recruiterEmail = `recruiter_${timestamp}@test.com`;
  const password = 'password123';

  let candidateToken = '';
  let candidateId = '';
  let recruiterToken = '';
  let recruiterId = '';
  let recruiterProfileId = '';
  let jobId = '';
  let resumeId = '';
  let versionId = '';
  let sessionId = '';
  let questionId = '';
  let codingQuestionId = '';
  let codingTestId = '';

  const results: { step: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  const addResult = (step: string, status: 'PASS' | 'FAIL', error?: string) => {
    results.push({ step, status, error });
    console.log(`[${status}] ${step}${error ? ` - Error: ${error}` : ''}`);
  };

  // Helper axios clients
  const client = axios.create({ baseURL: BACKEND_URL });

  // 1. Candidate Registration
  try {
    const res = await client.post('/auth/register', {
      name: 'Candidate E2E Test',
      email: candidateEmail,
      password,
      role: 'CANDIDATE',
    });
    candidateId = res.data.data.user.id;
    addResult('Candidate Registration', 'PASS');
  } catch (err: any) {
    addResult('Candidate Registration', 'FAIL', err.response?.data?.message || err.message);
  }

  // 2. Candidate Login
  try {
    const res = await client.post('/auth/login', {
      email: candidateEmail,
      password,
    });
    candidateToken = res.data.data.accessToken;
    addResult('Candidate Login', 'PASS');
  } catch (err: any) {
    addResult('Candidate Login', 'FAIL', err.response?.data?.message || err.message);
  }

  // 3. Recruiter Registration
  try {
    const res = await client.post('/auth/register', {
      name: 'Recruiter E2E Test',
      email: recruiterEmail,
      password,
      role: 'RECRUITER',
    });
    recruiterId = res.data.data.user.id;
    addResult('Recruiter Registration', 'PASS');
  } catch (err: any) {
    addResult('Recruiter Registration', 'FAIL', err.response?.data?.message || err.message);
  }

  // 4. Recruiter Login
  try {
    const res = await client.post('/auth/login', {
      email: recruiterEmail,
      password,
    });
    recruiterToken = res.data.data.accessToken;
    addResult('Recruiter Login', 'PASS');
  } catch (err: any) {
    addResult('Recruiter Login', 'FAIL', err.response?.data?.message || err.message);
  }

  // Promote another user to ADMIN in DB for testing
  const adminEmail = `admin_${timestamp}@test.com`;
  let adminToken = '';
  try {
    const res = await client.post('/auth/register', {
      name: 'Admin E2E Test',
      email: adminEmail,
      password,
      role: 'CANDIDATE',
    });
    // Promote candidate to ADMIN in database
    await retryPrisma(() => prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: {
          connectOrCreate: {
            where: { name: 'ADMIN' },
            create: { name: 'ADMIN' },
          },
        },
      },
    }));
    // Now log in as admin
    const loginRes = await client.post('/auth/login', {
      email: adminEmail,
      password,
    });
    adminToken = loginRes.data.data.accessToken;
    addResult('Admin User Creation and Login', 'PASS');
  } catch (err: any) {
    addResult('Admin User Creation and Login', 'FAIL', err.response?.data?.message || err.message);
  }

  // Get Recruiter Profile Id
  if (recruiterToken) {
    try {
      const userRes = await retryPrisma(() => prisma.user.findUnique({
        where: { email: recruiterEmail },
        include: { recruiterProfile: true },
      }));
      recruiterProfileId = userRes?.recruiterProfile?.id || '';
    } catch (err: any) {
      console.error('Failed to get recruiter profile id', err);
    }
  }

  // 5. Recruiter Creates Job
  if (recruiterToken) {
    try {
      const res = await client.post(
        '/jobs',
        {
          title: 'Full Stack Engineer (E2E Test)',
          description: 'Responsible for building React + Express web apps.',
          responsibilities: 'Develop new UI components, optimize APIs.',
          requiredSkills: ['React', 'Node.js', 'Express', 'TypeScript'],
          preferredSkills: ['Prisma', 'PostgreSQL', 'Docker'],
          salaryMin: 80000,
          salaryMax: 120000,
          experienceLevel: 'Senior',
          employmentType: 'Full-time',
          location: 'Remote',
          remoteType: 'Remote',
          openings: 2,
          status: 'ACTIVE',
        },
        { headers: { Authorization: `Bearer ${recruiterToken}` } }
      );
      jobId = res.data.data.id;
      addResult('Recruiter Job Creation', 'PASS');
    } catch (err: any) {
      addResult('Recruiter Job Creation', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Recruiter Job Creation', 'FAIL', 'No Recruiter token');
  }

  // 6. Candidate Uploads Resume
  if (candidateToken && jobId) {
    try {
      // Create a form data containing the file upload representation
      const FormData = require('form-data');
      const form = new FormData();
      form.append('title', 'Jane Doe Resume');
      form.append('jobDescription', 'React and Node.js developer job description');
      // We will append a mock text buffer that represents the resume file
      const buffer = Buffer.from('Jane Doe\njane.doe@email.com\nSkills: React, Node.js, Express, TypeScript');
      form.append('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      const res = await client.post('/resumes', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${candidateToken}`,
        },
      });
      resumeId = res.data.data.id;
      versionId = res.data.data.versions?.[0]?.id || '';
      addResult('Candidate Resume Upload', 'PASS');
    } catch (err: any) {
      addResult('Candidate Resume Upload', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Candidate Resume Upload', 'FAIL', 'Missing candidate token or Job ID');
  }

  // 7. Resume Analysis Trigger
  if (candidateToken && versionId) {
    try {
      const res = await client.post(
        `/resumes/versions/${versionId}/analyze`,
        {
          jobDescription: 'React and Node.js developer job description',
        },
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      // Wait for analysis queue to finish (local in-memory queue runs instantly/asynchronously)
      console.log('Waiting for analysis background job...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      addResult('Resume Analysis Trigger', 'PASS');
    } catch (err: any) {
      addResult('Resume Analysis Trigger', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Resume Analysis Trigger', 'FAIL', 'Missing versionId');
  }

  // 8. Candidate starts Mock Interview session
  if (candidateToken) {
    try {
      const res = await client.post(
        '/interviews',
        {
          companyName: 'Tech Corp',
          jobRole: 'Full Stack Engineer',
          difficulty: 'MEDIUM',
          interviewType: 'TECHNICAL',
        },
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      sessionId = res.data.data.id;
      questionId = res.data.data.questions?.[0]?.id || '';
      addResult('Mock Interview Session Start', 'PASS');
    } catch (err: any) {
      addResult('Mock Interview Session Start', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Mock Interview Session Start', 'FAIL', 'No Candidate token');
  }

  // 9. Candidate submits Mock Interview answer
  if (candidateToken && sessionId && questionId) {
    try {
      const res = await client.post(
        `/interviews/${sessionId}/questions/${questionId}/answer`,
        {
          textAnswer: 'I have 5 years of experience building React interfaces with Node.js Express backends, focusing on performance, caching, and database scaling.',
        },
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      addResult('Submit Mock Interview Answer', 'PASS');
    } catch (err: any) {
      addResult('Submit Mock Interview Answer', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Submit Mock Interview Answer', 'FAIL', 'Missing sessionId or questionId');
  }

  // 10. Candidate compiles Mock Interview report
  if (candidateToken && sessionId) {
    try {
      const res = await client.post(
        `/interviews/${sessionId}/report`,
        {},
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      addResult('Compile Mock Interview Report', 'PASS');
    } catch (err: any) {
      addResult('Compile Mock Interview Report', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Compile Mock Interview Report', 'FAIL', 'Missing sessionId');
  }

  // Find a question in database to practice
  try {
    const q = await prisma.codingQuestion.findFirst();
    codingQuestionId = q?.id || '';
  } catch (err: any) {
    console.error('Failed to get coding question', err);
  }

  // 11. Run Code on Coding Assessment
  if (candidateToken && codingQuestionId) {
    try {
      const res = await client.post(
        `/assessments/candidate/questions/${codingQuestionId}/run`,
        {
          code: 'return Number(inputStr) * 2;',
          languageCode: 'javascript',
          input: '5',
        },
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      addResult('Run Code on Coding Workspace', 'PASS');
    } catch (err: any) {
      addResult('Run Code on Coding Workspace', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Run Code on Coding Workspace', 'FAIL', 'Missing codingQuestionId');
  }

  // 12. Submit Code on Coding Assessment
  if (candidateToken && codingQuestionId) {
    try {
      const res = await client.post(
        `/assessments/candidate/questions/${codingQuestionId}/submit`,
        {
          code: 'return Number(inputStr) * 2;',
          languageCode: 'javascript',
        },
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      addResult('Submit Code on Coding Workspace', 'PASS');
    } catch (err: any) {
      addResult('Submit Code on Coding Workspace', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Submit Code on Coding Workspace', 'FAIL', 'Missing codingQuestionId');
  }

  // 13. Recruiter creates Assessment (CodingTest)
  if (recruiterToken && codingQuestionId) {
    try {
      const res = await client.post(
        '/assessments/tests',
        {
          title: 'Algorithmic Test Challenge (E2E Test)',
          description: 'A mock technical test for recruiters.',
          duration: 60,
          passingScore: 60,
          visibility: 'PRIVATE',
          negativeMarking: false,
          randomQuestionOrder: false,
          allowedLanguages: ['javascript', 'python'],
          questions: [
            {
              codingQuestionId: codingQuestionId,
              orderIndex: 1,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${recruiterToken}` } }
      );
      codingTestId = res.data.data.id;
      addResult('Recruiter Create Assessment Test', 'PASS');
    } catch (err: any) {
      addResult('Recruiter Create Assessment Test', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Recruiter Create Assessment Test', 'FAIL', 'Missing recruiterToken or codingQuestionId');
  }

  // 14. Recruiter delete/edit assessments validation
  if (recruiterToken && codingTestId) {
    try {
      // Test edit
      await client.patch(
        `/assessments/tests/${codingTestId}`,
        { visibility: 'PUBLIC' },
        { headers: { Authorization: `Bearer ${recruiterToken}` } }
      );
      // Test delete
      await client.delete(`/assessments/tests/${codingTestId}`, {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      addResult('Recruiter Edit/Delete Assessment', 'PASS');
    } catch (err: any) {
      addResult('Recruiter Edit/Delete Assessment', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Recruiter Edit/Delete Assessment', 'FAIL', 'Missing codingTestId');
  }

  // 15. Recruiter view reports
  if (recruiterToken) {
    try {
      const res = await client.get('/interviews/recruiter/reports', {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      addResult('Recruiter View Screening Reports', 'PASS');
    } catch (err: any) {
      addResult('Recruiter View Screening Reports', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Recruiter View Screening Reports', 'FAIL', 'No Recruiter token');
  }

  // 16. Admin Monitoring Dashboard
  if (adminToken) {
    try {
      const res = await client.get('/monitoring/metrics', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      addResult('Admin View Monitoring Metrics', 'PASS');
    } catch (err: any) {
      addResult('Admin View Monitoring Metrics', 'FAIL', err.response?.data?.message || err.message);
    }
  } else {
    addResult('Admin View Monitoring Metrics', 'FAIL', 'No Admin token');
  }

  console.log('\n=== E2E WORKFLOW TESTS COMPLETED ===');
  console.log('Results Summary:');
  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(`Global status: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
}

runTests().catch(console.error);
