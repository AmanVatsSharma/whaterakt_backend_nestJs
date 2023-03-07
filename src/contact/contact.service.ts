import { Injectable } from '@nestjs/common';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { CreateContactInput } from './dto/create-contact.input';

@Injectable()
export class ContactService extends TenantAwareService {
  async createContact(input: CreateContactInput) {
    return this.prisma.contact.create({
      data: {
        ...input,
        tenantId: this.tenantId,
      },
    });
  }

  async findAll() {
    return this.prisma.contact.findMany({
      where: this.withTenant(),
      include: { groups: true },
    });
  }
}
