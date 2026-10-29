import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { DiscoveryCatalogStore } from './discovery-catalog.store';
@Component({
  selector: 'app-explore-menu',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    class="explore-mega-menu"
    id="explore-services-panel"
    role="region"
    [attr.aria-label]="ar() ? 'قائمة الخدمات' : 'Explore Services Menu'"
    [class.drilled]="selected()"
  >
    <div class="explore-mega-left">
      @for (section of sections(); track section.en) {
        <section class="menu-group">
          <h3>{{ ar() ? section.ar : section.en }}</h3>
          @for (category of section.categories; track category.slug) {
            <button
              class="explore-cat-item"
              [attr.data-slug]="category.slug"
              [class.selected]="active()?.slug === category.slug"
              (mouseenter)="hover(category.slug)"
              (focus)="hover(category.slug)"
              (click)="selected.set(category.slug)"
              [attr.aria-pressed]="active()?.slug === category.slug"
            >
              <span>{{ category.menuLabel[i18n.lang()] }}</span
              ><span class="direction-arrow" aria-hidden="true">›</span>
            </button>
          }
        </section>
      }
      <section class="menu-group resources-group">
        <h3>{{ ar() ? 'الموارد' : 'Resources' }}</h3>
        @for (resource of resources; track resource.id) {
          <a
            routerLink="/"
            [fragment]="'guide-' + resource.id"
            (click)="openResource($event, resource.id)"
            >{{ ar() ? resource.ar : resource.en }}</a
          >
        }
      </section>
    </div>
    <div class="explore-mega-right">
      <button class="menu-back" (click)="back()">
        ‹ {{ ar() ? 'جميع الخدمات' : 'All services' }}
      </button>
      @if (catalog.loading() || catalog.categoriesLoading()) {
        <p role="status">{{ ar() ? 'جاري تحميل الخدمات…' : 'Loading services…' }}</p>
      } @else if (catalog.error() || catalog.categoryError()) {
        <p role="status">{{ ar() ? 'تعذّر تحميل الخدمات.' : 'Services could not be loaded.' }}</p>
        <button class="text-button" (click)="catalog.load()">
          {{ ar() ? 'إعادة المحاولة' : 'Try again' }}
        </button>
      } @else if (active(); as category) {
        <h3 class="context-title">{{ category.menuLabel[i18n.lang()] }}</h3>
        <ul class="explore-service-list">
          @for (service of contextServices(); track service.slug) {
            <li>
              <a
                class="explore-service-link"
                [routerLink]="['/services', service.slug]"
                (click)="navigate.emit()"
                >{{ service.title[i18n.lang()] }}</a
              >
            </li>
          }
        </ul>
        <a
          class="browse-category"
          routerLink="/services"
          [queryParams]="{ categorySlug: category.slug }"
          (click)="navigate.emit()"
          >{{ ar() ? 'عرض جميع خدمات القسم' : 'View all category services' }}
          <span class="direction-arrow">→</span></a
        >
      }
      <a class="browse-all-link" routerLink="/services" (click)="navigate.emit()">{{
        ar() ? 'تصفح جميع الخدمات' : 'Browse all services'
      }}</a>
    </div>
  </div>`,
  styleUrl: './explore-menu.component.scss',
})
export class ExploreMenuComponent {
  readonly catalog = inject(DiscoveryCatalogStore);
  readonly i18n = inject(LanguageService);
  readonly router = inject(Router);
  readonly navigate = output<void>();
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly selected = signal<string | null>(null);
  readonly active = computed(
    () =>
      this.catalog.discovery().find((c) => c.slug === (this.selected() || 'handyman')) ||
      this.catalog.discovery()[0],
  );
  readonly contextServices = computed(() => {
    const active = this.active();
    const cards = this.catalog.cards(active);
    if (active?.slug !== 'handyman') return cards;
    const extras = [
      'water-leak-detection-repair',
      'garage-door-repair',
      'window-repair',
      'heating-system-maintenance',
      'circuit-breaker-panel-inspection',
    ];
    return [
      ...cards,
      ...this.catalog
        .discovery()
        .flatMap((c) => this.catalog.cards(c))
        .filter((s) => extras.includes(s.slug)),
    ];
  });
  back() {
    const previous = this.selected();
    this.selected.set(null);
    setTimeout(() =>
      document
        .querySelector<HTMLButtonElement>(`.explore-cat-item[data-slug="${previous}"]`)
        ?.focus({preventScroll:true}),
    );
  }
  readonly sections = computed(() =>
    ['Interior', 'Exterior', 'More Services'].map((en) => ({
      en,
      ar: (
        { Interior: 'الداخلية', Exterior: 'الخارجية', 'More Services': 'خدمات أخرى' } as Record<
          string,
          string
        >
      )[en],
      categories: this.catalog
        .discovery()
        .filter((c) => c.group.en === en)
        .sort(
          (a, b) =>
            [
              'handyman',
              'cleaning',
              'painting',
              'plumbing',
              'electrical-repairs',
              'ac-maintenance',
            ].indexOf(a.slug) -
            [
              'handyman',
              'cleaning',
              'painting',
              'plumbing',
              'electrical-repairs',
              'ac-maintenance',
            ].indexOf(b.slug),
        ),
    })),
  );
  readonly resources = [
    { id: 'cost-guides', en: 'Cost Guides', ar: 'دليل الأسعار' },
    { id: 'maintenance-tips', en: 'Maintenance Tips', ar: 'نصائح الصيانة' },
    { id: 'project-guides', en: 'Project Guides', ar: 'أدلة المشاريع' },
  ];
  hover(slug: string) {
    if (window.matchMedia('(min-width:961px)').matches) this.selected.set(slug);
  }
  async openResource(event: Event, id: string) {
    event.preventDefault();
    this.navigate.emit();
    await this.router.navigate(['/'], { fragment: 'guide-' + id });
    setTimeout(() => {
      const card = document.getElementById('guide-' + id);
      card?.scrollIntoView({ block: 'center' });
      card?.click();
    }, 150);
  }
}
