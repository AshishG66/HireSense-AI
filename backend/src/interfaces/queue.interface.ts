export interface QueueJob<T> {
  id: string;
  data: T;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  analysisId?: string;
}

export interface QueueProvider<T> {
  addJob(resumeVersionId: string, jobDescription: string, userId: string): Promise<string>;
  getJobStatus(jobId: string): Promise<QueueJob<T> | null>;
}
