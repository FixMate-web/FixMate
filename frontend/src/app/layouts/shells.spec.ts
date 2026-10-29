import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { ApiHealthService } from '../core/services/api-health.service';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { PublicLayoutComponent } from './public-layout/public-layout.component';

describe('Application Shells & Graceful Health Check', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent, AuthLayoutComponent, DashboardLayoutComponent],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders PublicLayoutComponent with skip-link, two-column Explore Services mega-menu, and handles connected health state', () => {
    const fixture = TestBed.createComponent(PublicLayoutComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/health'));
    req.flush({
      status: 'ok',
      service: 'fixmate-backend',
      version: '0.1.0',
      timestamp: '2026-10-29T12:00:00.000Z',
      database: { status: 'connected' },
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.skip-link')).toBeTruthy();
    expect(compiled.querySelector('#main-content')).toBeTruthy();
    expect(fixture.componentInstance.health.connectionState()).toBe('connected');

    // Open the two-column Explore Services mega-menu
    fixture.componentInstance.toggleExploreMenu();
    fixture.detectChanges();
    expect(compiled.querySelector('.explore-mega-menu')).toBeTruthy();
  });

  it('transitions gracefully to offline state when backend health endpoint is unreachable', () => {
    const healthService = TestBed.inject(ApiHealthService);
    healthService.checkHealth();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/health'));
    req.error(new ProgressEvent('Network error'));

    expect(healthService.connectionState()).toBe('offline');
    expect(healthService.healthPayload()).toBeNull();
  });

  it('renders AuthLayoutComponent and DashboardLayoutComponent with account navigation', () => {
    const authFixture = TestBed.createComponent(AuthLayoutComponent);
    authFixture.detectChanges();
    const authEl = authFixture.nativeElement as HTMLElement;
    expect(authEl.querySelector('#main-content')).toBeTruthy();
    expect(authEl.querySelector('a[href="/auth/login"]')).toBeTruthy();

    const dashFixture = TestBed.createComponent(DashboardLayoutComponent);
    dashFixture.detectChanges();
    const dashEl = dashFixture.nativeElement as HTMLElement;
    expect(dashEl.querySelector('#dashboard-sidebar')).toBeTruthy();
    expect(dashEl.querySelector('a[href="/dashboard/profile"]')).toBeTruthy();
  });
});
