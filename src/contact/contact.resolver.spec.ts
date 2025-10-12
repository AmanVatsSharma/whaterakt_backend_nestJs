import { Test, TestingModule } from '@nestjs/testing';
import { ContactResolver } from './contact.resolver';
import { PrismaService } from 'src/prisma.service';
import { ContactService } from './contact.service';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { ConfigService } from '@nestjs/config';

describe('ContactResolver', () => {
  let resolver: ContactResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactResolver,
        ContactService,
        { provide: PrismaService, useValue: { contact: { findMany: jest.fn() } } },
        { provide: 'REDIS_CLIENT', useValue: null },
        RateLimitGuard,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    resolver = module.get<ContactResolver>(ContactResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
