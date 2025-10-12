import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { ConfigService } from '@nestjs/config';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WhatsappService,
        WhatsAppAdapter,
        { provide: PrismaService, useValue: { contact: {}, template: {} } },
        { provide: getQueueToken('messages'), useValue: { add: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
