import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './database.config';
import { TenantOrmEntity } from './entities/tenant.entity';
import { UserOrmEntity } from './entities/user.entity';

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
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
