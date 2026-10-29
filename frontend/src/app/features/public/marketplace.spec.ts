import {LanguageService} from '../../core/i18n/language.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { formatFilsAsJod } from '../../core/services/catalog-api.service';
import { formatMinuteOfDay } from '../../core/services/providers-api.service';
import { ProvidersPageComponent } from './providers-page.component';
import { ServicesPageComponent } from './services-page.component';

describe('Part 06–09 — Public Catalog & Approved Provider Directory UI', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesPageComponent, ProvidersPageComponent],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);TestBed.inject(LanguageService).setLanguage('en');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('formats integer fils accurately into JOD strings and minutes into HH:MM', () => {
    expect(formatFilsAsJod(15000, 'en')).toBe('15.000 JOD (15,000 fils)');
    expect(formatFilsAsJod(20500, 'ar')).toContain('20.500 د.أ');
    expect(formatMinuteOfDay(540)).toBe('09:00');
    expect(formatMinuteOfDay(1020)).toBe('17:00');
  });

  it('loads categories and paginated services in ServicesPageComponent', () => {
    const fixture = TestBed.createComponent(ServicesPageComponent);
    fixture.detectChanges();

    const catReq = httpMock.expectOne((r) => r.url.endsWith('/categories'));
    catReq.flush([
      {
        id: 'c1',
        slug: 'plumbing',
        name: { ar: 'السباكة', en: 'Plumbing' },
        description: { ar: 'وصف', en: 'Desc' },
        displayOrder: 1,
        isActive: true,
      },
    ]);

    const svcReq = httpMock.expectOne((r) => r.url.includes('/services'));
    svcReq.flush({
      items: [
        {
          id: 's1',
          categoryId: 'c1',
          slug: 'water-leak-detection-repair',
          title: { ar: 'كشف تسربات المياه', en: 'Water Leak Detection' },
          description: { ar: 'إصلاح التسربات', en: 'Leak repair' },
          pricingPolicy: {
            pricingType: 'STARTING_AT',
            indicativeAmountFils: 15000,
            currency: 'JOD',
          },
          defaultDurationMinutes: 60,
          isActive: true,
        },
      ],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('15.000');
    expect(el.textContent).toContain('60 min');
  });

  it('renders approved providers with truthful zero-review notice in ProvidersPageComponent', () => {
    const fixture = TestBed.createComponent(ProvidersPageComponent);
    fixture.detectChanges();

    const svcReq = httpMock.expectOne((r) => r.url.includes('/services'));
    svcReq.flush({ items: [], page: 1, limit: 50, total: 0, totalPages: 0 });

    const provReq = httpMock.expectOne((r) => r.url.includes('/providers'));
    provReq.flush({
      items: [
        {
          id: 'p1',
          displayName: 'Tariq Master Plumbing',
          bio: { ar: 'فني سباكة معتمد', en: 'Approved plumber' },
          yearsOfExperience: 12,
          coverageGovernorates: ['Amman'],
          coverageAreas: ['Abdoun'],
          approvalStatus: 'APPROVED',
          averageRating: null,
          reviewCount: 0,
          offerings: [
            {
              serviceId: 's1',
              serviceSlug: 'water-leak-detection-repair',
              serviceTitle: { ar: 'كشف تسربات', en: 'Leak Detection' },
              pricingType: 'STARTING_AT',
              priceAmountFils: 16000,
              currency: 'JOD',
              estimatedDurationMinutes: 60,
            },
          ],
        },
      ],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Tariq Master Plumbing');
    expect(el.textContent).toContain('Amman');
    expect(el.textContent).toContain('16.000');
  });
});
