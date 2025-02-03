import { Provider } from '@nestjs/common';
import { Queue } from 'bull';
import { InMemoryMessageQueue } from './in-memory.queue';

export const QueueProvider: Provider = {
  provide: 'MESSAGE_QUEUE',
  useFactory: (redisClient: any, inMemoryQueue: InMemoryMessageQueue) => {
    return redisClient?.isRedis ? redisClient : inMemoryQueue;
  },
  inject: ['REDIS_CLIENT', InMemoryMessageQueue]
}; 