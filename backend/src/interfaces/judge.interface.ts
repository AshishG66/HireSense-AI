export interface ExecutionResult {
  status: 'PASSED' | 'FAILED' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  stdout?: string;
  stderr?: string;
  actualOutput?: string;
  runtime: number;
  memory: number;
}

export interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface SubmissionResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  score: number;
  executionTime: number;
  memoryUsage: number;
  executions: {
    testCaseId: string;
    status: 'PASSED' | 'FAILED';
    runtime: number;
    memory: number;
    stdout?: string;
    stderr?: string;
    actualOutput?: string;
  }[];
}

export interface JudgeProvider {
  execute(code: string, languageCode: string, input: string): Promise<ExecutionResult>;
  submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult>;
}
