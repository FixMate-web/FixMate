import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../i18n/language.service';
import {
  AuthSessionResponse,
  AuthUserProfile,
  LoginRequestPayload,
  RegisterRequestPayload,
  UpdateProfilePayload,
} from './auth.models';

const CSRF_HEADERS = new HttpHeaders({
  'X-Requested-With': 'FixMateClient',
});

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(LanguageService);

  /**
   * Access token is held strictly in memory (never written to localStorage or sessionStorage).
   */
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<AuthUserProfile | null>(null);
  private readonly initializedSignal = signal<boolean>(false);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  private refreshInFlight$: Observable<boolean> | null = null;

  readonly currentUser = this.userSignal.asReadonly();
  readonly isInitialized = this.initializedSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly errorMessage = this.errorSignal.asReadonly();

  readonly isAuthenticated = computed<boolean>(
    () => !!this.userSignal() && !!this.accessTokenSignal(),
  );

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Restores session on app startup or route guard evaluation using the HttpOnly refresh cookie.
   * Coordinates concurrent callers with a single shared in-flight request.
   */
  ensureInitialized(): Observable<boolean> {
    if (this.initializedSignal()) {
      return of(this.isAuthenticated());
    }
    return this.refreshSession();
  }

  register(payload: RegisterRequestPayload): Observable<AuthUserProfile> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<AuthSessionResponse>(`${environment.apiBaseUrl}/auth/register`, payload, {
        withCredentials: true,
        headers: CSRF_HEADERS,
      })
      .pipe(
        tap((res) => this.applySession(res)),
        map((res) => res.user),
        catchError((err: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(err));
          return throwError(() => err);
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  login(payload: LoginRequestPayload): Observable<AuthUserProfile> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<AuthSessionResponse>(`${environment.apiBaseUrl}/auth/login`, payload, {
        withCredentials: true,
        headers: CSRF_HEADERS,
      })
      .pipe(
        tap((res) => this.applySession(res)),
        map((res) => res.user),
        catchError((err: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(err));
          return throwError(() => err);
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  refreshSession(): Observable<boolean> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<AuthSessionResponse>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: CSRF_HEADERS,
        },
      )
      .pipe(
        tap((res) => {
          this.applySession(res);
          this.initializedSignal.set(true);
        }),
        map(() => true),
        catchError(() => {
          this.clearSessionState();
          this.initializedSignal.set(true);
          return of(false);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    return this.http
      .post<{ loggedOut: boolean }>(
        `${environment.apiBaseUrl}/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: CSRF_HEADERS,
        },
      )
      .pipe(
        catchError(() => of({ loggedOut: true })),
        tap(() => this.clearSessionState()),
        map(() => undefined),
      );
  }

  fetchMe(): Observable<AuthUserProfile> {
    return this.http.get<AuthUserProfile>(`${environment.apiBaseUrl}/users/me`).pipe(
      tap((profile) => {
        this.userSignal.set(profile);
        if (profile.preferredLanguage === 'ar' || profile.preferredLanguage === 'en') {
          this.i18n.setLanguage(profile.preferredLanguage);
        }
      }),
    );
  }

  updateMyProfile(payload: UpdateProfilePayload): Observable<AuthUserProfile> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .patch<AuthUserProfile>(`${environment.apiBaseUrl}/users/me`, payload)
      .pipe(
        tap((profile) => {
          this.userSignal.set(profile);
          if (profile.preferredLanguage === 'ar' || profile.preferredLanguage === 'en') {
            this.i18n.setLanguage(profile.preferredLanguage);
          }
        }),
        catchError((err: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(err));
          return throwError(() => err);
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  syncUserRole(newRole: AuthUserProfile['role']): void {
    const current = this.userSignal();
    if (current) {
      this.userSignal.set({ ...current, role: newRole });
    }
  }

  clearSessionState(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.errorSignal.set(null);
  }

  private applySession(res: AuthSessionResponse): void {
    this.accessTokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
    this.initializedSignal.set(true);
    if (res.user.preferredLanguage === 'ar' || res.user.preferredLanguage === 'en') {
      this.i18n.setLanguage(res.user.preferredLanguage);
    }
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message;
      if (Array.isArray(msg)) {
        return msg.join(' · ');
      }
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
      if (err.status === 0) {
        return 'Unable to reach FixMate API server.';
      }
    }
    return 'Request failed. Please check your input and try again.';
  }
}
