import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { DataSource } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WhatsappService,
        {
          provide: WhatsAppAdapter,
          useValue: { sendMessage: jest.fn(async () => ({ success: true })) },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              findOne: jest.fn(async () => null),
              count: jest.fn(async () => 0),
            })),
          },
        },
        { provide: getQueueToken('messages'), useValue: { add: jest.fn() } },
        {
          provide: WhatsAppOnboardingService,
          useValue: { isTenantSendReady: jest.fn(async () => ({ ready: true })) },
        },
        {
          provide: MetricsService,
          useValue: { incrementWhatsAppSendFailure: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
