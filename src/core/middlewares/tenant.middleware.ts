/**
* File: src/core/middlewares/tenant.middleware.ts
* Module: core
* Purpose: Resolves tenant context from headers/auth claims.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Looks up tenant via TypeORM repository.
* - Attaches tenant object to request for downstream guards/resolvers.
*/
import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppError } from '../../common/errors';
import { TenantOrmEntity } from '../../database/entities';
import { LoggerService } from '../../shared/logger.service';

interface RequestWithUser extends Request {
  user?: {
    tenantId?: string;
  };
  tenant?: any;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new LoggerService();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    this.logger.setContext(TenantMiddleware.name);
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;

    if (!tenantId) {
      this.logger.warn('Tenant identification missing in request');
      throw new AppError(
        'TENANT_IDENTIFICATION_MISSING',
        'Tenant identification missing',
        401,
        { path: req.originalUrl }
      );
    }

    const tenant = await this.dataSource.getRepository(TenantOrmEntity).findOne({
      where: { id: tenantId as string },
    });

    if (!tenant) {
      this.logger.warn(`Invalid tenant id provided: ${String(tenantId)}`);
      throw new AppError(
        'TENANT_NOT_FOUND',
        'Invalid tenant',
        404,
        { tenantId: String(tenantId) }
      );
    }

    req.tenant = tenant;
    next();
  }
}