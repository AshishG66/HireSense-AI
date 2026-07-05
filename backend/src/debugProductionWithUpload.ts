import axios from 'axios';
import FormData from 'form-data';

const BACKEND_URL = 'https://hiresense-backend-eri4.onrender.com/api/v1';

async function debug() {
  const timestamp = Date.now();
  const email = `test_debug_upload_${timestamp}@test.com`;
  const password = 'password123';

  console.log('Registering user...');
  await axios.post(`${BACKEND_URL}/auth/register`, {
    name: 'Debug User',
    email,
    password,
    role: 'CANDIDATE',
  });

  console.log('Logging in...');
  const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
    email,
    password,
  });
  const token = loginRes.data.data.accessToken;

  console.log('Creating job...');
  // We need to create a job first because Resume Upload expects a job ID or at least a job context
  // Wait, let's register a recruiter first to create a job!
  const recruiterEmail = `recruiter_debug_${timestamp}@test.com`;
  await axios.post(`${BACKEND_URL}/auth/register`, {
    name: 'Recruiter Debug',
    email: recruiterEmail,
    password,
    role: 'RECRUITER',
  });
  const recLoginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: recruiterEmail,
    password,
  });
  const recToken = recLoginRes.data.data.accessToken;

  const jobRes = await axios.post(
    `${BACKEND_URL}/jobs`,
    {
      title: 'Full Stack Engineer',
      description: 'React and Node.js developer.',
      responsibilities: 'Develop new UI components, optimize APIs.',
      requiredSkills: ['React', 'Node.js'],
      preferredSkills: ['TypeScript'],
      salaryMin: 80000,
      salaryMax: 120000,
      experienceLevel: 'Senior',
      employmentType: 'Full-time',
      location: 'Remote',
      remoteType: 'Remote',
      openings: 2,
      status: 'ACTIVE',
    },
    { headers: { Authorization: `Bearer ${recToken}` } }
  );
  const jobId = jobRes.data.data.id;

  console.log('Uploading resume...');
  const form = new FormData();
  form.append('title', 'Jane Doe Resume');
  form.append('jobDescription', 'React and Node.js developer job description');
  const buffer = Buffer.from('Jane Doe\njane.doe@email.com\nSkills: React, Node.js, Express, TypeScript');
  form.append('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

  const resumeRes = await axios.post(`${BACKEND_URL}/resumes`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('Resume uploaded successfully.');

  console.log('Starting interview session...');
  try {
    const res = await axios.post(
      `${BACKEND_URL}/interviews`,
      {
        companyName: 'Tech Corp',
        jobRole: 'Software Engineer',
        difficulty: 'MEDIUM',
        interviewType: 'TECHNICAL',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('SUCCESS:', res.data);
  } catch (err: any) {
    console.log('STATUS:', err.response?.status);
    console.log('HEADERS:', err.response?.headers);
    console.log('DATA:', JSON.stringify(err.response?.data, null, 2));
    console.log('MESSAGE:', err.message);
  }
}

debug().catch(console.error);
