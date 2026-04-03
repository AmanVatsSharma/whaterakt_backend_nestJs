import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { getQueueToken } from '@nestjs/bull';
import { DataSource } from 'typeorm';
import { CampaignOrmEntity, ContactOrmEntity } from '../database/entities';
import { CampaignStatus, CampaignType } from './enums';

describe('CampaignService', () => {
  let service: CampaignService;
  const queueAdd = jest.fn();
  const campaignRepository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: payload.id || 'campaign-1', ...payload })),
    find: jest.fn(async () => []),
    findOne: jest.fn(),
    remove: jest.fn(async () => undefined),
  };
  const contactRepository = {
    count: jest.fn(async () => 0),
  };
  const dataSourceMock = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === CampaignOrmEntity) {
        return campaignRepository;
      }
      if (entity === ContactOrmEntity) {
        return contactRepository;
      }
      return campaignRepository;
    }),
  };

  beforeEach(async () => {
    queueAdd.mockReset();
    campaignRepository.create.mockImplementation((payload) => payload);
    campaignRepository.save.mockImplementation(async (payload) => ({
      id: payload.id || 'campaign-1',
      ...payload,
    }));
    campaignRepository.find.mockResolvedValue([]);
    campaignRepository.findOne.mockResolvedValue(null as any);
    campaignRepository.remove.mockResolvedValue(undefined);
    contactRepository.count.mockResolvedValue(0);
    dataSourceMock.getRepository.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getQueueToken('campaigns'), useValue: { add: queueAdd } },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a scheduled campaign and enqueues dispatch', async () => {
    contactRepository.count.mockResolvedValue(2);
    const result = await service.createCampaign(
      {
        name: 'Launch',
        type: CampaignType.BROADCAST,
        messageBody: 'Welcome!',
        audienceContactIds: ['contact-1', 'contact-2'],
        scheduledAt: new Date('2026-02-17T10:00:00.000Z'),
      },
      'tenant-1',
      'user-1',
    );

    expect(result.status).toBe(CampaignStatus.SCHEDULED);
    expect(result.audienceContactIds).toEqual(['contact-1', 'contact-2']);
    expect(queueAdd).toHaveBeenCalledTimes(1);
  });

  it('updates campaign name without breaking existing composition', async () => {
    campaignRepository.findOne.mockResolvedValue({
      id: 'campaign-1',
      name: 'Before',
      tenantId: 'tenant-1',
      messageBody: 'Body',
      templateName: null,
      audienceContactIds: [],
      status: CampaignStatus.DRAFT,
    });

    const result = await service.updateCampaign('tenant-1', 'campaign-1', {
      name: 'After',
    });

    expect(result.name).toBe('After');
    expect(result.messageBody).toBe('Body');
  });

  it('duplicates campaign as new draft', async () => {
    campaignRepository.findOne.mockResolvedValue({
      id: 'campaign-1',
      tenantId: 'tenant-1',
      name: 'Original',
      type: CampaignType.BROADCAST,
      status: CampaignStatus.SENT,
      messageBody: 'Body',
      templateName: null,
      audienceContactIds: [],
      userId: 'user-1',
    });

    const result = await service.duplicateCampaign(
      'tenant-1',
      'campaign-1',
      'user-1',
      'Original Copy',
    );

    expect(result.status).toBe(CampaignStatus.DRAFT);
    expect(result.name).toBe('Original Copy');
  });
});
