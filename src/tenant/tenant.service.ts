import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTenantInput } from './dto/create-tenant.input';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(input: CreateTenantInput) {
    return this.prisma.tenant.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }
} 