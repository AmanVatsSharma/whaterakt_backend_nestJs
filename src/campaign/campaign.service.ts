import { Injectable } from '@nestjs/common';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { CampaignStatus } from './enums/campaign-status.enum';

@Injectable()
export class CampaignService extends TenantAwareService {
  async createCampaign(input: CreateCampaignInput) {
    return this.prisma.campaign.create({
      data: {
        ...input,
        status: CampaignStatus.DRAFT,
        tenantId: this.tenantId,
      },
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      where: this.withTenant(),
      include: { messages: true },
    });
  }
}
