import { ContactResolver } from './contact.resolver';
import { ContactService } from './contact.service';

describe('ContactResolver', () => {
  let resolver: ContactResolver;
  const contactServiceMock: Pick<ContactService, 'findAll' | 'createContact'> = {
    findAll: jest.fn(async () => []),
    createContact: jest.fn(async () => ({ id: 'contact-1' } as any)),
  };

  beforeEach(async () => {
    resolver = new ContactResolver(contactServiceMock as ContactService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
