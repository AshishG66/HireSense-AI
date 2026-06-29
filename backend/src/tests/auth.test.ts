import { describe, test, expect, vi } from 'vitest';
import supertest from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Auth routes integrations', () => {
  test('POST /api/v1/auth/register fails with validation error on missing properties', async () => {
    const res = await supertest(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@gmail.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login fails on invalid credentials', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(null);

    const res = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@gmail.com', password: 'unknownpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
