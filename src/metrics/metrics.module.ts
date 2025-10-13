import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { Request, Response, NextFunction } from 'express';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule implements NestModule {
  constructor(private readonly metrics: MetricsService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply((req: Request, res: Response, next: NextFunction) => {
      const end = res.end;
      res.end = ((chunk?: any, encoding?: any, cb?: any) => {
        try {
          const method = req.method;
          const status = (res as any).statusCode || 200;
          const path = req.path || req.url || 'unknown';
          this.metrics.incrementRequestCount(method, status, path);
        } catch {}
        return end.call(res, chunk, encoding as any, cb);
      }) as any;
      next();
    }).forRoutes('*');
  }
}