import {ChangeDetectionStrategy,Component,DestroyRef,OnInit,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {Subject,catchError,debounceTime,distinctUntilChanged,of,switchMap} from 'rxjs';
import {LanguageService} from '../../core/i18n/language.service';
import {CatalogApiService,CatalogCategory,CatalogServiceItem,PricingType,formatFilsAsJod} from '../../core/services/catalog-api.service';
import {ServiceCardComponent} from '../../shared/marketplace/service-card.component';
import {GOVERNORATES} from '../../shared/marketplace/marketplace.utils';
@Component({selector:'app-services-page',standalone:true,imports:[FormsModule,RouterLink,ServiceCardComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./services-page.component.html',styleUrl:'./discovery-page.scss'})
export class ServicesPageComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(LanguageService);
  readonly ar=()=>this.i18n.lang()==='ar';
  readonly governorate=signal('');
  readonly governorates=GOVERNORATES;

  readonly categories = signal<CatalogCategory[]>([]);
  readonly services = signal<CatalogServiceItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly searchInput = signal('');
  readonly categorySlug = signal('');
  readonly pricingType = signal<PricingType | ''>('');
  readonly sort = signal<'displayOrder' | 'price_asc' | 'price_desc' | 'title_asc'>('displayOrder');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(0);

  private readonly searchSubject = new Subject<string>();
  private readonly reloadTrigger = new Subject<void>();

  ngOnInit(): void {
    this.catalogApi
      .getCategories()
      .pipe(
        catchError(() => of([] as CatalogCategory[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cats) => this.categories.set(cats));

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
          return this.catalogApi
            .getServices({
              page: this.page(),
              limit: 12,
              categorySlug: this.categorySlug() || undefined,
              pricingType: this.pricingType() || undefined,
              q: this.searchInput() || undefined,
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
        this.services.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchInput.set(params.get('q') ?? '');
      this.governorate.set(params.get('governorate') ?? '');
      this.categorySlug.set(params.get('categorySlug') ?? '');
      const pt=params.get('pricingType'); this.pricingType.set(pt && ['FIXED','STARTING_AT','INSPECTION_ONLY'].includes(pt) ? pt as PricingType : '');
      const sortParam = params.get('sort') as
        'displayOrder' | 'price_asc' | 'price_desc' | 'title_asc' | null;
      this.sort.set(sortParam && ['displayOrder','price_asc','price_desc','title_asc'].includes(sortParam) ? sortParam : 'displayOrder');
      const pageNum = Number(params.get('page') ?? '1');
      this.page.set(Number.isSafeInteger(pageNum) && pageNum >= 1 ? pageNum : 1);
      this.reloadTrigger.next();
    });
  }

  clearFilters():void {this.searchSubject.next('');this.searchInput.set('');this.categorySlug.set('');this.pricingType.set('');this.page.set(1);this.syncUrlAndReload();}
  onGovernorateChange(value:string):void {this.governorate.set(value);this.syncUrlAndReload();}
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

  onCategoryChange(slug: string): void {
    this.categorySlug.set(slug);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  onPricingTypeChange(pt: PricingType | ''): void {
    this.pricingType.set(pt);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  onSortChange(s: 'displayOrder' | 'price_asc' | 'price_desc' | 'title_asc'): void {
    this.sort.set(s);
    this.page.set(1);
    this.syncUrlAndReload();
  }

  goToPage(target: number): void {
    this.page.set(target);
    this.syncUrlAndReload();
  }

  private syncUrlAndReload(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchInput().trim() || null,
        governorate:this.governorate()||null,
        categorySlug: this.categorySlug() || null,
        pricingType: this.pricingType() || null,
        sort: this.sort() !== 'displayOrder' ? this.sort() : null,
        page: this.page() > 1 ? this.page() : null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
