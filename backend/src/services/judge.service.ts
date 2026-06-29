import logger from '../lib/logger';
import {
  JudgeProvider,
  ExecutionResult,
  TestCaseItem,
  SubmissionResult,
} from '../interfaces/judge.interface';

export class MockJudgeProvider implements JudgeProvider {
  async execute(code: string, languageCode: string, input: string): Promise<ExecutionResult> {
    logger.info(`MockJudge: Executing code for ${languageCode}`);

    if (languageCode === 'javascript') {
      try {
        const cleanInput = input.trim();
        const wrapped = `
          const solve = (inputStr) => {
            ${code}
          };
          solve(${JSON.stringify(cleanInput)});
        `;
        const result = eval(wrapped);
        return {
          status: 'PASSED',
          stdout: 'Code executed successfully.',
          actualOutput: String(result).trim(),
          runtime: 45,
          memory: 1024,
        };
      } catch (err: any) {
        return {
          status: 'COMPILE_ERROR',
          stderr: err.message,
          runtime: 10,
          memory: 100,
        };
      }
    }

    const syntaxError = code.includes('syntax_error') || code.includes('SyntaxError');
    if (syntaxError) {
      return {
        status: 'COMPILE_ERROR',
        stderr: 'Compilation failed: Syntax error near line 4.',
        runtime: 12,
        memory: 200,
      };
    }

    const cleanInput = input.trim();
    let actualOutput = cleanInput;

    if (code.includes('def twoSum') || code.includes('twoSum') || code.includes('class Solution')) {
      if (cleanInput.includes('2,7,11,15') && cleanInput.includes('9')) {
        actualOutput = '[0,1]';
      } else {
        actualOutput = '[0,1]';
      }
    } else if (code.includes('def isPalindrome') || code.includes('isPalindrome')) {
      actualOutput = cleanInput === '121' ? 'true' : 'false';
    }

    return {
      status: 'PASSED',
      stdout: 'Standard output printed.',
      actualOutput: actualOutput,
      runtime: 55,
      memory: 2048,
    };
  }

  async submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult> {
    logger.info(`MockJudge: Grading submission with ${testCases.length} test cases`);
    const executions: SubmissionResult['executions'] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      const exec = await this.execute(code, languageCode, tc.input);
      const isPassed = exec.status === 'PASSED' && exec.actualOutput === tc.expectedOutput.trim();

      if (isPassed) {
        passedCount++;
      }

      executions.push({
        testCaseId: tc.id,
        status: isPassed ? 'PASSED' : 'FAILED',
        runtime: exec.runtime,
        memory: exec.memory,
        stdout: exec.stdout,
        stderr: exec.stderr,
        actualOutput: exec.actualOutput,
      });
    }

    const hasCompileError = executions.some((e) => e.stderr && !e.actualOutput);
    const scorePercentage = Math.round((passedCount / testCases.length) * 100);

    return {
      status: hasCompileError
        ? 'COMPILE_ERROR'
        : scorePercentage === 100
        ? 'ACCEPTED'
        : 'WRONG_ANSWER',
      score: scorePercentage,
      executionTime: executions.reduce((sum, e) => sum + e.runtime, 0),
      memoryUsage: Math.max(...executions.map((e) => e.memory)),
      executions,
    };
  }
}

export class JudgeService {
  private activeProvider: JudgeProvider;

  constructor() {
    this.activeProvider = new MockJudgeProvider();
  }

  async execute(code: string, languageCode: string, input: string): Promise<ExecutionResult> {
    return this.activeProvider.execute(code, languageCode, input);
  }

  async submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult> {
    return this.activeProvider.submit(code, languageCode, testCases);
  }
}

export const judgeService = new JudgeService();
export default judgeService;
