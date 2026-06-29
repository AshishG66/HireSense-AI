import { z } from 'zod';
import { JobStatus } from '@prisma/client';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    responsibilities: z.string().min(10, 'Responsibilities must be at least 10 characters'),
    requiredSkills: z.array(z.string()).min(1, 'At least one required skill is required'),
    preferredSkills: z.array(z.string()).default([]),
    salaryMin: z.coerce.number().nonnegative('Salary min must be positive'),
    salaryMax: z.coerce.number().nonnegative('Salary max must be positive'),
    experienceLevel: z.string().min(1, 'Experience level is required'),
    employmentType: z.string().min(1, 'Employment type is required'),
    location: z.string().optional(),
    remoteType: z.string().min(1, 'Remote type is required'),
    openings: z.coerce.number().int().positive('Openings must be at least 1'),
    deadline: z
      .string()
      .datetime({ precision: 3 })
      .optional()
      .or(
        z.string().transform((v) => {
          if (!v) return undefined;
          const parsed = Date.parse(v);
          return isNaN(parsed) ? undefined : new Date(v).toISOString();
        }),
      )
      .optional(),
    status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  }),
});

export const editJobSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    responsibilities: z.string().min(10).optional(),
    requiredSkills: z.array(z.string()).optional(),
    preferredSkills: z.array(z.string()).optional(),
    salaryMin: z.coerce.number().nonnegative().optional(),
    salaryMax: z.coerce.number().nonnegative().optional(),
    experienceLevel: z.string().optional(),
    employmentType: z.string().optional(),
    location: z.string().optional(),
    remoteType: z.string().optional(),
    openings: z.coerce.number().int().positive().optional(),
    deadline: z
      .string()
      .datetime({ precision: 3 })
      .optional()
      .or(
        z.string().transform((v) => {
          if (!v) return undefined;
          const parsed = Date.parse(v);
          return isNaN(parsed) ? undefined : new Date(v).toISOString();
        }),
      )
      .optional(),
    status: z.nativeEnum(JobStatus).optional(),
  }),
});

export const queryJobSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    remoteType: z.string().optional(),
    employmentType: z.string().optional(),
    experienceLevel: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    sort: z.string().optional(),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type EditJobInput = z.infer<typeof editJobSchema>;
export type QueryJobInput = z.infer<typeof queryJobSchema>;
