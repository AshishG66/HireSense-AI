import { Request, Response } from 'express';
import interviewsService from '../services/interviews.service';
import { ApiResponse } from '../utils/ApiResponse';
import { UnauthorizedError, ValidationError } from '../utils/AppError';

export class InterviewsController {
  async startSession(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { companyName, jobRole, difficulty, interviewType } = req.body;
    if (!companyName || !jobRole || !difficulty || !interviewType) {
      throw new ValidationError('Missing required session setup properties');
    }

    const session = await interviewsService.startSession(userId, {
      companyName,
      jobRole,
      difficulty,
      interviewType,
    });

    return res.status(201).json(ApiResponse.success(session, 'Mock interview session generated successfully'));
  }

  async submitAnswer(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { sessionId, questionId } = req.params;
    const { textAnswer } = req.body;
    const file = req.file;

    const session = await interviewsService.submitAnswer(
      userId,
      sessionId,
      questionId,
      file ? { buffer: file.buffer, mimetype: file.mimetype } : undefined,
      textAnswer,
    );

    return res.json(ApiResponse.success(session, 'Answer response submitted and evaluated'));
  }

  async compileReport(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { sessionId } = req.params;
    const report = await interviewsService.compileReport(userId, sessionId);

    return res.json(ApiResponse.success(report, 'Interview performance report compiled'));
  }

  async getSessionDetails(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const session = await interviewsService.getSessionDetails(userId, req.params.sessionId);
    return res.json(ApiResponse.success(session, 'Session details retrieved'));
  }

  async getCandidateHistory(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const history = await interviewsService.getCandidateHistory(userId);
    return res.json(ApiResponse.success(history, 'Candidate interview history retrieved'));
  }

  async getRecruiterReports(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const reports = await interviewsService.getRecruiterReports(userId);
    return res.json(ApiResponse.success(reports, 'Candidate screening reports list retrieved'));
  }
}

export const interviewsController = new InterviewsController();
export default interviewsController;
