import { Request, Response } from 'express';
import assessmentsService from '../services/assessments.service';
import { ApiResponse } from '../utils/ApiResponse';
import { UnauthorizedError, ValidationError } from '../utils/AppError';

export class AssessmentsController {
  async createTest(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const test = await assessmentsService.createTest(userId, req.body);
    return res.status(201).json(ApiResponse.success(test, 'Coding test challenge created successfully'));
  }

  async getTests(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const tests = await assessmentsService.getTests(userId);
    return res.json(ApiResponse.success(tests, 'Recruiter tests retrieved successfully'));
  }

  async getCandidateDashboard(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const stats = await assessmentsService.getCandidateDashboard(userId);
    return res.json(ApiResponse.success(stats, 'Candidate practice metrics retrieved'));
  }

  async getQuestions(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const questions = await assessmentsService.getQuestions(userId);
    return res.json(ApiResponse.success(questions, 'Sandbox questions bank retrieved'));
  }

  async getQuestionDetails(req: Request, res: Response) {
    const { questionId } = req.params;
    const question = await assessmentsService.getQuestionDetails(questionId);
    return res.json(ApiResponse.success(question, 'Question details retrieved'));
  }

  async getLanguages(req: Request, res: Response) {
    const langs = await assessmentsService.getLanguages();
    return res.json(ApiResponse.success(langs, 'Supported languages retrieved'));
  }

  async runCode(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { questionId } = req.params;
    const { code, languageCode, input } = req.body;
    if (!code || !languageCode) {
      throw new ValidationError('Code compilation content and target language are required');
    }

    const execResult = await assessmentsService.runCode(userId, questionId, code, languageCode, input || '');
    return res.json(ApiResponse.success(execResult, 'Custom code execution results compiled'));
  }

  async submitCode(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { questionId } = req.params;
    const { code, languageCode, codingTestId } = req.body;
    if (!code || !languageCode) {
      throw new ValidationError('Solution source code and language are required');
    }

    const submitResult = await assessmentsService.submitCode(userId, questionId, code, languageCode, codingTestId);
    return res.json(ApiResponse.success(submitResult, 'Solution submitted and graded against test cases'));
  }

  async updateTest(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const test = await assessmentsService.updateTest(userId, req.params.id, req.body);
    return res.json(ApiResponse.success(test, 'Coding test challenge updated successfully'));
  }

  async deleteTest(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    await assessmentsService.deleteTest(userId, req.params.id);
    return res.json(ApiResponse.success(null, 'Coding test challenge deleted successfully'));
  }
}

export const assessmentsController = new AssessmentsController();
export default assessmentsController;
