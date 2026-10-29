import { CanActivateFn } from '@angular/router';

/**
 * Phase 1 Navigation Guard Extension Point (Documentation & Architectural Boundary).
 *
 * IMPORTANT: Phase 1 intentionally does NOT fake authorization with hardcoded user identities
 * or simulated JWT tokens. In Phase 2, `authGuard` and `roleGuard` will inspect real
 * authenticated session state from `AuthService`.
 */
export const phase1ShellPreviewGuard: CanActivateFn = () => {
  return true;
};
