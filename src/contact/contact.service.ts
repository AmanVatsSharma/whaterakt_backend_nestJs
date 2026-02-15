/**
* File: src/contact/contact.service.ts
* Module: contact
* Purpose: Tenant-scoped contact management service.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Persists contacts/tags through TypeORM repositories.
* - Accepts tenantId per call to avoid mutable singleton state.
*/
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ContactOrmEntity, ContactTagOrmEntity, TagOrmEntity } from '../database/entities';
import { CreateContactInput } from './dto/create-contact.input';

@Injectable()
export class ContactService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createContact(input: CreateContactInput & { tags?: string[] }, tenantId: string) {
    const { tags, ...rest } = input || {} as any;
    const contactRepository = this.dataSource.getRepository(ContactOrmEntity);
    const tagRepository = this.dataSource.getRepository(TagOrmEntity);
    const contactTagRepository = this.dataSource.getRepository(ContactTagOrmEntity);

    const created = await contactRepository.save(
      contactRepository.create({
        ...rest,
        tenantId,
      }),
    );

    if (Array.isArray(tags) && tags.length) {
      for (const tagName of tags) {
        let tag = await tagRepository.findOne({ where: { tenantId, name: tagName } });
        if (!tag) {
          tag = await tagRepository.save(tagRepository.create({ tenantId, name: tagName }));
        }

        const existingLink = await contactTagRepository.findOne({
          where: { contactId: created.id, tagId: tag.id },
        });
        if (!existingLink) {
          await contactTagRepository.save(
            contactTagRepository.create({ contactId: created.id, tagId: tag.id }),
          );
        }
      }
    }
    return created;
  }

  async findAll(tenantId: string) {
    return this.dataSource.getRepository(ContactOrmEntity).find({
      where: { tenantId },
      relations: { groups: true },
    });
  }
}
