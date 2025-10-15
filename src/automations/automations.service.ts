import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async handleInboundKeyword(tenantId: string, from: string, text: string) {
    const automations = await this.prisma.automation.findMany({ where: { tenantId, enabled: true, type: 'KEYWORD_REPLY' } });
    for (const a of automations) {
      try {
        const def = a.definition as any;
        const trigger = def?.trigger?.toLowerCase?.();
        if (trigger && text?.toLowerCase?.().includes(trigger)) {
          // TODO: enqueue reply via message queue
        }
      } catch {}
    }
  }

  async scheduleDripSequences() {
    // Placeholder for cron-based drip sequence scheduler
  }
}
