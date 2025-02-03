import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

@Processor('messages')
export class InMemoryMessageQueue {
  private readonly logger = new Logger(InMemoryMessageQueue.name);

  @Process()
  async handleMessage(job: any) {
    this.logger.log('Processing message in-memory: ', job.data);
    // Implement actual message handling logic
    return { success: true };
  }
} 