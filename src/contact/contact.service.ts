import { Injectable } from '@nestjs/common';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { PrismaService } from 'src/prisma.service';
import { CreateContactInput } from './dto/create-contact.input';

@Injectable()
export class ContactService extends TenantAwareService {
  constructor(protected readonly prisma: PrismaService) { super(prisma); }
  async createContact(input: CreateContactInput & { tags?: string[] }) {
    const { tags, ...rest } = input || {} as any;
    const created = await this.prisma.contact.create({
      data: {
        ...rest,
        tenantId: this.tenantId,
      },
    });
    if (Array.isArray(tags) && tags.length) {
      for (const tagName of tags) {
        const tag = await this.prisma.tag.upsert({
          where: { tenantId_name: { tenantId: this.tenantId!, name: tagName } },
          update: {},
          create: { tenantId: this.tenantId!, name: tagName },
        });
        await this.prisma.contactTag.upsert({
          where: { contactId_tagId: { contactId: created.id, tagId: tag.id } },
          update: {},
          create: { contactId: created.id, tagId: tag.id },
        });
      }
    }
    return created;
  }

  async findAll() {
    return this.prisma.contact.findMany({
      where: this.withTenant(),
      include: { groups: true },
    });
  }
}
