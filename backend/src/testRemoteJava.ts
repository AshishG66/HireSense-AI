import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import env from './config/env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

const BACKEND_URL = 'https://hiresense-backend-eri4.onrender.com/api/v1';

async function testRemoteLanguages() {
  console.log('Connecting to production DB...');
  const q = await prisma.codingQuestion.findFirst();
  if (!q) {
    console.error('No coding question found in DB.');
    return;
  }
  console.log(`Using question: ${q.title} (${q.id})`);

  const timestamp = Date.now();
  const email = `test_langs_${timestamp}@test.com`;
  const password = 'password123';

  const client = axios.create({ baseURL: BACKEND_URL });

  console.log('Registering candidate...');
  await client.post('/auth/register', {
    name: 'Language Test Candidate',
    email,
    password,
    role: 'CANDIDATE',
  });

  console.log('Logging in...');
  const loginRes = await client.post('/auth/login', {
    email,
    password,
  });
  const token = loginRes.data.data.accessToken;

  // 1. Get System Tool Versions inside Container
  console.log('\n=== RUNNING SYSTEM VERSIONS CHECK INSIDE DEPLOYED BACKEND ===\n');
  const checkVersionsCode = `
const { execSync } = require('child_process');
const cmds = [
  'java -version',
  'javac -version',
  'gcc --version',
  'g++ --version',
  'python3 --version'
];
let output = '';
for (const cmd of cmds) {
  try {
    const res = execSync(cmd + ' 2>&1').toString();
    output += '=== ' + cmd + ' ===\\n' + res + '\\n';
  } catch (err) {
    output += '=== ' + cmd + ' ===\\nFailed: ' + err.message + '\\n\\n';
  }
}
return output;
  `.trim();

  try {
    const runRes = await client.post(
      `/assessments/candidate/questions/${q.id}/run`,
      {
        code: checkVersionsCode,
        languageCode: 'javascript',
        input: '',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(runRes.data.data.stdout || runRes.data.data.stderr);
  } catch (err: any) {
    console.error('Failed to run version checks:', err.response?.data || err.message);
  }

  // 2. Hello World executions
  const testCodes = [
    {
      lang: 'java',
      label: 'Java',
      code: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java");
    }
}
      `.trim()
    },
    {
      lang: 'python',
      label: 'Python',
      code: `print("Hello Python")`
    },
    {
      lang: 'c',
      label: 'C',
      code: `
#include <stdio.h>
int main() {
    printf("Hello C\\n");
    return 0;
}
      `.trim()
    },
    {
      lang: 'cpp',
      label: 'C++',
      code: `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello C++" << endl;
    return 0;
}
      `.trim()
    },
    {
      lang: 'javascript',
      label: 'JavaScript',
      code: `console.log("Hello JS");`
    },
    {
      lang: 'typescript',
      label: 'TypeScript',
      code: `console.log("Hello TS");`
    }
  ];

  console.log('\n=== RUNNING CODE EXECUTION TESTS ON REMOTE BACKEND ===\n');

  for (const item of testCodes) {
    try {
      console.log(`Running [${item.label}]...`);
      const runRes = await client.post(
        `/assessments/candidate/questions/${q.id}/run`,
        {
          code: item.code,
          languageCode: item.lang,
          input: '',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const execData = runRes.data.data;
      console.log(`[${item.label}] Status: ${execData.status}`);
      if (execData.stderr) {
        console.error(`[${item.label}] Error output:`, execData.stderr);
      }
      if (execData.stdout) {
        console.log(`[${item.label}] Console output: "${execData.stdout.trim()}"`);
      }
    } catch (err: any) {
      console.error(`[${item.label}] Request failed:`, err.response?.data || err.message);
    }
    console.log('----------------------------------------------------');
  }

  // 3. Verify Submit Solution
  console.log('\nVerifying Submit Solution against all test cases...');
  try {
    const submitRes = await client.post(
      `/assessments/candidate/questions/${q.id}/submit`,
      {
        code: `console.log("Hello JS");`,
        languageCode: 'javascript',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Submit Result:', JSON.stringify(submitRes.data.data, null, 2));
  } catch (err: any) {
    console.error('Submit failed:', err.response?.data || err.message);
  }

  await prisma.$disconnect();
}

testRemoteLanguages().catch(console.error);
