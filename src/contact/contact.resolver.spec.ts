import { ContactResolver } from './contact.resolver';
import { ContactService } from './contact.service';

describe('ContactResolver', () => {
  let resolver: ContactResolver;
  const contactServiceMock: Pick<
    ContactService,
    'findAll' | 'createContact' | 'listSegments'
  > = {
    findAll: jest.fn(async () => []),
    createContact: jest.fn(async () => ({ id: 'contact-1' } as any)),
    listSegments: jest.fn(async () => []),
  };

  beforeEach(async () => {
    resolver = new ContactResolver(contactServiceMock as ContactService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('delegates audienceSegments query to service', async () => {
    await resolver.audienceSegments({ tenant: { id: 'tenant-1' } as any });
    expect(contactServiceMock.listSegments).toHaveBeenCalledWith('tenant-1');
  });
});
