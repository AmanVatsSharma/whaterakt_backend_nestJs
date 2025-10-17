import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from '../logging/request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const existing = (req.headers['x-request-id'] as string) || undefined;
    const requestId = existing || randomUUID();
    res.setHeader('X-Request-Id', requestId);
    requestContext.run({ requestId }, () => next());
  }
}
