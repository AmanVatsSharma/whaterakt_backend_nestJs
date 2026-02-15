/**
* File: src/contact/contact.module.ts
* Module: contact
* Purpose: Contact module wiring resolver and TypeORM-backed service.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Contacts remain tenant scoped through service-level filters.
* - Tag and group relations are handled in the service layer.
*/
import { Module } from '@nestjs/common';
import { ContactResolver } from './contact.resolver';
import { ContactService } from './contact.service';
@Module({
  providers: [ContactResolver, ContactService],
  exports: [ContactService],
})
export class ContactModule {}
