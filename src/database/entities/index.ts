/**
* File: src/database/entities/index.ts
* Module: database
* Purpose: Central export list for TypeORM entity registration.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Used by database config to keep entity registration in one place.
* - Export order is flat to simplify imports across modules.
*/
import { AutomationOrmEntity } from './automation.entity';
import { AutomationExecutionLogOrmEntity } from './automation-execution-log.entity';
import { CampaignOrmEntity } from './campaign.entity';
import { ConsentLogOrmEntity } from './consent-log.entity';
import { ContactOrmEntity } from './contact.entity';
import { ContactTagOrmEntity } from './contact-tag.entity';
import { ConversationNoteOrmEntity } from './conversation-note.entity';
import { ConversationOrmEntity, ConversationStatus } from './conversation.entity';
import { ConversationTagOrmEntity } from './conversation-tag.entity';
import { GroupOrmEntity } from './group.entity';
import { MessageDirection, MessageOrmEntity, MessageStatus } from './message.entity';
import { ShopifyConnectionOrmEntity } from './shopify-connection.entity';
import { ShopifyCustomerOrmEntity } from './shopify-customer.entity';
import { ShopifyOrderOrmEntity } from './shopify-order.entity';
import { ShopifyProductOrmEntity } from './shopify-product.entity';
import { ShopifySyncLogOrmEntity } from './shopify-sync-log.entity';
import { TagOrmEntity } from './tag.entity';
import { TeamInviteOrmEntity } from './team-invite.entity';
import { TeamMemberOrmEntity } from './team-member.entity';
import { TeamOrmEntity } from './team.entity';
import { TemplateOrmEntity, TemplateStatus } from './template.entity';
import { TenantOrmEntity } from './tenant.entity';
import { UserOrmEntity } from './user.entity';
import {
  WhatsAppAssignmentAuditAction,
  WhatsAppAssignmentAuditOrmEntity,
} from './whatsapp-assignment-audit.entity';
import {
  WhatsAppChannelOrmEntity,
  WhatsAppObaStatus,
  WhatsAppChannelStatus,
} from './whatsapp-channel.entity';
import {
  WhatsAppManagedNumberOrmEntity,
  WhatsAppManagedNumberStatus,
} from './whatsapp-number.entity';

export const DATABASE_ENTITIES = [
  TenantOrmEntity,
  UserOrmEntity,
  CampaignOrmEntity,
  ContactOrmEntity,
  GroupOrmEntity,
  TemplateOrmEntity,
  MessageOrmEntity,
  ConversationOrmEntity,
  ConversationNoteOrmEntity,
  TagOrmEntity,
  ContactTagOrmEntity,
  ConversationTagOrmEntity,
  AutomationOrmEntity,
  AutomationExecutionLogOrmEntity,
  ConsentLogOrmEntity,
  TeamOrmEntity,
  TeamInviteOrmEntity,
  TeamMemberOrmEntity,
  ShopifyConnectionOrmEntity,
  ShopifyOrderOrmEntity,
  ShopifyCustomerOrmEntity,
  ShopifyProductOrmEntity,
  ShopifySyncLogOrmEntity,
  WhatsAppChannelOrmEntity,
  WhatsAppManagedNumberOrmEntity,
  WhatsAppAssignmentAuditOrmEntity,
] as const;

export {
  AutomationOrmEntity,
  AutomationExecutionLogOrmEntity,
  CampaignOrmEntity,
  ConsentLogOrmEntity,
  ContactOrmEntity,
  ContactTagOrmEntity,
  ConversationNoteOrmEntity,
  ConversationOrmEntity,
  ConversationTagOrmEntity,
  GroupOrmEntity,
  ConversationStatus,
  MessageDirection,
  MessageStatus,
  MessageOrmEntity,
  ShopifyConnectionOrmEntity,
  ShopifyCustomerOrmEntity,
  ShopifyOrderOrmEntity,
  ShopifyProductOrmEntity,
  ShopifySyncLogOrmEntity,
  TagOrmEntity,
  TeamInviteOrmEntity,
  TeamMemberOrmEntity,
  TeamOrmEntity,
  TemplateOrmEntity,
  TemplateStatus,
  TenantOrmEntity,
  UserOrmEntity,
  WhatsAppAssignmentAuditAction,
  WhatsAppAssignmentAuditOrmEntity,
  WhatsAppChannelOrmEntity,
  WhatsAppObaStatus,
  WhatsAppChannelStatus,
  WhatsAppManagedNumberOrmEntity,
  WhatsAppManagedNumberStatus,
};
