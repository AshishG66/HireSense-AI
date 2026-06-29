import { describe, test, expect } from 'vitest';
import judgeService from '../services/judge.service';

describe('Coding Assessment Judge logic', () => {
  test('MockJudgeProvider compiles standard JavaScript code successfully', async () => {
    const code = `return Number(inputStr) * 2;`;
    const res = await judgeService.execute(code, 'javascript', '51');
    expect(res.status).toBe('PASSED');
    expect(res.actualOutput).toBe('102');
  });

  test('MockJudgeProvider returns compile error on syntax issues', async () => {
    const code = `const a = ;`;
    const res = await judgeService.execute(code, 'javascript', 'any');
    expect(res.status).toBe('COMPILE_ERROR');
    expect(res.stderr).toBeDefined();
  });

  test('MockJudgeProvider asserts python solvers mock outputs', async () => {
    const code = `def twoSum(nums, target):`;
    const res = await judgeService.execute(code, 'python', '2,7,11,15\n9');
    expect(res.status).toBe('PASSED');
    expect(res.actualOutput).toBe('[0,1]');
  });
});
