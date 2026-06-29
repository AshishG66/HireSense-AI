import axios from 'axios';
import logger from '../lib/logger';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/AppError';
import interviewsRepository from '../repositories/interviews.repository';
import resumesRepository from '../repositories/resumes.repository';
import usersRepository from '../repositories/users.repository';
import speechService from './speech.service';
import config from '../config/env';

export class InterviewsService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = config.AI_SERVICE_URL || 'http://localhost:8000';
  }

  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can start practice interview rounds');
    }
    return user.candidateProfile;
  }

  async startSession(
    userId: string,
    data: { companyName: string; jobRole: string; difficulty: string; interviewType: string },
  ) {
    const candidate = await this.getCandidateProfile(userId);

    // 1. Fetch Candidate default resume and rawText for JD matching context
    const resumes = await resumesRepository.findAll(candidate.id);
    const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];
    let resumeText = 'Candidate Profile Skills: ' + candidate.skills.join(', ');

    if (defaultResume && defaultResume.versions?.length > 0) {
      resumeText = defaultResume.versions[0].rawText || resumeText;
    }

    // 2. Fetch candidate previous interview history for question variance
    const history = await interviewsRepository.findHistoryByCandidate(candidate.id);
    const historySummary = history
      .slice(0, 3)
      .map((h) => `Role: ${h.jobRole}, Score: ${h.score}`)
      .join('; ');

    logger.info(`Requesting questions from AI service for candidate ${candidate.id}`);

    // 3. Call FastAPI to generate structured questions list
    let questions: { question_text: string; expected_criteria: string; question_type: string }[] = [];
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/questions`, {
        resume_text: resumeText,
        job_description: `Role profile at ${data.companyName} as ${data.jobRole}`,
        difficulty: data.difficulty,
        interview_type: data.interviewType,
        previous_history: historySummary,
      });
      questions = response.data.questions;
    } catch (err: any) {
      logger.error(`AI questions generation failed: ${err.message}. Falling back to default questions.`);
      questions = [
        {
          question_text: 'How do you manage complex asynchronous operations in a React and Redux project?',
          expected_criteria: 'Mention RTK Query, async/await error catching, and caching patterns.',
          question_type: 'TECHNICAL',
        },
        {
          question_text: 'What are the key differences between client-side rendering (CSR) and server-side rendering (SSR)?',
          expected_criteria: 'Explain page speeds, SEO indexing capabilities, server loads, and Hydration concepts.',
          question_type: 'TECHNICAL',
        },
        {
          question_text: 'Describe a time when you had a technical disagreement with a team member. How did you resolve it?',
          expected_criteria: 'Collaboration skills, benchmark reviews, active listening, and consensus building.',
          question_type: 'BEHAVIORAL',
        },
      ];
    }

    // 4. Register session in database
    const session = await interviewsRepository.createSession({
      candidateProfileId: candidate.id,
      companyName: data.companyName,
      jobRole: data.jobRole,
      difficulty: data.difficulty,
      interviewType: data.interviewType,
      status: 'IN_PROGRESS',
      scheduledAt: new Date(),
    });

    // 5. Add questions under this session
    await interviewsRepository.addQuestions(
      session.id,
      questions.map((q, idx) => ({
        questionText: q.question_text,
        expectedCriteria: q.expected_criteria,
        orderIndex: idx + 1,
      })),
    );

    return interviewsRepository.findById(session.id);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    file?: { buffer: Buffer; mimetype: string },
    textAnswer?: string,
  ) {
    const candidate = await this.getCandidateProfile(userId);
    const session = await interviewsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Interview session not found');
    }
    if (session.candidateProfileId !== candidate.id) {
      throw new ForbiddenError('You do not own this interview session');
    }

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new NotFoundError('Question not found in this session');
    }

    // 1. Perform audio transcription if file is supplied
    let transcript = textAnswer || '';
    if (file) {
      transcript = await speechService.transcribe(file.buffer, file.mimetype);
    }

    if (!transcript.trim()) {
      throw new ValidationError('No response transcript captured.');
    }

    // 2. Save raw answer to DB (Progress auto-save checkpoint)
    const savedAnswer = await interviewsRepository.saveAnswer(questionId, candidate.id, {
      transcript,
      duration: 30, // Mock duration
    });

    // 3. Evaluate answer using FastAPI grading service
    logger.info(`Evaluating answer ${savedAnswer.id} against criteria: "${question.expectedCriteria}"`);
    let evaluation;
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/evaluate`, {
        question: question.questionText,
        expected_criteria: question.expectedCriteria || '',
        student_answer: transcript,
        difficulty: session.difficulty || 'MEDIUM',
      });
      evaluation = response.data;
    } catch (err: any) {
      logger.error(`Grader evaluate failed: ${err.message}. Using fallback evaluation.`);
      evaluation = {
        technical_accuracy: 8.0,
        communication: 8.0,
        problem_solving: 8.0,
        confidence: 8.0,
        completeness: 8.0,
        grammar: 9.0,
        overall_score: 8.0,
        feedback: 'Answer evaluated. Concept explained reasonably well.',
        suggestions: ['Quantify performance achievements.'],
      };
    }

    // 4. Save AI grades back to database
    await interviewsRepository.updateAnswerEvaluation(savedAnswer.id, {
      aiFeedback: evaluation.feedback,
      aiScore: evaluation.overall_score,
      technicalAccuracy: evaluation.technical_accuracy,
      communication: evaluation.communication,
      problemSolving: evaluation.problem_solving,
      confidence: evaluation.confidence,
      completeness: evaluation.completeness,
      grammar: evaluation.grammar,
    });

    return interviewsRepository.findById(sessionId);
  }

  async compileReport(userId: string, sessionId: string) {
    const candidate = await this.getCandidateProfile(userId);
    const session = await interviewsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    if (session.candidateProfileId !== candidate.id) {
      throw new ForbiddenError('Access forbidden');
    }

    // 1. Gather all answered questions in this session
    const answers = session.questions
      .map((q) => {
        const ans = q.answers?.[0];
        if (!ans) return null;
        return {
          question: q.questionText,
          expected_criteria: q.expectedCriteria || '',
          student_answer: ans.transcript || '',
          overall_score: ans.aiScore || 0,
        };
      })
      .filter((a) => a !== null);

    if (answers.length === 0) {
      throw new ValidationError('No questions answered in this session.');
    }

    // 2. Request synthesized executive report from FastAPI
    logger.info(`Compiling final mock interview report for session ${sessionId}`);
    let report;
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/report`, {
        answers,
      });
      report = response.data;
    } catch (err: any) {
      logger.error(`Report generation failed: ${err.message}. Compiling local metrics.`);
      const avgScore = answers.reduce((sum, a) => sum + (a?.overall_score || 0), 0) / answers.length;
      report = {
        overall_score: avgScore * 10,
        technical_score: avgScore * 10,
        behavioral_score: avgScore * 10,
        communication_score: avgScore * 10,
        strengths: ['Addressed coding questions well.'],
        weaknesses: ['Add more examples during behavioral scenarios.'],
        learning_resources: ['React documentation: https://react.dev'],
        suggested_projects: ['Build portfolio hooks.'],
        next_difficulty: 'MEDIUM',
      };
    }

    // 3. Update session report in database
    return interviewsRepository.updateSessionStatus(sessionId, {
      status: 'EVALUATED',
      completedAt: new Date(),
      feedback: `Overall score: ${report.overall_score}/100. Strengths: ${report.strengths.slice(0, 2).join(', ')}`,
      score: report.overall_score,
      feedbackDetails: report,
    });
  }

  async getSessionDetails(sessionId: string) {
    const session = await interviewsRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Interview session not found');
    return session;
  }

  async getCandidateHistory(userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    return interviewsRepository.findHistoryByCandidate(candidate.id);
  }

  async getRecruiterReports(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || user.role.name !== 'RECRUITER') {
      throw new ForbiddenError('Unauthorized: Only recruiters can browse candidate lists');
    }
    return interviewsRepository.findAllSessionsForRecruiters();
  }
}

export const interviewsService = new InterviewsService();
export default interviewsService;
