import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const RETRY_HEADER = 'x-fixmate-auth-retried';

function isTrustedApiRequest(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl) || url.startsWith('/api/v1');
}

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!isTrustedApiRequest(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  let outgoingReq = req;
  if (accessToken && !isAuthEndpoint(req.url)) {
    outgoingReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(outgoingReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthEndpoint(req.url) &&
        !req.headers.has(RETRY_HEADER)
      ) {
        return authService.refreshSession().pipe(
          switchMap((refreshed) => {
            const newToken = authService.getAccessToken();
            if (!refreshed || !newToken) {
              return throwError(() => error);
            }
            const retriedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                [RETRY_HEADER]: 'true',
              },
            });
            return next(retriedReq);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
