import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiConnectionState = 'checking' | 'connected' | 'degraded' | 'offline';

export interface BackendHealthPayload {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment?: string;
  timestamp: string;
  uptimeSeconds?: number;
  database: {
    status: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiHealthService {
  private readonly http = inject(HttpClient);

  private readonly stateSignal = signal<ApiConnectionState>('checking');
  private readonly payloadSignal = signal<BackendHealthPayload | null>(null);
  private readonly lastCheckedSignal = signal<string | null>(null);

  readonly connectionState = this.stateSignal.asReadonly();
  readonly healthPayload = this.payloadSignal.asReadonly();
  readonly lastCheckedAt = this.lastCheckedSignal.asReadonly();

  checkHealth(): void {
    this.stateSignal.set('checking');

    this.http
      .get<BackendHealthPayload>(`${environment.apiBaseUrl}/health`)
      .pipe(
        catchError(() => {
          this.stateSignal.set('offline');
          this.payloadSignal.set(null);
          this.lastCheckedSignal.set(new Date().toISOString());
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.payloadSignal.set(response);
        this.lastCheckedSignal.set(new Date().toISOString());
        if (response.status === 'ok' && response.database?.status === 'connected') {
          this.stateSignal.set('connected');
        } else {
          this.stateSignal.set('degraded');
        }
      });
  }
}
