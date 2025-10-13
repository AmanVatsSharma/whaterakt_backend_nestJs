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

    const contacts = await this.prisma.contact.findMany({ where: { tenantId, subscribed: true } });
    const perTenantRate = Number(process.env.CAMPAIGN_RATE_PER_MIN || 600); // messages/minute
    const batchSize = Math.max(1, Math.min(100, Math.floor(perTenantRate / 6))); // ~10s windows
    const batches = this.chunk(contacts, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      for (const contact of batch) {
        const payload: any = {
          to: contact.phone,
          // default to text if no template provided
          type: messageTemplate ? 'template' : 'text',
        };
        if (messageTemplate) {
          payload.template = messageTemplate;
        } else {
          payload.text = { body: `Campaign ${campaignId}` };
        }
        // attach campaignId for downstream persistence
        payload.campaignId = campaignId;
        await this.messageQueue.add('message', { tenantId, payload, campaignId });
      }
      // Spread batches across time to respect per-tenant rate
      if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 10_000));
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
