import { PrismaClient } from '@prisma/client';
import { judgeService } from './services/judge.service';
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

// Solvers mapping for LeetCode-style questions and fallback for hello world
const SOLVERS: Record<string, Record<string, string>> = {
  "two sum": {
    java: `
public class Solution {
    public int[] solve(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}
    `.trim(),
    python: `
class Solution:
    def solve(self, nums, target):
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []
    `.trim(),
    javascript: `
class Solution {
    solve(nums, target) {
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) return [i, j];
            }
        }
        return [];
    }
}
    `.trim(),
    typescript: `
class Solution {
    solve(nums: number[], target: number): number[] {
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) return [i, j];
            }
        }
        return [];
    }
}
    `.trim(),
    cpp: `
#include <vector>
using namespace std;
class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); ++i) {
            for (int j = i + 1; j < nums.size(); ++j) {
                if (nums[i] + nums[j] == target) return {i, j};
            }
        }
        return {};
    }
};
    `.trim(),
    c: `
#include <stdlib.h>
int* solve(int* nums, int numsSize, int target, int* returnSize) {
    int* res = malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                res[0] = i;
                res[1] = j;
                *returnSize = 2;
                return res;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}
    `.trim()
  },
  "palindrome number": {
    java: `
public class Solution {
    public boolean solve(int x) {
        String s = String.valueOf(x);
        return s.equals(new StringBuilder(s).reverse().toString());
    }
}
    `.trim(),
    python: `
class Solution:
    def solve(self, x):
        return str(x) == str(x)[::-1]
    `.trim(),
    javascript: `
class Solution {
    solve(x) {
        return x.toString() === x.toString().split('').reverse().join('');
    }
}
    `.trim(),
    typescript: `
class Solution {
    solve(x: number): boolean {
        return x.toString() === x.toString().split('').reverse().join('');
    }
}
    `.trim(),
    cpp: `
#include <string>
#include <algorithm>
using namespace std;
class Solution {
public:
    bool solve(int x) {
        string s = to_string(x);
        string rev = s;
        reverse(rev.begin(), rev.end());
        return s == rev;
    }
};
    `.trim(),
    c: `
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
bool solve(int x) {
    char s[32];
    sprintf(s, "%d", x);
    int len = strlen(s);
    for (int i = 0; i < len / 2; i++) {
        if (s[i] != s[len - 1 - i]) return false;
    }
    return true;
}
    `.trim()
  }
};

const DEFAULT_HELLO_WORLD: Record<string, string> = {
  java: `
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
  `.trim(),
  python: `print("Hello")`,
  javascript: `console.log("Hello");`,
  typescript: `console.log("Hello");`,
  cpp: `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello";
    return 0;
}
  `.trim(),
  c: `
#include <stdio.h>
int main() {
    printf("Hello");
    return 0;
}
  `.trim()
};

async function verifyAll() {
  const startVerify = Date.now();
  console.log("Fetching all coding questions from database...");
  const questions = await prisma.codingQuestion.findMany({
    include: { testCases: true }
  });

  console.log(`Total coding questions fetched: ${questions.length}`);
  const languages = ['java', 'python', 'javascript', 'typescript', 'cpp', 'c'];

  let totalQuestionsTested = 0;
  let totalLanguagesTested = languages.length;
  let totalExecutions = 0;
  let passed = 0;
  let failed = 0;

  const failedQuestions: string[] = [];
  const failedLanguages: string[] = [];

  for (const q of questions) {
    totalQuestionsTested++;
    console.log(`\n=========================================================`);
    console.log(`Testing Question: "${q.title}" (ID: ${q.id})`);
    console.log(`=========================================================`);

    const titleKey = q.title.toLowerCase().trim();
    const isLeetcode = titleKey === 'two sum' || titleKey === 'palindrome number';

    for (const lang of languages) {
      console.log(`  -> Language: ${lang}`);
      const code = isLeetcode ? SOLVERS[titleKey][lang] : DEFAULT_HELLO_WORLD[lang];

      if (!code) {
        console.error(`Missing code solver for ${q.title} in ${lang}`);
        failed++;
        continue;
      }

      // 1. Run Code (Public execution)
      totalExecutions++;
      const firstTestCase = q.testCases[0];
      if (!firstTestCase) {
        console.warn(`    [WARN] No test cases found for question: ${q.title}`);
        failed++;
        continue;
      }

      const execResult = await judgeService.execute(code, lang, firstTestCase.input);
      const outputClean = execResult.actualOutput ? execResult.actualOutput.trim() : '';
      const expectedClean = firstTestCase.expectedOutput.trim();

      const runPassed = execResult.status === 'PASSED' && outputClean === expectedClean;
      
      if (!runPassed) {
        console.error(`    [FAIL] Run Code failed! Status: ${execResult.status}, Output: "${outputClean}", Expected: "${expectedClean}"`);
        console.error(`    Stderr: ${execResult.stderr}`);
        failed++;
        if (!failedQuestions.includes(q.title)) failedQuestions.push(q.title);
        if (!failedLanguages.includes(lang)) failedLanguages.push(lang);
        continue;
      }
      console.log(`    [PASS] Run Code passed`);

      // 2. Submit Solution (All test cases)
      totalExecutions++;
      const formattedTestCases = q.testCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }));

      const submitResult = await judgeService.submit(code, lang, formattedTestCases);
      const submitPassed = submitResult.status === 'ACCEPTED' && submitResult.score === 100;

      if (!submitPassed) {
        console.error(`    [FAIL] Submit failed! Status: ${submitResult.status}, Score: ${submitResult.score}%`);
        submitResult.executions.forEach((e, idx) => {
          console.error(`      Test Case ${idx}: Status=${e.status}, Stderr=${e.stderr}`);
        });
        failed++;
        if (!failedQuestions.includes(q.title)) failedQuestions.push(q.title);
        if (!failedLanguages.includes(lang)) failedLanguages.push(lang);
        continue;
      }

      console.log(`    [PASS] Submit passed (Score: 100%)`);
      passed += 2; // both run and submit passed
    }
  }

  const duration = Date.now() - startVerify;
  console.log(`\n\n=========================================================`);
  console.log(`             FINAL VALIDATION REPORT                     `);
  console.log(`=========================================================`);
  console.log(`✓ Total Questions Tested : ${totalQuestionsTested}`);
  console.log(`✓ Total Languages Tested : ${totalLanguagesTested}`);
  console.log(`✓ Total Executions       : ${totalExecutions}`);
  console.log(`✓ Passed                 : ${passed}`);
  console.log(`✓ Failed                 : ${failed}`);
  console.log(`✓ Execution Time         : ${(duration / 1000).toFixed(2)} seconds`);
  console.log(`✓ Failed Questions       : ${failedQuestions.length > 0 ? failedQuestions.join(', ') : 'None'}`);
  console.log(`✓ Failed Languages       : ${failedLanguages.length > 0 ? failedLanguages.join(', ') : 'None'}`);
  console.log(`=========================================================`);

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyAll().catch(err => {
  console.error("Verification failed unexpectedly:", err);
  process.exit(1);
});
