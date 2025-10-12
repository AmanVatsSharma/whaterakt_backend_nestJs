import { Injectable } from '@nestjs/common';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { PrismaService } from 'src/prisma.service';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { CampaignStatus } from './enums/campaign-status.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CampaignService extends TenantAwareService {
  constructor(
    @InjectQueue('campaigns') private readonly campaignsQueue: Queue,
    protected readonly prisma: PrismaService,
  ) { super(prisma); }

  async createCampaign(input: CreateCampaignInput) {
    return this.prisma.campaign.create({
      data: {
        ...input,
        status: CampaignStatus.DRAFT,
        tenantId: this.tenantId,
      },
    }).then(async (campaign) => {
      // Schedule dispatch job
      const delay = input.scheduledAt ? Math.max(0, new Date(input.scheduledAt).getTime() - Date.now()) : 0;
      await this.campaignsQueue.add('dispatch', {
        tenantId: this.tenantId,
        campaignId: campaign.id,
      }, { delay });
      return campaign;
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      where: this.withTenant(),
      include: { messages: true },
    });
  }
}
