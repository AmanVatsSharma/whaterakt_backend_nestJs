import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PrismaService } from 'src/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('campaigns')
export class CampaignProcessor {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
  ) {}

  @Process('dispatch')
  async handleDispatch(job: Job<{ tenantId: string; campaignId: string; messageTemplate?: any }>) {
    const { tenantId, campaignId, messageTemplate } = job.data;

    const contacts = await this.prisma.contact.findMany({ where: { tenantId } });
    const batches = this.chunk(contacts, 100);

    for (const batch of batches) {
      for (const contact of batch) {
        const payload = {
          to: contact.phone,
          template: messageTemplate ?? { text: `Campaign ${campaignId}` },
        };
        await this.messageQueue.add('message', { tenantId, payload });
      }
    }

    this.logger.log(`Dispatched campaign ${campaignId} for tenant ${tenantId} to ${contacts.length} contacts`);
    return { success: true, count: contacts.length };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
  }
}
