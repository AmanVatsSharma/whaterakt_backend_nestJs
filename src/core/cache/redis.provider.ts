import { Redis } from 'ioredis';
import { Provider, Logger } from '@nestjs/common';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const logger = new Logger('RedisProvider');
    try {
      if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        throw new Error('Redis configuration missing');
      }
      
      const client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        retryStrategy: (times) => Math.min(times * 100, 3000)
      });

      client.on('error', (e) => logger.error(`Redis error: ${e.message}`));
      return client;
    } catch (e) {
      logger.warn(`Redis disabled: ${e.message}`);
      return null;
    }
  }
}; 