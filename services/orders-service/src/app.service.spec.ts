import { AppService } from './app.service';

describe('AppService', () => {
  it('returns service health', () => {
    expect(new AppService().getHello()).toEqual({ service: 'orders-service', status: 'ok' });
  });
});