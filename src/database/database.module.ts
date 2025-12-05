import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './database.config';
import { TenantOrmEntity } from './entities/tenant.entity';
import { UserOrmEntity } from './entities/user.entity';
import { TenantWriteRepository } from './repositories/tenant-write.repository';
import { UserWriteRepository } from './repositories/user-write.repository';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmConfig(config),
    }),
    TypeOrmModule.forFeature([TenantOrmEntity, UserOrmEntity]),
  ],
  providers: [TenantWriteRepository, UserWriteRepository],
  exports: [TypeOrmModule, TenantWriteRepository, UserWriteRepository],
})
export class DatabaseModule {}
