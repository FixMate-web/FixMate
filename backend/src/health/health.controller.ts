import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  checkLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get()
  checkHealth(): HealthCheckResponse {
    const health = this.healthService.getHealthStatus();
    if (health.status !== 'ok') throw new ServiceUnavailableException(health);
    return health;
  }
}
