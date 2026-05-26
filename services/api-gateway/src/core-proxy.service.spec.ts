import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CoreProxyService } from './core-proxy.service';

describe('CoreProxyService', () => {
  let service: CoreProxyService;

  const httpServiceMock = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreProxyService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    service = module.get(CoreProxyService);
    httpServiceMock.get.mockReset();
    httpServiceMock.post.mockReset();
  });

  it('returns upstream payload from GET requests', async () => {
    httpServiceMock.get.mockReturnValue(of({ data: [{ id: 'event-1' }] }));

    await expect(service.get('http://events/events')).resolves.toEqual([{ id: 'event-1' }]);
  });

  it('returns upstream payload from POST requests', async () => {
    httpServiceMock.post.mockReturnValue(of({ data: { id: 'order-1' } }));

    await expect(service.post('http://orders/orders', { quantity: 1 })).resolves.toEqual({
      id: 'order-1',
    });
  });
});