import { Test } from '@nestjs/testing';
import { AiModule } from '../src/ai/ai.module';
import { AIService } from '../src/ai/ai.service';
import { HttpModule } from '@nestjs/axios';

describe('AI Quick Replies', () => {
  it('returns short suggestions even on provider error', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule, AiModule],
    }).compile();
    const ai = moduleRef.get<AIService>(AIService);
    const result = await ai.generateReplySuggestion('Hello I need help with my order');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(160);
  });
});
