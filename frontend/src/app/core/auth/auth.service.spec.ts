import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { sanitizeReturnUrl } from '../guards/auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

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
});
