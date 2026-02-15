import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth password reset (e2e)', () => {
  let app: INestApplication;
  const authServiceMock = {
    requestPasswordReset: jest.fn(async () => ({
      ok: true,
      message: 'If the email exists, a reset link will be sent.',
    })),
    resetPasswordWithToken: jest.fn(async () => ({
      ok: true,
      message: 'Password updated successfully',
    })),
    getQrCodeForUser: jest.fn(async () => null),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects forgot-password request without email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({});
    expect(response.status).toBe(400);
  });

  it('accepts forgot-password request with valid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'owner@example.com' });
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
  });

  it('rejects reset-password request without token/password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'abc' });
    expect(response.status).toBe(400);
  });

  it('accepts reset-password request with valid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'reset-token', password: 'VeryStrongPass123' });
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
  });
});
