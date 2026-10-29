import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { HowItWorksComponent } from './how-it-works.component';
import { DISCOVERY_TAXONOMY } from './discovery-catalog.store';

describe('Homepage service guidance and discovery contract', () => {
  it('retains 14 groups of four and replaces the two featured concepts without duplicate slugs', () => {
    expect(DISCOVERY_TAXONOMY).toHaveLength(14);
    expect(DISCOVERY_TAXONOMY.every((c) => c.services.length === 4)).toBe(true);
    const movers = DISCOVERY_TAXONOMY.find((c) => c.slug === 'moving')!;
    expect(movers.services[3].slug).toBe('gas-cylinder-exchange');
    expect(movers.services[3].title.ar).toBe('تبديل جرة الغاز');
    const hvac = DISCOVERY_TAXONOMY.find((c) => c.slug === 'ac-maintenance')!;
    expect(hvac.services[2].slug).toBe('ac-cooling-diagnostics-recharge');
    expect(hvac.services[2].title.ar).toBe('إصلاح وصيانة المكيفات');
    const slugs = DISCOVERY_TAXONOMY.flatMap((c) => c.services.map((s) => s.slug));
    expect(new Set(slugs).size).toBe(56);
  });
  it('explains the supported flow in both languages and links to the real provider directory', () => {
    TestBed.configureTestingModule({
      imports: [HowItWorksComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(HowItWorksComponent);
    const i18n = TestBed.inject(LanguageService);
    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('bookings require their acceptance');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/providers');
    i18n.setLanguage('ar');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('كيف يعمل FixMate؟');
    expect(fixture.nativeElement.textContent).toContain('اطلب الخدمة');
  });
});
