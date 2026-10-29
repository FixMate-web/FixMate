import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkHealth(): HealthCheckResponse {
    return this.healthService.getHealthStatus();
  }
}
