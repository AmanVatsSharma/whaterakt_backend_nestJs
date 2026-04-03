/**
* File: src/contact/contact.service.ts
* Module: contact
* Purpose: Tenant-scoped contact management service.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Persists contacts/tags through TypeORM repositories.
* - Accepts tenantId per call to avoid mutable singleton state.
*/
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Brackets, DataSource, MoreThanOrEqual, SelectQueryBuilder } from 'typeorm';
import { ContactOrmEntity, ContactTagOrmEntity, TagOrmEntity } from '../database/entities';
import { CreateContactInput } from './dto/create-contact.input';
import { AudienceSegment } from './entities/audience-segment.entity';

type ContactQueryFilters = {
  search?: string;
  segmentId?: string;
};

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

  async findAll(tenantId: string, filters?: ContactQueryFilters) {
    const repository = this.dataSource.getRepository(ContactOrmEntity);
    const query = repository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.groups', 'group')
      .leftJoinAndSelect('contact.tags', 'contactTag')
      .leftJoinAndSelect('contactTag.tag', 'tag')
      .where('contact.tenantId = :tenantId', { tenantId })
      .orderBy('contact.createdAt', 'DESC')
      .take(500)
      .distinct(true);

    this.applySearchFilter(query, filters?.search);
    this.applySegmentFilter(query, filters?.segmentId);

    const contacts = await query.getMany();
    return contacts.map((contact) => ({
      ...contact,
      tags: Array.from(new Set(contact.tags?.map((item) => item.tag?.name).filter(Boolean) || [])),
    }));
  }

  async listSegments(tenantId: string): Promise<AudienceSegment[]> {
    const contactRepository = this.dataSource.getRepository(ContactOrmEntity);
    const contactTagRepository = this.dataSource.getRepository(ContactTagOrmEntity);
    const now = Date.now();
    const recentThreshold = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [allCount, subscribedCount, recentCount, namedCount, taggedCount, rawTagCounts] =
      await Promise.all([
        contactRepository.count({ where: { tenantId } }),
        contactRepository.count({ where: { tenantId, subscribed: true } }),
        contactRepository.count({
          where: { tenantId, createdAt: MoreThanOrEqual(recentThreshold) },
        }),
        contactRepository
          .createQueryBuilder('contact')
          .where('contact.tenantId = :tenantId', { tenantId })
          .andWhere(
            new Brackets((builder) => {
              builder
                .where('NULLIF(TRIM(COALESCE(contact.firstName, \'\')), \'\') IS NOT NULL')
                .orWhere('NULLIF(TRIM(COALESCE(contact.lastName, \'\')), \'\') IS NOT NULL');
            }),
          )
          .getCount(),
        contactRepository
          .createQueryBuilder('contact')
          .leftJoin('contact.tags', 'contactTag')
          .where('contact.tenantId = :tenantId', { tenantId })
          .andWhere('contactTag.id IS NOT NULL')
          .distinct(true)
          .getCount(),
        contactTagRepository
          .createQueryBuilder('contactTag')
          .innerJoin(TagOrmEntity, 'tag', 'tag.id = contactTag.tagId')
          .innerJoin(ContactOrmEntity, 'contact', 'contact.id = contactTag.contactId')
          .where('tag.tenantId = :tenantId', { tenantId })
          .andWhere('contact.tenantId = :tenantId', { tenantId })
          .select('tag.name', 'name')
          .addSelect('COUNT(contactTag.id)', 'count')
          .groupBy('tag.name')
          .orderBy('COUNT(contactTag.id)', 'DESC')
          .getRawMany<{ name: string; count: string }>(),
      ]);

    const systemSegments: AudienceSegment[] = [
      {
        id: 'ALL',
        name: 'All Contacts',
        description: 'All contacts in this tenant',
        count: allCount,
      },
      {
        id: 'SUBSCRIBED',
        name: 'Subscribed',
        description: 'Contacts currently eligible for sends',
        count: subscribedCount,
      },
      {
        id: 'NAMED',
        name: 'Named Contacts',
        description: 'Contacts with at least one name field',
        count: namedCount,
      },
      {
        id: 'TAGGED',
        name: 'Tagged Contacts',
        description: 'Contacts with one or more tags',
        count: taggedCount,
      },
      {
        id: 'RECENT_30D',
        name: 'Recent 30 Days',
        description: 'Contacts created in the last 30 days',
        count: recentCount,
      },
    ];

    const tagSegments = rawTagCounts.map((row) => ({
      id: `TAG:${row.name}`,
      name: `Tag: ${row.name}`,
      description: `Contacts tagged with "${row.name}"`,
      count: Number(row.count) || 0,
    }));

    return [...systemSegments, ...tagSegments];
  }

  private applySearchFilter(
    query: SelectQueryBuilder<ContactOrmEntity>,
    search?: string,
  ) {
    const normalizedSearch = String(search || '').trim().toLowerCase();
    if (!normalizedSearch) {
      return;
    }
    const likeSearch = `%${normalizedSearch}%`;
    query.andWhere(
      new Brackets((builder) => {
        builder
          .where('LOWER(COALESCE(contact.phone, \'\')) LIKE :search', {
            search: likeSearch,
          })
          .orWhere('LOWER(COALESCE(contact.firstName, \'\')) LIKE :search', {
            search: likeSearch,
          })
          .orWhere('LOWER(COALESCE(contact.lastName, \'\')) LIKE :search', {
            search: likeSearch,
          })
          .orWhere('LOWER(COALESCE(tag.name, \'\')) LIKE :search', {
            search: likeSearch,
          });
      }),
    );
  }

  private applySegmentFilter(
    query: SelectQueryBuilder<ContactOrmEntity>,
    segmentId?: string,
  ) {
    const normalizedSegmentId = String(segmentId || '').trim().toUpperCase();
    if (!normalizedSegmentId || normalizedSegmentId === 'ALL') {
      return;
    }

    if (normalizedSegmentId === 'SUBSCRIBED') {
      query.andWhere('contact.subscribed = :subscribed', { subscribed: true });
      return;
    }
    if (normalizedSegmentId === 'NAMED') {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('NULLIF(TRIM(COALESCE(contact.firstName, \'\')), \'\') IS NOT NULL')
            .orWhere('NULLIF(TRIM(COALESCE(contact.lastName, \'\')), \'\') IS NOT NULL');
        }),
      );
      return;
    }
    if (normalizedSegmentId === 'TAGGED') {
      query.andWhere('tag.id IS NOT NULL');
      return;
    }
    if (normalizedSegmentId === 'RECENT_30D') {
      query.andWhere('contact.createdAt >= :recentThreshold', {
        recentThreshold: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });
      return;
    }

    if (normalizedSegmentId.startsWith('TAG:')) {
      const rawTagName = segmentId?.slice(4)?.trim();
      if (rawTagName) {
        query.andWhere('LOWER(tag.name) = LOWER(:tagName)', { tagName: rawTagName });
      }
    }
  }
}
