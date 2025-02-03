import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/prisma.service';

interface RequestWithUser extends Request {
  user?: {
    tenantId?: string;
  };
  tenant?: any;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant identification missing');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId as string },
    });

    if (!tenant) {
      throw new Error('Invalid tenant');
    }

    req.tenant = tenant;
    next();
  }
} 