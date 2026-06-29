import crypto from 'crypto';
import logger from '../lib/logger';
import storageService from './storage.service';
import textExtractorService from './textExtractor.service';
import resumeParserService from './resumeParser.service';
import geminiAnalyzerService from './geminiAnalyzer.service';
import atsScorerService from './atsScorer.service';
import notificationService from './notification.service';
import prisma from '../lib/prisma';
import { QueueJob, QueueProvider } from '../interfaces/queue.interface';
import env from '../config/env';

export interface AnalysisJob {
  resumeVersionId: string;
  jobDescription: string;
  userId: string;
}

export class InMemoryQueueProvider implements QueueProvider<AnalysisJob> {
  private queue: { id: string; data: AnalysisJob }[] = [];
  private registry = new Map<string, QueueJob<AnalysisJob>>();
  private processing = false;

  async addJob(resumeVersionId: string, jobDescription: string, userId: string): Promise<string> {
    const jobId = crypto.randomUUID();
    const data = { resumeVersionId, jobDescription, userId };
    this.queue.push({ id: jobId, data });
    this.registry.set(jobId, {
      id: jobId,
      data,
      status: 'PENDING',
    });

    // Notify user of processing start in background
    notificationService.sendNotification(userId, {
      type: 'ANALYSIS_PROCESSING',
      payload: { jobId, message: 'Your resume analysis has been queued.' },
    });

    // Start background processing loop (fire and forget)
    this.processQueue();

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<QueueJob<AnalysisJob> | null> {
    return this.registry.get(jobId) || null;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const jobItem = this.queue.shift();
      if (!jobItem) continue;

      const { id: jobId, data: job } = jobItem;
      const currentRegistry = this.registry.get(jobId);
      if (currentRegistry) {
        currentRegistry.status = 'PROCESSING';
      }

      logger.info(`Background Job Worker: started processing job ${jobId}`);

      try {
        const version = await prisma.resumeVersion.findUnique({
          where: { id: job.resumeVersionId },
        });

        if (!version) {
          throw new Error('Resume version not found in database');
        }

        const fileBuffer = await storageService.download(version.storagePath || version.fileName);

        const extractedText = await textExtractorService.extractText(
          fileBuffer,
          version.mimeType || 'application/pdf',
        );

        await prisma.resumeVersion.update({
          where: { id: job.resumeVersionId },
          data: { rawText: extractedText },
        });

        const parsedContacts = resumeParserService.parseResume(extractedText);

        const aiAnalysis = await geminiAnalyzerService.analyze(extractedText, job.jobDescription);

        const atsBreakdown = atsScorerService.calculateScore(aiAnalysis);

        // Map complete response details matching new AI output requirements
        const details = {
          name: aiAnalysis.full_name || parsedContacts.name,
          email: aiAnalysis.email || parsedContacts.email,
          phone: aiAnalysis.phone || parsedContacts.phone,
          location: aiAnalysis.location || 'Unknown',
          linkedin: aiAnalysis.linkedin || parsedContacts.links.find((l: string) => l.includes('linkedin.com')) || '',
          github: aiAnalysis.github || parsedContacts.links.find((l: string) => l.includes('github.com')) || '',
          portfolio: aiAnalysis.portfolio || parsedContacts.links.find((l: string) => !l.includes('linkedin.com') && !l.includes('github.com')) || '',
          education: aiAnalysis.education || [],
          experience: aiAnalysis.experience || [],
          projects: aiAnalysis.projects || [],
          skills: aiAnalysis.skills || [],
          certifications: aiAnalysis.certifications || [],
          achievements: aiAnalysis.achievements || [],
          languages: aiAnalysis.languages || [],
          atsBreakdown,
          recommendations: {
            strengths: aiAnalysis.strengths || [],
            weaknesses: aiAnalysis.weaknesses || [],
            missingSkills: aiAnalysis.skills_match?.missing_skills || [],
            missingKeywords: aiAnalysis.missing_keywords || [],
            suggestedProjects: aiAnalysis.suggested_projects || [],
            recommendedCertifications: aiAnalysis.recommended_certifications || [],
            suggestedSummary: aiAnalysis.suggested_summary || '',
            interviewPrepTips: aiAnalysis.interview_prep_tips || [],
          },
        };

        const analysisData = {
          resumeVersionId: job.resumeVersionId,
          matchScore: atsBreakdown.total,
          skillsMatched: aiAnalysis.skills_match?.matched_skills || [],
          skillsMissing: aiAnalysis.skills_match?.missing_skills || [],
          strengths: aiAnalysis.strengths || [],
          improvements: aiAnalysis.weaknesses || [],
          summary: aiAnalysis.summary || '',
          details: details as any,
        };

        const newAnalysis = await prisma.resumeAnalysis.upsert({
          where: { resumeVersionId: job.resumeVersionId },
          update: analysisData,
          create: analysisData,
        });

        if (currentRegistry) {
          currentRegistry.status = 'COMPLETED';
          currentRegistry.analysisId = newAnalysis.id;
        }

        logger.info(`Background Job Worker: completed job ${jobId}`);

        // Broadcast success to real-time stream
        notificationService.sendNotification(job.userId, {
          type: 'ANALYSIS_COMPLETE',
          payload: {
            jobId,
            analysisId: newAnalysis.id,
            resumeVersionId: job.resumeVersionId,
            message: 'Your resume analysis has completed successfully!',
          },
        });
      } catch (err: any) {
        logger.error(`Background Job Worker: job ${jobId} failed: ${err.message}`);
        if (currentRegistry) {
          currentRegistry.status = 'FAILED';
          currentRegistry.error = err.message || 'Unknown processing error';
        }

        // Broadcast failure
        notificationService.sendNotification(job.userId, {
          type: 'ANALYSIS_FAILED',
          payload: {
            jobId,
            message: `Resume analysis failed: ${err.message || 'Unknown error'}`,
          },
        });
      }
    }

    this.processing = false;
  }
}

export class RedisQueueProvider implements QueueProvider<AnalysisJob> {
  async addJob(resumeVersionId: string, jobDescription: string, userId: string): Promise<string> {
    logger.info(`Redis/BullMQ Queue: Add Job simulation (Version: ${resumeVersionId})`);
    return crypto.randomUUID();
  }

  async getJobStatus(jobId: string): Promise<QueueJob<AnalysisJob> | null> {
    return {
      id: jobId,
      data: { resumeVersionId: '', jobDescription: '', userId: '' },
      status: 'COMPLETED',
    };
  }
}

export class QueueService implements QueueProvider<AnalysisJob> {
  private activeQueue: QueueProvider<AnalysisJob>;

  constructor() {
    const provider = env.QUEUE_PROVIDER;
    logger.info(`Initializing QueueService with provider: ${provider}`);
    if (provider === 'redis') {
      this.activeQueue = new RedisQueueProvider();
    } else {
      this.activeQueue = new InMemoryQueueProvider();
    }
  }

  async addJob(resumeVersionId: string, jobDescription: string, userId: string): Promise<string> {
    return this.activeQueue.addJob(resumeVersionId, jobDescription, userId);
  }

  async getJobStatus(jobId: string): Promise<QueueJob<AnalysisJob> | null> {
    return this.activeQueue.getJobStatus(jobId);
  }
}

export const queueService = new QueueService();
export default queueService;
