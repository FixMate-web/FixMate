import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/auth.models';

/**
 * Sanitizes returnUrl to prevent Open Redirect vulnerabilities.
 * Only permits single-slash internal paths (e.g., `/dashboard/profile`).
 */
export function sanitizeReturnUrl(candidate: string | null | undefined): string {
  if (!candidate || typeof candidate !== 'string') {
    return '/dashboard';
  }
  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/dashboard';
  }
  return trimmed;
}

export function resolveDefaultWorkspaceByRole(role: UserRole | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'PROVIDER':
      return '/dashboard/provider';
    default:
      return '/dashboard/customer';
  }
}

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureInitialized().pipe(
    map((authenticated) => {
      if (authenticated) {
        return true;
      }
      const safeReturnUrl = sanitizeReturnUrl(state.url);
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: safeReturnUrl },
      });
    }),
  );
};

export function roleGuard(allowedRoles: readonly UserRole[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.ensureInitialized().pipe(
      map((authenticated) => {
        if (!authenticated) {
          const safeReturnUrl = sanitizeReturnUrl(state.url);
          return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: safeReturnUrl },
          });
        }

        const user = authService.currentUser();
        if (user && allowedRoles.includes(user.role)) {
          return true;
        }

        return router.createUrlTree([resolveDefaultWorkspaceByRole(user?.role)]);
      }),
    );
  };
}
