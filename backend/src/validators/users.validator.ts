import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['ADMIN', 'RECRUITER', 'CANDIDATE']).optional(),
  }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>['body'];
