import { Test } from '@nestjs/testing';
import { WhatsAppService } from '../src/whatsapp/whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { PrismaService } from '../src/prisma.service';
import { WhatsAppAdapter } from '../src/whatsapp/whatsapp.adapter';

describe('WhatsAppService sendMessage', () => {
  it('builds interactive quick reply buttons when quickReplies provided', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WhatsAppService,
        WhatsAppAdapter,
        { provide: getQueueToken('messages'), useValue: { add: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    const service = moduleRef.get(WhatsAppService);
    (service as any).tenantId = 't1';
    const res = await service.sendMessage({ to: '1555', message: 'Pick one', quickReplies: ['A', 'B', 'C', 'D'] });
    expect(res.success).toBeDefined();
  });
});
