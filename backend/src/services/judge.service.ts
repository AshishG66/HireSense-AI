import logger from '../lib/logger';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  JudgeProvider,
  ExecutionResult,
  TestCaseItem,
  SubmissionResult,
} from '../interfaces/judge.interface';

export class LocalJudgeProvider implements JudgeProvider {
  async execute(code: string, languageCode: string, input: string): Promise<ExecutionResult> {
    logger.info(`LocalJudge: Executing code for ${languageCode}`);
    
    try {
      const cleanInput = input.trim();
      let output = '';
      const start = Date.now();

      if (languageCode === 'javascript' || languageCode === 'js') {
        const script = `
          const inputStr = ${JSON.stringify(cleanInput)};
          ${code}
        `;
        output = execSync(`node -e ${JSON.stringify(script)}`, { encoding: 'utf-8', timeout: 5000 });
      } else if (languageCode === 'python' || languageCode === 'py') {
        const scriptPath = path.join(__dirname, '..', '..', 'temp_script.py');
        const scriptContent = `
import sys
import json
input_str = ${JSON.stringify(cleanInput)}
${code}
`;
        fs.writeFileSync(scriptPath, scriptContent);
        output = execSync(`python3 ${scriptPath}`, { encoding: 'utf-8', timeout: 5000 });
        fs.unlinkSync(scriptPath);
      } else {
         return {
          status: 'COMPILE_ERROR',
          stderr: 'Language not supported by local judge.',
          runtime: 0,
          memory: 0,
        };
      }

      return {
        status: 'PASSED',
        stdout: output,
        actualOutput: output.trim(),
        runtime: Date.now() - start,
        memory: 1024,
      };
    } catch (err: any) {
      return {
        status: 'COMPILE_ERROR',
        stderr: err.stderr ? err.stderr.toString() : err.message,
        runtime: 10,
        memory: 100,
      };
    }
  }

  async submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult> {
    logger.info(`LocalJudge: Grading submission with ${testCases.length} test cases`);
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
        runtime: exec.runtime || 0,
        memory: exec.memory || 0,
        stdout: exec.stdout,
        stderr: exec.stderr,
        actualOutput: exec.actualOutput,
      });
    }

    const hasCompileError = executions.some((e) => e.status === 'FAILED' && e.stderr);
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
    this.activeProvider = new LocalJudgeProvider();
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
