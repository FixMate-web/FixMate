import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthService & HealthController', () => {
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'NODE_ENV') return 'test';
      return defaultValue;
    }),
  } as unknown as ConfigService;

  it('returns status "ok" and database "connected" when Mongoose readyState is 1', () => {
    const mockConnection = { readyState: 1 } as unknown as Connection;
    const service = new HealthService(mockConfigService, mockConnection);
    const controller = new HealthController(service);

    const response = controller.checkHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('fixmate-backend');
    expect(response.version).toBe('0.1.0');
    expect(response.environment).toBe('test');
    expect(response.database.status).toBe('connected');
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
    expect(JSON.stringify(response)).not.toContain('mongodb://');
  });

  it('returns status "degraded" and database "disconnected" when Mongoose readyState is 0', () => {
    const mockConnection = { readyState: 0 } as unknown as Connection;
    const service = new HealthService(mockConfigService, mockConnection);

    const response = service.getHealthStatus();

    expect(response.status).toBe('degraded');
    expect(response.database.status).toBe('disconnected');
  });
});
