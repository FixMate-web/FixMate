import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const CSRF_HEADER_NAME = 'x-requested-with';
export const CSRF_HEADER_EXPECTED_VALUE = 'fixmateclient';

/**
 * Explicit CSRF defense for cookie-authenticated mutation routes (/auth/refresh, /auth/logout):
 * 1. Verifies Origin (or Referer origin fallback) against the configured CORS_ORIGINS allowlist.
 * 2. Requires custom header `X-Requested-With: FixMateClient`.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('CORS_ORIGINS', 'http://localhost:4200');
    this.allowedOrigins = new Set(
      raw
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const requestedWithHeader = request.headers[CSRF_HEADER_NAME];
    const normalizedHeader = Array.isArray(requestedWithHeader)
      ? requestedWithHeader[0]
      : requestedWithHeader;

    if (
      typeof normalizedHeader !== 'string' ||
      normalizedHeader.trim().toLowerCase() !== CSRF_HEADER_EXPECTED_VALUE
    ) {
      throw new ForbiddenException(
        'CSRF protection: missing or invalid X-Requested-With header.',
      );
    }

    const originHeader = request.headers.origin;
    const refererHeader = request.headers.referer;

    const candidateOrigin = this.extractOrigin(originHeader) ?? this.extractOrigin(refererHeader);

    if (candidateOrigin && !this.allowedOrigins.has(candidateOrigin.toLowerCase())) {
      throw new ForbiddenException('CSRF protection: untrusted request origin.');
    }

    return true;
  }

  private extractOrigin(headerValue: string | string[] | undefined): string | null {
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!raw || typeof raw !== 'string') {
      return null;
    }
    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return raw.trim();
    }
  }
}
