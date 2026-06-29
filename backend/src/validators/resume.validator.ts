import { z } from 'zod';

export const renameResumeSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Resume title must be at least 2 characters'),
  }),
});

export const analyzeResumeSchema = z.object({
  body: z.object({
    jobDescription: z.string().min(10, 'Job description context must be at least 10 characters'),
  }),
});

export type RenameResumeInput = z.infer<typeof renameResumeSchema>;
export type AnalyzeResumeInput = z.infer<typeof analyzeResumeSchema>;
