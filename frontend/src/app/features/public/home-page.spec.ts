import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { DiscoverySearchComponent } from '../../shared/marketplace/discovery-search.component';

describe('Home discovery', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    TestBed.configureTestingModule({
      imports: [HomePageComponent, DiscoverySearchComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushFeeds() {
    http
      .expectOne((r) => r.url.endsWith('/services'))
      .flush({ items: [], total: 0, totalPages: 0, page: 1, limit: 6 });
    http
      .expectOne((r) => r.url.endsWith('/providers'))
      .flush({ items: [], total: 0, totalPages: 0, page: 1, limit: 2 });
  }

  it('renders only categories supplied by the catalog', () => {
    const f = TestBed.createComponent(HomePageComponent);
    flushFeeds();
    http
      .expectOne((r) => r.url.endsWith('/categories'))
      .flush([
        {
          id: 'one',
          slug: 'cleaning',
          name: { en: 'New service', ar: 'خدمة جديدة' },
          description: { en: '', ar: '' },
          isActive: true,
          displayOrder: 1,
        },
      ]);
    f.detectChanges();
    const buttons = f.nativeElement.querySelectorAll('.cat-icon-tab');
    expect(buttons.length).toBe(1);
    buttons[0].click();
    expect(f.componentInstance.selectedCategorySlug()).toBe('cleaning');
  });

  it('offers a retry after a failed catalog request', () => {
    const f = TestBed.createComponent(HomePageComponent);
    flushFeeds();
    http
      .expectOne((r) => r.url.endsWith('/categories'))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    f.nativeElement.querySelector('.home-notice button').click();
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    http
      .expectOne((r) => r.url.endsWith('/services'))
      .flush({ items: [], total: 0, totalPages: 0, page: 1, limit: 12 });
    expect(f.componentInstance.error()).toBe(false);
  });

  it('switches Explore More Projects and Home Resources tabs interactively', () => {
    const f = TestBed.createComponent(HomePageComponent);
    flushFeeds();
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    f.detectChanges();

    expect(f.componentInstance.activeExploreTabId()).toBe('maintenance');
    f.componentInstance.selectExploreTab('seasonal');
    f.detectChanges();
    expect(f.componentInstance.activeExploreTab().id).toBe('seasonal');

    expect(f.componentInstance.activeResourceId()).toBe('cost-guides');
    f.componentInstance.selectResourceCard('maintenance-tips');
    f.detectChanges();
    expect(f.componentInstance.activeResourceCard().id).toBe('maintenance-tips');
  });

  it('sends trimmed search text and the selected governorate to discovery', () => {
    const f = TestBed.createComponent(DiscoverySearchComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    f.componentInstance.form.setValue(
      { q: '  plumbing  ', governorate: 'Irbid' },
      { emitEvent: false },
    );
    f.componentInstance.search();
    expect(navigate).toHaveBeenCalledWith(['/services'], {
      queryParams: { q: 'plumbing', governorate: 'Irbid' },
    });
  });

  it('loads debounced suggestions from the real service endpoint', async () => {
    const f = TestBed.createComponent(DiscoverySearchComponent);
    f.componentInstance.form.controls.q.setValue('leak');
    await new Promise((resolve) => setTimeout(resolve, 300));
    const req = http.expectOne((r) => r.url.endsWith('/services') && r.params.get('q') === 'leak');
    req.flush({ items: [{ id: 'one', title: { en: 'Leak repair', ar: 'إصلاح تسرب' } }] });
    expect(f.componentInstance.suggestions().length).toBe(1);
  });
});
