import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { DataSource } from 'typeorm';

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              create: jest.fn((payload) => payload),
              save: jest.fn(async (payload) => ({ id: 'contact-1', ...payload })),
              find: jest.fn(async () => []),
              findOne: jest.fn(async () => null),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
