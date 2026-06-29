import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const applyJobSchema = z.object({
  body: z.object({
    resumeVersionId: z.string().uuid('Invalid Resume Version ID'),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({ message: 'Invalid application status value' }),
    }),
    notes: z.string().optional(),
  }),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
