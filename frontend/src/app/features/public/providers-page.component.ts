import {ChangeDetectionStrategy,Component,DestroyRef,OnInit,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {Subject,catchError,debounceTime,distinctUntilChanged,of,switchMap} from 'rxjs';
import {LanguageService} from '../../core/i18n/language.service';
import {CatalogApiService,CatalogServiceItem,formatFilsAsJod} from '../../core/services/catalog-api.service';
import {ProviderCardComponent} from '../../shared/marketplace/provider-card.component';
import {ProvidersApiService,PublicProviderSummary} from '../../core/services/providers-api.service';
import {GOVERNORATES,validPage} from '../../shared/marketplace/marketplace.utils';
@Component({selector:'app-providers-page',standalone:true,imports:[FormsModule,RouterLink,ProviderCardComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./providers-page.component.html',styleUrl:'./discovery-page.scss'})
export class ProvidersPageComponent implements OnInit {
  private readonly providersApi = inject(ProvidersApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';readonly governorates=GOVERNORATES;readonly total=signal(0);readonly totalPages=signal(0);

  readonly catalogServices = signal<CatalogServiceItem[]>([]);
  readonly providers = signal<PublicProviderSummary[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly searchInput = signal('');
  readonly serviceSlug = signal('');
  readonly governorate = signal('');
  readonly sort = signal<'newest' | 'name_asc' | 'experience_desc'>('newest');
  readonly page = signal(1);

  private readonly searchSubject = new Subject<string>();
  private readonly reloadTrigger = new Subject<void>();

  ngOnInit(): void {
    this.catalogApi
      .getAllServices()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => this.catalogServices.set(res));

    this.searchSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchInput.set(term);
        this.page.set(1);
        this.syncUrlAndReload();
      });

    this.reloadTrigger
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
          return this.providersApi
            .listPublicProviders({
              page: this.page(),
              limit: 12,
              q: this.searchInput() || undefined,
              serviceSlug: this.serviceSlug() || undefined,
              governorate: this.governorate() || undefined,
              sort: this.sort(),
            })
            .pipe(
              catchError(() => {
                this.errorMessage.set(this.i18n.t().apiStatus.offlineHint);
                return of({ items: [], page: 1, limit: 12, total: 0, totalPages: 0 });
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.loading.set(false);
        this.providers.set(res.items);this.total.set(res.total);this.totalPages.set(res.totalPages);
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchInput.set(params.get('q') ?? '');
      this.serviceSlug.set(params.get('serviceSlug') ?? '');
      this.governorate.set(params.get('governorate') ?? '');
      const sortParam = params.get('sort') as 'newest' | 'name_asc' | 'experience_desc' | null;
      this.sort.set(sortParam && ['newest','name_asc','experience_desc'].includes(sortParam) ? sortParam : 'newest');this.page.set(validPage(params.get('page')));
      this.reloadTrigger.next();
    });
  }

  goToPage(page:number){this.page.set(page);this.syncUrlAndReload();}
  clearFilters(){this.searchSubject.next('');this.searchInput.set('');this.serviceSlug.set('');this.governorate.set('');this.page.set(1);this.syncUrlAndReload();}
  retry(): void {
    this.reloadTrigger.next();
  }

  formatFils(fils: number): string {
    return formatFilsAsJod(fils, this.i18n.lang());
  }

  onSearchInput(val: string): void {
    this.searchInput.set(val);
    this.searchSubject.next(val);
  }

  onServiceSlugChange(slug: string): void {
    this.serviceSlug.set(slug);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  onGovernorateChange(gov: string): void {
    this.governorate.set(gov);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  onSortChange(s: 'newest' | 'name_asc' | 'experience_desc'): void {
    this.sort.set(s);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  private syncUrlAndReload(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchInput().trim() || null,page:this.page()>1?this.page():null,
        serviceSlug: this.serviceSlug() || null,
        governorate: this.governorate() || null,
        sort: this.sort() !== 'newest' ? this.sort() : null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
