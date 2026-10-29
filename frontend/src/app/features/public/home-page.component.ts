import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import {
  CatalogApiService,
  CatalogCategory,
  CatalogServiceItem,
} from '../../core/services/catalog-api.service';
import {
  ProvidersApiService,
  PublicProviderSummary,
} from '../../core/services/providers-api.service';
import { DiscoverySearchComponent } from '../../shared/marketplace/discovery-search.component';
import { ProviderCardComponent } from '../../shared/marketplace/provider-card.component';
import { ScrollRevealDirective } from '../../shared/ui/scroll-reveal.directive';
import { HowItWorksComponent } from '../../shared/marketplace/how-it-works.component';
import { HeroSlideshowComponent } from '../../shared/marketplace/hero-slideshow.component';
import { DiscoveryCatalogStore } from '../../shared/marketplace/discovery-catalog.store';
import { money, pricingLabel } from '../../shared/marketplace/marketplace.utils';

export interface CuratedPortraitCard {
  slug: string;
  categorySlug: string;
  titleEn: string;
  titleAr: string;
  image: string;
}

export interface ExploreProjectTab {
  id: string;
  labelEn: string;
  labelAr: string;
  banner: {
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    ctaTextEn: string;
    ctaTextAr: string;
    linkSlug: string;
    categorySlug: string;
    image: string;
  };
  cards: {
    slug: string;
    titleEn: string;
    titleAr: string;
    image: string;
  }[];
}

export interface HomeResourceCard {
  id: 'cost-guides' | 'maintenance-tips' | 'project-guides';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  image: string;
  badgeEn: string;
  badgeAr: string;
  items: {
    headingEn: string;
    headingAr: string;
    detailEn: string;
    detailAr: string;
    serviceSlug: string;
  }[];
}

const EXPLORE_PROJECT_TABS: ExploreProjectTab[] = [
  {
    id: 'maintenance',
    labelEn: 'Home Maintenance',
    labelAr: 'الصيانة الأساسية',
    banner: {
      titleEn: 'There’s no place like\na well-maintained home',
      titleAr: 'راحة بيتك تبدأ\nبصيانة دورية موثوقة',
      subtitleEn:
        'Stop leaks, tripping breakers, and worn door locks before they turn into costly emergencies.',
      subtitleAr: 'عالج تسربات المياه وأعطال القواطع والأقفال مبكراً مع فنيين معتمدين في منطقتك.',
      ctaTextEn: 'Explore maintenance services',
      ctaTextAr: 'استكشف خدمات الصيانة',
      linkSlug: 'water-leak-detection-repair',
      categorySlug: 'plumbing',
      image: '/images/editorial/living.webp',
    },
    cards: [
      {
        slug: 'water-leak-detection-repair',
        titleEn: 'Plumbing Repairs',
        titleAr: 'إصلاح تسربات المياه والأنابيب',
        image: '/images/categories/plumbing-960.webp',
      },
      {
        slug: 'circuit-breaker-panel-inspection',
        titleEn: 'Electrical Repairs',
        titleAr: 'فحص الأعطال وإصلاح القواطع الكهربائية',
        image: '/images/categories/electrical-repairs-960.webp',
      },
      {
        slug: 'wooden-door-and-lock-repair',
        titleEn: 'Door & Lock Repair',
        titleAr: 'صيانة الأبواب والأقفال والمفصلات',
        image: '/images/categories/carpentry-960.webp',
      },
    ],
  },
  {
    id: 'remodeling',
    labelEn: 'Home Remodeling',
    labelAr: 'تجديد وتشطيب المنزل',
    banner: {
      titleEn: 'Refresh your rooms with\nclean walls & warm light',
      titleAr: 'جدّد غرف منزلك\nبدهان متقن وإنارة عصرية',
      subtitleEn:
        'Treat winter wall dampness, repair gypsum cracks, and upgrade your lighting fixtures.',
      subtitleAr: 'عالج رطوبة الجدران والتشققات وجدّد دهان الغرف والإنارة بأسعار واضحة.',
      ctaTextEn: 'See painting & finish options',
      ctaTextAr: 'استعرض خدمات الدهان والتشطيب',
      linkSlug: 'single-room-interior-painting',
      categorySlug: 'painting',
      image: '/images/editorial/garden.webp',
    },
    cards: [
      {
        slug: 'single-room-interior-painting',
        titleEn: 'Interior Room & Wall Painting',
        titleAr: 'دهان الغرف والجدران الداخلية',
        image: '/images/categories/painting-960.webp',
      },
      {
        slug: 'dampness-and-mold-wall-treatment',
        titleEn: 'Dampness, Crack & Gypsum Repair',
        titleAr: 'معالجة الرطوبة وتشققات الجدران والجبس',
        image: '/images/categories/painting-960.webp',
      },
      {
        slug: 'lighting-and-socket-installation',
        titleEn: 'Chandelier & Modern Lighting Setup',
        titleAr: 'تركيب الثريات والإنارة الحديثة',
        image: '/images/categories/electrical-repairs-960.webp',
      },
    ],
  },
  {
    id: 'seasonal',
    labelEn: 'Seasonal & Tank Care',
    labelAr: 'المكيفات وخزانات المياه',
    banner: {
      titleEn: 'Ready for Amman summers\nand winter rain',
      titleAr: 'جهّز بيتك لصيف عمّان\nوموسم الشتاء',
      subtitleEn:
        'Keep split AC units cooling efficiently and roof water tanks sanitized and leak-free.',
      subtitleAr: 'حافظ على كفاءة مكيفات السبليت ونظافة خزانات المياه العلوية والأرضية.',
      ctaTextEn: 'Explore seasonal care',
      ctaTextAr: 'استكشف الصيانة الموسمية',
      linkSlug: 'split-ac-deep-cleaning-service',
      categorySlug: 'ac-maintenance',
      image: '/images/editorial/exterior.webp',
    },
    cards: [
      {
        slug: 'split-ac-deep-cleaning-service',
        titleEn: 'Split AC Deep Cleaning & Tune-Up',
        titleAr: 'تنظيف وصيانة مكيفات سبليت',
        image: '/images/categories/ac-maintenance-960.webp',
      },
      {
        slug: 'roof-water-tank-sanitization',
        titleEn: 'Roof & Ground Tank Sanitization',
        titleAr: 'تنظيف وتعقيم خزانات المياه',
        image: '/images/categories/cleaning-960.webp',
      },
      {
        slug: 'electric-water-heater-maintenance',
        titleEn: 'Water Heater Maintenance',
        titleAr: 'صيانة سخانات المياه',
        image: '/images/categories/plumbing-960.webp',
      },
    ],
  },
  {
    id: 'essentials',
    labelEn: 'Essential Home Services',
    labelAr: 'خدمات الانتقال والمنزل',
    banner: {
      titleEn: 'Move in with confidence.\nEvery corner spotless.',
      titleAr: 'انتقل إلى بيتك الجديد\nبنظافة وترتيب متكامل',
      subtitleEn:
        'Book deep apartment cleaning, furniture assembly, and kitchen cabinet adjustments.',
      subtitleAr: 'احجز التنظيف العميق للشقق وتركيب الأثاث وصيانة خزائن المطبخ بكل سهولة.',
      ctaTextEn: 'Browse move-in services',
      ctaTextAr: 'تصفح خدمات الانتقال',
      linkSlug: 'apartment-deep-cleaning',
      categorySlug: 'cleaning',
      image: '/images/editorial/kitchen.webp',
    },
    cards: [
      {
        slug: 'apartment-deep-cleaning',
        titleEn: 'Deep Apartment & Move-In Cleaning',
        titleAr: 'تنظيف عميق للشقق قبل السكن',
        image: '/images/categories/cleaning-960.webp',
      },
      {
        slug: 'kitchen-cabinet-hinge-and-drawer-repair',
        titleEn: 'Furniture Assembly & Cabinet Hinges',
        titleAr: 'تركيب الأثاث وصيانة خزائن المطبخ',
        image: '/images/categories/carpentry-960.webp',
      },
      {
        slug: 'ac-cooling-diagnostics-recharge',
        titleEn: 'AC Cooling Diagnostics',
        titleAr: 'فحص كفاءة التكييف',
        image: '/images/categories/ac-maintenance-960.webp',
      },
    ],
  },
];

const HOME_RESOURCE_CARDS: HomeResourceCard[] = [
  {
    id: 'cost-guides',
    titleEn: 'Cost guides',
    titleAr: 'دليل الأسعار في الأردن',
    subtitleEn: 'Estimate costs for your next project in JOD.',
    subtitleAr: 'تعرّف على متوسط أسعار الصيانة المنزلية بالدينار الأردني.',
    image: '/images/editorial/garden.webp',
    badgeEn: 'Amman · Irbid · Zarqa 2026',
    badgeAr: 'عمّان · إربد · الزرقاء 2026',
    items: [
      {
        headingEn: 'Plumbing & Water Leak Detection',
        headingAr: 'السباكة وكشف تسربات المياه',
        detailEn: 'Standard callout, mixer replacement, or siphon/float valve repair in Amman.',
        detailAr: 'معاينة وإصلاح خلاطات المياه أو السيفون أو عوامة الخزان.',
        serviceSlug: 'water-leak-detection-repair',
      },
      {
        headingEn: 'Split AC Deep Cleaning & Gas Check',
        headingAr: 'تنظيف وصيانة مكيفات سبليت',
        detailEn: 'Indoor coil wash, drain flush, and Freon pressure check (1–2.5 ton unit).',
        detailAr: 'غسيل الوحدة الداخلية والخارجية، تسليك التصريف وفحص الغاز.',
        serviceSlug: 'split-ac-deep-cleaning-service',
      },
      {
        headingEn: 'Interior Room Painting (Labor & Prep)',
        headingAr: 'دهان الغرف الداخلية ومعالجة الجدران',
        detailEn: 'Putty smoothing, primer, and two coats of washable acrylic emulsion per room.',
        detailAr: 'معجونة وصنفرة وطبقتان من الدهان القابل للغسل للغرفة الواحدة.',
        serviceSlug: 'single-room-interior-painting',
      },
    ],
  },
  {
    id: 'maintenance-tips',
    titleEn: 'Maintenance tips',
    titleAr: 'نصائح العناية بالمنزل',
    subtitleEn: 'Tips to keep your home in great shape all year.',
    subtitleAr: 'إرشادات عملية للحفاظ على منزلك طوال فصول السنة.',
    image: '/images/categories/painting-960.webp',
    badgeEn: 'Jordan Seasonal Care',
    badgeAr: 'العناية الموسمية في الأردن',
    items: [
      {
        headingEn: 'Sanitize Roof Water Tanks Every 6 Months',
        headingAr: 'تعقيم خزانات المياه كل 6 أشهر',
        detailEn:
          'Dust and sediment accumulate after khamsin winds; inspect the float valve to prevent roof overflow.',
        detailAr: 'تتراكم الرواسب بعد رياح الخماسين؛ يُنصح بتنظيف الخزان وفحص العوامة.',
        serviceSlug: 'roof-water-tank-sanitization',
      },
      {
        headingEn: 'Service Split ACs Before May Heatwaves',
        headingAr: 'صيانة المكيفات قبل موجة الحر في أيار',
        detailEn:
          'Clogged filters can reduce cooling efficiency. Clean filters and have drainage inspected before summer.',
        detailAr: 'تنظيف الفلاتر والملفات يقلل استهلاك الكهرباء ويمنع تنقيط المياه داخل الغرفة.',
        serviceSlug: 'split-ac-deep-cleaning-service',
      },
      {
        headingEn: 'Treat Winter Wall Dampness Early',
        headingAr: 'معالجة رطوبة الجدران بعد الشتاء',
        detailEn:
          'Scrape peeling paint, apply anti-fungal sealer, and re-plaster before repainting.',
        detailAr: 'إزالة القشور ووضع عازل الرطوبة والمعجونة قبل إعادة الدهان.',
        serviceSlug: 'dampness-and-mold-wall-treatment',
      },
    ],
  },
  {
    id: 'project-guides',
    titleEn: 'Project guides',
    titleAr: 'دليل تخطيط المشاريع',
    subtitleEn: 'How-tos for all your home projects.',
    subtitleAr: 'خطوات واضحة لتنفيذ مشاريع بيتك بنجاح.',
    image: '/images/marketing/craftsman-960.webp',
    badgeEn: 'Step-by-Step Planning',
    badgeAr: 'خطوة بخطوة',
    items: [
      {
        headingEn: '1. Compare Scope & Indicative JOD Pricing',
        headingAr: '1. قارن نطاق العمل والأسعار الاسترشادية',
        detailEn:
          'Check what is included in the standard visit before booking a specific provider or requesting quotes.',
        detailAr: 'اطّلع على تفاصيل الخدمة وما تشمله التسعيرة قبل اختيار المزود أو إرسال طلب عام.',
        serviceSlug: 'apartment-deep-cleaning',
      },
      {
        headingEn: '2. Choose a 30-Minute Arrival Window',
        headingAr: '2. اختر موعد وصول دقيق (30 دقيقة)',
        detailEn:
          'FixMate reserves capacity only when a professional accepts your booking in Amman or your governorate.',
        detailAr: 'اختر الوقت المناسب لك في عمّان أو محافظتك، ويُثبت الموعد عند قبول المزود للحجز.',
        serviceSlug: 'circuit-breaker-panel-inspection',
      },
      {
        headingEn: '3. Verify Work Completion & Leave a Review',
        headingAr: '3. أكّد إنجاز العمل وقيّم التجربة',
        detailEn:
          'Once the provider marks work done, confirm completion from your dashboard and share an honest review.',
        detailAr: 'بعد انتهاء الفني من العمل، أكّد الإنجاز من لوحة التحكم وشارك تقييمك الحقيقي.',
        serviceSlug: 'wooden-door-and-lock-repair',
      },
    ],
  },
];

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, DiscoverySearchComponent, ProviderCardComponent, HeroSlideshowComponent, HowItWorksComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  private readonly api = inject(CatalogApiService);
  private readonly providersApi = inject(ProvidersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stickySearch = signal(false);
  @HostListener('window:scroll') onScroll() {
    this.stickySearch.set(window.scrollY > Math.max(640, window.innerHeight - 80));
  }

  readonly catalog = inject(DiscoveryCatalogStore);
  readonly categories = this.catalog.discovery;
  readonly services = this.catalog.services;
  readonly providers = signal<PublicProviderSummary[]>([]);
  readonly loading = this.catalog.categoriesLoading;
  readonly error = this.catalog.categoryError;
  readonly projectsLoading = this.catalog.loading;
  readonly projectsError = this.catalog.error;
  readonly providersLoading = signal(true);
  readonly providersError = signal(false);

  // Interactive Thumbtack-style state signals
  readonly selectedCategorySlug = signal<string>('cleaning');
  readonly exploreTabs = EXPLORE_PROJECT_TABS;
  readonly activeExploreTabId = signal<string>('maintenance');
  readonly resourceCards = HOME_RESOURCE_CARDS;
  readonly activeResourceId = signal<'cost-guides' | 'maintenance-tips' | 'project-guides'>(
    'cost-guides',
  );

  readonly activeExploreTab = computed(
    () => this.exploreTabs.find((t) => t.id === this.activeExploreTabId()) ?? this.exploreTabs[0],
  );

  readonly activeResourceCard = computed(
    () => this.resourceCards.find((r) => r.id === this.activeResourceId()) ?? this.resourceCards[0],
  );

  readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.slug === this.selectedCategorySlug()),
  );
  readonly visiblePortraitCards = computed(() =>
    this.catalog.cards(this.selectedCategory()).map((s) => ({
      slug: s.slug,
      titleEn: s.title.en,
      titleAr: s.title.ar,
      image: s.image,
        imageSmall: s.imageSmall,
      position: s.position,
    })),
  );

  constructor() {
    this.loadProviders();
  }

  loadCategories() {
    this.catalog.load();
  }
  loadProjects() {
    this.catalog.load();
  }

  loadProviders() {
    this.providersLoading.set(true);
    this.providersError.set(false);
    this.providersApi
      .listPublicProviders({ limit: 2 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.providers.set(r.items);
          this.providersLoading.set(false);
        },
        error: () => {
          this.providersError.set(true);
          this.providersLoading.set(false);
        },
      });
  }

  resourceMeta(slug: string): string {
    if (this.activeResourceId() !== 'cost-guides')
      return this.ar() ? 'دليل عملي' : 'Practical guide';
    const service = this.services().find((s) => s.slug === slug);
    return service?.pricingPolicy
      ? `${pricingLabel(service.pricingPolicy.pricingType, this.ar())} · ${money(service.pricingPolicy.indicativeAmountFils, this.i18n.lang())}`
      : this.ar()
        ? 'اطّلع على سعر الخدمة'
        : 'See service pricing';
  }

  readonly railStart = signal(true);
  readonly railEnd = signal(false);
  updateRail(rail: HTMLElement) {
    const position = Math.abs(rail.scrollLeft);
    this.railStart.set(position < 3);
    this.railEnd.set(position >= rail.scrollWidth - rail.clientWidth - 3);
  }
  scrollCategories(rail: HTMLElement, direction: number) {
    rail.scrollBy({
      left: direction * (this.ar() ? -1 : 1) * rail.clientWidth * 0.65,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  revealTab(event: Event) {
    (event.currentTarget as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  categoryKey(event: KeyboardEvent, rail: HTMLElement) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(rail.querySelectorAll<HTMLButtonElement>('[role=tab]'));
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    const delta = (event.key === 'ArrowRight' ? 1 : -1) * (this.ar() ? -1 : 1);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (current + delta + tabs.length) % tabs.length;
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  selectCategoryTab(slug: string) {
    this.selectedCategorySlug.set(slug);
  }

  selectExploreTab(id: string) {
    this.activeExploreTabId.set(id);
  }

  selectResourceCard(id: 'cost-guides' | 'maintenance-tips' | 'project-guides') {
    this.activeResourceId.set(id);
  }

  resolveCategoryImage(slug: string): string {
    const map: Record<string, string> = {
      plumbing: '/images/categories/plumbing-960.webp',
      electrical: '/images/categories/electrical-repairs-960.webp',
      'ac-maintenance': '/images/categories/ac-maintenance-960.webp',
      cleaning: '/images/categories/cleaning-960.webp',
      painting: '/images/categories/painting-960.webp',
      carpentry: '/images/categories/carpentry-960.webp',
    };
    return map[slug] || '/images/categories/plumbing-960.webp';
  }
}
