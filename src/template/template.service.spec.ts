import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        TemplateService,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
        { provide: PrismaService, useValue: { template: { upsert: jest.fn() } } },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
