import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';
import manifest from '../../../../public/catalog/discovery-taxonomy.json';
import {
  CatalogApiService,
  CatalogCategory,
  CatalogServiceItem,
} from '../../core/services/catalog-api.service';

export const DISCOVERY_TAXONOMY = manifest;
export type DiscoveryCategory = (typeof manifest)[number];
export type DiscoveryService = DiscoveryCategory['services'][number];
export const DISCOVERY_IMAGES = new Map(
  manifest.flatMap((c) => c.services.map((s) => [s.slug, s] as const)),
);

@Injectable({ providedIn: 'root' })
export class DiscoveryCatalogStore {
  private readonly api = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly services = signal<CatalogServiceItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly categoryError = signal(false);
  readonly categoriesLoading = signal(true);
  readonly discovery = computed(() =>
    manifest.filter((c) => this.categories().some((live) => live.slug === c.slug)),
  );
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.categoryError.set(false);
    this.categoriesLoading.set(true);
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.categoriesLoading.set(false);
        },
        error: () => {
          this.categoryError.set(true);
          this.categoriesLoading.set(false);
        },
      });
    this.api
      .getServices({ limit: 50 })
      .pipe(
        switchMap((first) =>
          first.totalPages > 1
            ? forkJoin(
                Array.from({ length: first.totalPages - 1 }, (_, i) =>
                  this.api.getServices({ limit: 50, page: i + 2 }),
                ),
              ).pipe(
                switchMap((rest) => of([...first.items, ...rest.flatMap((page) => page.items)])),
              )
            : of(first.items),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (services) => {
          this.services.set(services);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
  cards(category: DiscoveryCategory | undefined) {
    return (category?.services || []).filter((s) =>
      this.services().some((live) => live.slug === s.slug),
    );
  }
}
