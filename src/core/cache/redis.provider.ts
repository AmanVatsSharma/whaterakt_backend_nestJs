import { Redis } from 'ioredis';
import { Provider, Logger } from '@nestjs/common';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const logger = new Logger('RedisProvider');
    
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
      logger.warn('Redis configuration missing - using in-memory fallback');
      return null;
    }

    const client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      retryStrategy: (times) => {
        // Exponential backoff with longer intervals
        const hours = Math.min(times, 4); // Max 4 attempts (0-4 hours)
        const delay = hours * 60 * 60 * 1000; // Hours to milliseconds
        logger.warn(`Redis connection attempt ${times}, next retry in ${hours} hours`);
        return delay;
      },
      maxRetriesPerRequest: 3, // Max 3 retries per request
      reconnectOnError: (err) => {
        logger.error(`Redis connection error: ${err.message}`);
        // Only reconnect for specific errors
        return err.message.includes('READONLY') || 
               err.message.includes('ETIMEDOUT');
      }
    });

    client.on('error', (e) => {
      logger.error(`Redis connection error: ${e.message}`);
    });

    client.on('ready', () => {
      logger.log('Redis connection established');
    });

    return client;
  }
}; 