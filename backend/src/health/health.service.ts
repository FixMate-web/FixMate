import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export type DatabaseConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'disconnected'
  | 'unconfigured';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: DatabaseConnectionState;
  };
}

const MONGOOSE_READY_STATE_MAP: Record<number, DatabaseConnectionState> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() @InjectConnection() private readonly mongoConnection?: Connection,
  ) {}

  getHealthStatus(): HealthCheckResponse {
    const dbState: DatabaseConnectionState = this.mongoConnection
      ? (MONGOOSE_READY_STATE_MAP[this.mongoConnection.readyState] ?? 'disconnected')
      : 'unconfigured';

    const isHealthy = dbState === 'connected';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'fixmate-backend',
      version: '0.1.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbState,
      },
    };
  }
}
