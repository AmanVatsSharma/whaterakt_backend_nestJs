import { Test, TestingModule } from '@nestjs/testing';
import { AiResolver } from './ai.resolver';
import { AIService } from './ai.service';

describe('AiResolver', () => {
  let resolver: AiResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiResolver, { provide: AIService, useValue: { generateReplySuggestion: jest.fn(async () => 'Sure!') } }],
    }).compile();

    resolver = module.get<AiResolver>(AiResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
