import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { sanitizeReturnUrl } from '../guards/auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('Part 05 — AuthService, Interceptor & ReturnUrl Security', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('logs in, holds access token strictly in memory (never in web storage), and clears state on logout', () => {
    service.login({ email: 'customer@example.com', password: 'Password123' }).subscribe();

    const loginReq = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
    expect(loginReq.request.withCredentials).toBe(true);
    expect(loginReq.request.headers.get('X-Requested-With')).toBe('FixMateClient');

    loginReq.flush({
      user: {
        id: 'u1',
        fullName: 'Sara Customer',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        preferredLanguage: 'ar',
      },
      accessToken: 'in-memory-jwt-token-xyz',
      expiresInSeconds: 900,
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe('in-memory-jwt-token-xyz');

    // Verify zero JWT storage in localStorage or sessionStorage
    expect(JSON.stringify(window.localStorage)).not.toContain('in-memory-jwt-token-xyz');
    expect(JSON.stringify(window.sessionStorage)).not.toContain('in-memory-jwt-token-xyz');

    // Verify interceptor attaches Bearer token to API calls
    service.fetchMe().subscribe();
    const meReq = httpMock.expectOne((r) => r.url.endsWith('/users/me'));
    expect(meReq.request.headers.get('Authorization')).toBe('Bearer in-memory-jwt-token-xyz');
    meReq.flush({
      id: 'u1',
      fullName: 'Sara Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      preferredLanguage: 'ar',
    });

    // Logout clears state
    service.logout().subscribe();
    const logoutReq = httpMock.expectOne((r) => r.url.endsWith('/auth/logout'));
    logoutReq.flush({ loggedOut: true });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it('sanitizes returnUrl to prevent open redirects', () => {
    expect(sanitizeReturnUrl('/dashboard/profile')).toBe('/dashboard/profile');
    expect(sanitizeReturnUrl('https://evil.example.com')).toBe('/dashboard');
    expect(sanitizeReturnUrl('//evil.example.com')).toBe('/dashboard');
    expect(sanitizeReturnUrl('\\\\evil.example.com')).toBe('/dashboard');
  });
  const session = { user: { id: 'u1', fullName: 'Sara', email: 'sara@example.com', role: 'CUSTOMER', status: 'ACTIVE', preferredLanguage: 'ar' }, accessToken: 'renewed-token', expiresInSeconds: 900 };

  it('restores a session after reload and shares concurrent refresh requests', () => {
    let restored = 0;
    service.ensureInitialized().subscribe(ok => { if (ok) restored++; });
    service.ensureInitialized().subscribe(ok => { if (ok) restored++; });
    const refresh = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get('X-Requested-With')).toBe('FixMateClient');
    refresh.flush(session);
    expect(restored).toBe(2);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('retries an expired access request with a refreshed in-memory token', () => {
    service.fetchMe().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/users/me`).flush({}, { status: 401, statusText: 'Expired' });
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`).flush(session);
    const retried = httpMock.expectOne(`${environment.apiBaseUrl}/users/me`);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer renewed-token');
    expect(retried.request.headers.has('x-fixmate-auth-retried')).toBe(false);
    retried.flush(session.user);
  });

  it('clears the session when refresh cookies are blocked, expired or revoked', () => {
    service.login({ email: 'sara@example.com', password: 'Password123' }).subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`).flush(session);
    service.refreshSession().subscribe(ok => expect(ok).toBe(false));
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('does not leak bearer tokens to URLs sharing only an API string prefix', () => {
    service.login({ email: 'sara@example.com', password: 'Password123' }).subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`).flush(session);
    const url = `${environment.apiBaseUrl}-untrusted/users/me`;
    TestBed.inject(HttpClient).get(url).subscribe();
    const untrusted = httpMock.expectOne(url);
    expect(untrusted.request.headers.has('Authorization')).toBe(false);
    untrusted.flush({});
  });

});
