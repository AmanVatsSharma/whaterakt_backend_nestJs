import { Module } from '@nestjs/common';
import { ContactResolver } from './contact.resolver';
import { ContactService } from './contact.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [ContactResolver, ContactService, PrismaService],
  exports: [ContactService],
})
export class ContactModule {}
