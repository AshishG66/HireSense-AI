import axios from 'axios';

const BACKEND_URL = 'https://hiresense-backend-eri4.onrender.com/api/v1';

async function debug() {
  const timestamp = Date.now();
  const email = `test_debug_${timestamp}@test.com`;
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
