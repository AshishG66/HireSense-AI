import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:password@localhost:5432/hiresense?schema=public'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  GEMINI_API_KEY: z.string().default('mock-key'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('fallback-secret-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('fallback-refresh-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  QUEUE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsed.error.format(), null, 2),
  );
  process.exit(1);
}

export const config = parsed.data;
export default config;
