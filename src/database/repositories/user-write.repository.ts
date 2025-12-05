import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../entities/user.entity';

type PrismaUser = {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  phone?: string | null;
  mfaEnabled?: boolean;
  mfaSecret?: string | null;
  mfaBackupCodes?: string[];
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UserWriteRepository {
  private readonly logger = new Logger(UserWriteRepository.name);

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async upsertFromPrisma(user: PrismaUser) {
    this.logger.log(`Mirroring user ${user.id} for tenant ${user.tenantId}`);
    const entity = this.repository.create({
      id: user.id,
      email: user.email,
      password: user.password,
      tenantId: user.tenantId,
      phone: user.phone ?? null,
      mfaEnabled: Boolean(user.mfaEnabled),
      mfaSecret: user.mfaSecret ?? null,
      mfaBackupCodes: user.mfaBackupCodes ?? [],
      metadata: user.metadata ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as Partial<UserOrmEntity>);
    return this.repository.save(entity);
  }
}
