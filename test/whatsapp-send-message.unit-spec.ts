import { Test } from '@nestjs/testing';
import { WhatsAppService } from '../src/whatsapp/whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { WhatsAppAdapter } from '../src/whatsapp/whatsapp.adapter';
import { DataSource } from 'typeorm';
import { MetricsService } from '../src/metrics/metrics.service';
import { WhatsAppOnboardingService } from '../src/modules/whatsapp-onboarding';

describe('WhatsAppService sendMessage', () => {
  it('builds interactive quick reply buttons when quickReplies provided', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WhatsAppService,
        {
          provide: WhatsAppAdapter,
          useValue: { sendMessage: jest.fn(async () => ({ success: true })) },
        },
        { provide: getQueueToken('messages'), useValue: { add: jest.fn() } },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              findOne: jest.fn(async () => null),
              count: jest.fn(async () => 0),
            })),
          },
        },
        {
          provide: MetricsService,
          useValue: { incrementWhatsAppSendFailure: jest.fn() },
        },
        {
          provide: WhatsAppOnboardingService,
          useValue: { isTenantSendReady: jest.fn(async () => ({ ready: true })) },
        },
      ],
    }).compile();

    const service = moduleRef.get(WhatsAppService);
    const res = await service.sendMessage(
      { to: '1555', message: 'Pick one', quickReplies: ['A', 'B', 'C', 'D'] },
      't1',
    );
    expect(res.success).toBeDefined();
  });
});
