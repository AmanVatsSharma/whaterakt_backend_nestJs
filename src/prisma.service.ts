import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;

  constructor() {
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    if (!this.isConnected) {
      await this.$connect();
      this.isConnected = true;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.isConnected = false;
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase not allowed in production');
    }
    
    const models = Reflect.ownKeys(this).filter((key): key is string => {
      return (
        typeof key === 'string' &&
        typeof (this as any)[key] === 'object' &&
        (this as any)[key]?.deleteMany
      );
    });

    return Promise.all(
      models.map(modelKey => (this as any)[modelKey].deleteMany())
    );
  }
}  