import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
import { money, pricingLabel } from '../../shared/marketplace/marketplace.utils';

export interface CuratedPortraitCard {
  slug: string;
  categorySlug: string;
  titleEn: string;
  titleAr: string;
  priceLabelEn: string;
  priceLabelAr: string;
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
    priceEn: string;
    priceAr: string;
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
    metaEn: string;
    metaAr: string;
    serviceSlug: string;
  }[];
}

const PORTRAIT_DISCOVERY_CARDS: CuratedPortraitCard[] = [
  {
    slug: 'deep-home-move-in-cleaning',
    categorySlug: 'cleaning',
    titleEn: 'House & Apartment Cleaning',
    titleAr: 'تنظيف المنازل والشقق',
    priceLabelEn: '45 – 120 JOD',
    priceLabelAr: '45 – 120 د.أ',
    image: '/images/services/cleaning-960.webp',
  },
  {
    slug: 'split-ac-cleaning-seasonal-tuneup',
    categorySlug: 'ac-hvac',
    titleEn: 'AC Servicing & Repair',
    titleAr: 'صيانة وتنظيف المكيفات',
    priceLabelEn: '18 – 45 JOD',
    priceLabelAr: '18 – 45 د.أ',
    image: '/images/services/ac-hvac-960.webp',
  },
  {
    slug: 'interior-room-wall-painting',
    categorySlug: 'painting',
    titleEn: 'Interior Painting',
    titleAr: 'دهان الغرف والجدران الداخلية',
    priceLabelEn: '65 – 220 JOD',
    priceLabelAr: '65 – 220 د.أ',
    image: '/images/services/painting-960.webp',
  },
  {
    slug: 'water-leak-detection-repair',
    categorySlug: 'plumbing',
    titleEn: 'Plumbing & Leak Repair',
    titleAr: 'السباكة وإصلاح التسربات',
    priceLabelEn: '15 – 45 JOD',
    priceLabelAr: '15 – 45 د.أ',
    image: '/images/services/plumbing-960.webp',
  },
  {
    slug: 'electrical-fault-diagnosis-breaker-repair',
    categorySlug: 'electrical',
    titleEn: 'Electrical & Panel Repair',
    titleAr: 'إصلاح الأعطال واللوحات الكهربائية',
    priceLabelEn: '15 – 40 JOD',
    priceLabelAr: '15 – 40 د.أ',
    image: '/images/services/electrical-960.webp',
  },
  {
    slug: 'wooden-door-lock-hinge-repair',
    categorySlug: 'carpentry',
    titleEn: 'Carpentry & Door Locks',
    titleAr: 'النجارة وصيانة الأبواب والأقفال',
    priceLabelEn: '15 – 40 JOD',
    priceLabelAr: '15 – 40 د.أ',
    image: '/images/services/carpentry-960.webp',
  },
  {
    slug: 'water-tank-cleaning-sanitization',
    categorySlug: 'cleaning',
    titleEn: 'Water Tank Sanitization',
    titleAr: 'تنظيف وتعقيم خزانات المياه',
    priceLabelEn: '25 – 50 JOD',
    priceLabelAr: '25 – 50 د.أ',
    image: '/images/services/cleaning-960.webp',
  },
  {
    slug: 'lighting-chandeliers-switches-installation',
    categorySlug: 'electrical',
    titleEn: 'Lighting & Chandeliers',
    titleAr: 'تركيب الإنارة والثريات',
    priceLabelEn: '10 – 35 JOD',
    priceLabelAr: '10 – 35 د.أ',
    image: '/images/services/electrical-960.webp',
  },
];

const EXPLORE_PROJECT_TABS: ExploreProjectTab[] = [
  {
    id: 'maintenance',
    labelEn: 'Home Maintenance',
    labelAr: 'الصيانة الأساسية',
    banner: {
      titleEn: 'There’s no place like\na well-maintained home',
      titleAr: 'راحة بيتك تبدأ\nبصيانة دورية موثوقة',
      subtitleEn: 'Stop leaks, tripping breakers, and worn door locks before they turn into costly emergencies.',
      subtitleAr: 'عالج تسربات المياه وأعطال القواطع والأقفال مبكراً مع فنيين معتمدين في منطقتك.',
      ctaTextEn: 'Explore maintenance services',
      ctaTextAr: 'استكشف خدمات الصيانة',
      linkSlug: 'water-leak-detection-repair',
      categorySlug: 'plumbing',
      image: '/images/services/plumbing-960.webp',
    },
    cards: [
      {
        slug: 'water-leak-detection-repair',
        titleEn: 'Plumbing & Pipe Leak Repair',
        titleAr: 'إصلاح تسربات المياه والأنابيب',
        priceEn: '15 – 45 JOD',
        priceAr: '15 – 45 د.أ',
        image: '/images/services/plumbing-960.webp',
      },
      {
        slug: 'electrical-fault-diagnosis-breaker-repair',
        titleEn: 'Electrical Breaker & Fault Repair',
        titleAr: 'فحص الأعطال وإصلاح القواطع الكهربائية',
        priceEn: '15 – 40 JOD',
        priceAr: '15 – 40 د.أ',
        image: '/images/services/electrical-960.webp',
      },
      {
        slug: 'wooden-door-lock-hinge-repair',
        titleEn: 'Door Lock & Hinge Adjustment',
        titleAr: 'صيانة الأبواب والأقفال والمفصلات',
        priceEn: '15 – 40 JOD',
        priceAr: '15 – 40 د.أ',
        image: '/images/services/carpentry-960.webp',
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
      subtitleEn: 'Treat winter wall dampness, repair gypsum cracks, and upgrade your lighting fixtures.',
      subtitleAr: 'عالج رطوبة الجدران والتشققات وجدّد دهان الغرف والإنارة بأسعار واضحة.',
      ctaTextEn: 'See painting & finish options',
      ctaTextAr: 'استعرض خدمات الدهان والتشطيب',
      linkSlug: 'interior-room-wall-painting',
      categorySlug: 'painting',
      image: '/images/services/painting-960.webp',
    },
    cards: [
      {
        slug: 'interior-room-wall-painting',
        titleEn: 'Interior Room & Wall Painting',
        titleAr: 'دهان الغرف والجدران الداخلية',
        priceEn: '65 – 220 JOD',
        priceAr: '65 – 220 د.أ',
        image: '/images/services/painting-960.webp',
      },
      {
        slug: 'wall-dampness-crack-gypsum-repair',
        titleEn: 'Dampness, Crack & Gypsum Repair',
        titleAr: 'معالجة الرطوبة وتشققات الجدران والجبس',
        priceEn: '25 – 85 JOD',
        priceAr: '25 – 85 د.أ',
        image: '/images/services/painting-960.webp',
      },
      {
        slug: 'lighting-chandeliers-switches-installation',
        titleEn: 'Chandelier & Modern Lighting Setup',
        titleAr: 'تركيب الثريات والإنارة الحديثة',
        priceEn: '10 – 35 JOD',
        priceAr: '10 – 35 د.أ',
        image: '/images/services/electrical-960.webp',
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
      subtitleEn: 'Keep split AC units cooling efficiently and roof water tanks sanitized and leak-free.',
      subtitleAr: 'حافظ على كفاءة مكيفات السبليت ونظافة خزانات المياه العلوية والأرضية.',
      ctaTextEn: 'Explore seasonal care',
      ctaTextAr: 'استكشف الصيانة الموسمية',
      linkSlug: 'split-ac-cleaning-seasonal-tuneup',
      categorySlug: 'ac-hvac',
      image: '/images/services/ac-hvac-960.webp',
    },
    cards: [
      {
        slug: 'split-ac-cleaning-seasonal-tuneup',
        titleEn: 'Split AC Deep Cleaning & Tune-Up',
        titleAr: 'تنظيف وصيانة مكيفات سبليت',
        priceEn: '18 – 45 JOD',
        priceAr: '18 – 45 د.أ',
        image: '/images/services/ac-hvac-960.webp',
      },
      {
        slug: 'water-tank-cleaning-sanitization',
        titleEn: 'Roof & Ground Tank Sanitization',
        titleAr: 'تنظيف وتعقيم خزانات المياه',
        priceEn: '25 – 50 JOD',
        priceAr: '25 – 50 د.أ',
        image: '/images/services/cleaning-960.webp',
      },
      {
        slug: 'drain-unblocking-water-tank-float',
        titleEn: 'Roof Tank Float Valve & Drains',
        titleAr: 'صيانة عوامة الخزان وتسليك المصارف',
        priceEn: '12 – 35 JOD',
        priceAr: '12 – 35 د.أ',
        image: '/images/services/plumbing-960.webp',
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
      subtitleEn: 'Book deep apartment cleaning, furniture assembly, and kitchen cabinet adjustments.',
      subtitleAr: 'احجز التنظيف العميق للشقق وتركيب الأثاث وصيانة خزائن المطبخ بكل سهولة.',
      ctaTextEn: 'Browse move-in services',
      ctaTextAr: 'تصفح خدمات الانتقال',
      linkSlug: 'deep-home-move-in-cleaning',
      categorySlug: 'cleaning',
      image: '/images/services/cleaning-960.webp',
    },
    cards: [
      {
        slug: 'deep-home-move-in-cleaning',
        titleEn: 'Deep Apartment & Move-In Cleaning',
        titleAr: 'تنظيف عميق للشقق قبل السكن',
        priceEn: '45 – 120 JOD',
        priceAr: '45 – 120 د.أ',
        image: '/images/services/cleaning-960.webp',
      },
      {
        slug: 'furniture-assembly-kitchen-cabinet-fix',
        titleEn: 'Furniture Assembly & Cabinet Hinges',
        titleAr: 'تركيب الأثاث وصيانة خزائن المطبخ',
        priceEn: '18 – 55 JOD',
        priceAr: '18 – 55 د.أ',
        image: '/images/services/carpentry-960.webp',
      },
      {
        slug: 'split-ac-installation-relocation',
        titleEn: 'Split AC Installation & Relocation',
        titleAr: 'تركيب ونقل وحدات التكييف',
        priceEn: '35 – 75 JOD',
        priceAr: '35 – 75 د.أ',
        image: '/images/services/ac-hvac-960.webp',
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
    image: '/images/services/electrical-960.webp',
    badgeEn: 'Amman · Irbid · Zarqa 2026',
    badgeAr: 'عمّان · إربد · الزرقاء 2026',
    items: [
      {
        headingEn: 'Plumbing & Water Leak Detection',
        headingAr: 'السباكة وكشف تسربات المياه',
        detailEn: 'Standard callout, mixer replacement, or siphon/float valve repair in Amman.',
        detailAr: 'معاينة وإصلاح خلاطات المياه أو السيفون أو عوامة الخزان.',
        metaEn: '12 – 45 JOD',
        metaAr: '12 – 45 د.أ',
        serviceSlug: 'water-leak-detection-repair',
      },
      {
        headingEn: 'Split AC Deep Cleaning & Gas Check',
        headingAr: 'تنظيف وصيانة مكيفات سبليت',
        detailEn: 'Indoor coil wash, drain flush, and Freon pressure check (1–2.5 ton unit).',
        detailAr: 'غسيل الوحدة الداخلية والخارجية، تسليك التصريف وفحص الغاز.',
        metaEn: '18 – 45 JOD',
        metaAr: '18 – 45 د.أ',
        serviceSlug: 'split-ac-cleaning-seasonal-tuneup',
      },
      {
        headingEn: 'Interior Room Painting (Labor & Prep)',
        headingAr: 'دهان الغرف الداخلية ومعالجة الجدران',
        detailEn: 'Putty smoothing, primer, and two coats of washable acrylic emulsion per room.',
        detailAr: 'معجونة وصنفرة وطبقتان من الدهان القابل للغسل للغرفة الواحدة.',
        metaEn: '65 – 220 JOD',
        metaAr: '65 – 220 د.أ',
        serviceSlug: 'interior-room-wall-painting',
      },
    ],
  },
  {
    id: 'maintenance-tips',
    titleEn: 'Maintenance tips',
    titleAr: 'نصائح العناية بالمنزل',
    subtitleEn: 'Tips to keep your home in great shape all year.',
    subtitleAr: 'إرشادات عملية للحفاظ على منزلك طوال فصول السنة.',
    image: '/images/services/cleaning-960.webp',
    badgeEn: 'Jordan Seasonal Care',
    badgeAr: 'العناية الموسمية في الأردن',
    items: [
      {
        headingEn: 'Sanitize Roof Water Tanks Every 6 Months',
        headingAr: 'تعقيم خزانات المياه كل 6 أشهر',
        detailEn: 'Dust and sediment accumulate after khamsin winds; inspect the float valve to prevent roof overflow.',
        detailAr: 'تتراكم الرواسب بعد رياح الخماسين؛ يُنصح بتنظيف الخزان وفحص العوامة.',
        metaEn: '25 – 50 JOD',
        metaAr: '25 – 50 د.أ',
        serviceSlug: 'water-tank-cleaning-sanitization',
      },
      {
        headingEn: 'Service Split ACs Before May Heatwaves',
        headingAr: 'صيانة المكيفات قبل موجة الحر في أيار',
        detailEn: 'Clogged filters and coils increase electricity bills by up to 25% and cause indoor water drips.',
        detailAr: 'تنظيف الفلاتر والملفات يقلل استهلاك الكهرباء ويمنع تنقيط المياه داخل الغرفة.',
        metaEn: '18 – 45 JOD',
        metaAr: '18 – 45 د.أ',
        serviceSlug: 'split-ac-cleaning-seasonal-tuneup',
      },
      {
        headingEn: 'Treat Winter Wall Dampness Early',
        headingAr: 'معالجة رطوبة الجدران بعد الشتاء',
        detailEn: 'Scrape peeling paint, apply anti-fungal sealer, and re-plaster before repainting.',
        detailAr: 'إزالة القشور ووضع عازل الرطوبة والمعجونة قبل إعادة الدهان.',
        metaEn: '25 – 85 JOD',
        metaAr: '25 – 85 د.أ',
        serviceSlug: 'wall-dampness-crack-gypsum-repair',
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
        detailEn: 'Check what is included in the standard visit before booking a specific provider or requesting quotes.',
        detailAr: 'اطّلع على تفاصيل الخدمة وما تشمله التسعيرة قبل اختيار المزود أو إرسال طلب عام.',
        metaEn: 'Upfront Scope',
        metaAr: 'نطاق واضح',
        serviceSlug: 'deep-home-move-in-cleaning',
      },
      {
        headingEn: '2. Choose a 30-Minute Arrival Window',
        headingAr: '2. اختر موعد وصول دقيق (30 دقيقة)',
        detailEn: 'FixMate reserves capacity only when a professional accepts your booking in Amman or your governorate.',
        detailAr: 'اختر الوقت المناسب لك في عمّان أو محافظتك مع تأكيد فوري للحجز.',
        metaEn: '30-Min Slots',
        metaAr: 'مواعيد دقيقة',
        serviceSlug: 'electrical-fault-diagnosis-breaker-repair',
      },
      {
        headingEn: '3. Verify Work Completion & Leave a Review',
        headingAr: '3. أكّد إنجاز العمل وقيّم التجربة',
        detailEn: 'Once the provider marks work done, confirm completion from your dashboard and share an honest review.',
        detailAr: 'بعد انتهاء الفني من العمل، أكّد الإنجاز من لوحة التحكم وشارك تقييمك الحقيقي.',
        metaEn: 'Verified Reviews',
        metaAr: 'تقييمات موثقة',
        serviceSlug: 'wooden-door-lock-hinge-repair',
      },
    ],
  },
];

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    DiscoverySearchComponent,
    ProviderCardComponent,
  ],
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

  readonly categories = signal<CatalogCategory[]>([]);
  readonly services = signal<CatalogServiceItem[]>([]);
  readonly providers = signal<PublicProviderSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly projectsLoading = signal(true);
  readonly projectsError = signal(false);
  readonly providersLoading = signal(true);
  readonly providersError = signal(false);

  // Interactive Thumbtack-style state signals
  readonly selectedCategorySlug = signal<string>('all');
  readonly exploreTabs = EXPLORE_PROJECT_TABS;
  readonly activeExploreTabId = signal<string>('maintenance');
  readonly resourceCards = HOME_RESOURCE_CARDS;
  readonly activeResourceId = signal<'cost-guides' | 'maintenance-tips' | 'project-guides'>('cost-guides');

  readonly activeExploreTab = computed(
    () => this.exploreTabs.find((t) => t.id === this.activeExploreTabId()) ?? this.exploreTabs[0],
  );

  readonly activeResourceCard = computed(
    () => this.resourceCards.find((r) => r.id === this.activeResourceId()) ?? this.resourceCards[0],
  );

  readonly visiblePortraitCards = computed<CuratedPortraitCard[]>(() => {
    const selected = this.selectedCategorySlug();
    const apiServices = this.services();

    // Build cards from live backend services when available, enriched with curated fallback cards
    const liveMapped: CuratedPortraitCard[] = apiServices.map((s) => ({
      slug: s.slug,
      categorySlug: s.category?.slug || 'plumbing',
      titleEn: s.title.en,
      titleAr: s.title.ar,
      priceLabelEn: `${pricingLabel(s.pricingPolicy?.pricingType || 'STARTING_AT', false)} · ${money(s.pricingPolicy?.indicativeAmountFils ?? 15000, 'en')}`,
      priceLabelAr: `${pricingLabel(s.pricingPolicy?.pricingType || 'STARTING_AT', true)} · ${money(s.pricingPolicy?.indicativeAmountFils ?? 15000, 'ar')}`,
      image: this.resolveCategoryImage(s.category?.slug || 'plumbing'),
    }));

    const source = liveMapped.length >= 4 ? liveMapped : PORTRAIT_DISCOVERY_CARDS;
    if (selected === 'all') {
      return source.slice(0, 4);
    }
    const filtered = source.filter((c) => c.categorySlug === selected);
    if (filtered.length > 0) {
      return filtered.slice(0, 4);
    }
    return PORTRAIT_DISCOVERY_CARDS.filter((c) => c.categorySlug === selected).slice(0, 4);
  });

  constructor() {
    this.loadCategories();
    this.loadProjects();
    this.loadProviders();
  }

  loadCategories() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => {
          this.categories.set(cats);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  loadProjects() {
    this.projectsLoading.set(true);
    this.projectsError.set(false);
    this.api
      .getServices({ limit: 12 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.services.set(r.items);
          this.projectsLoading.set(false);
        },
        error: () => {
          this.projectsError.set(true);
          this.projectsLoading.set(false);
        },
      });
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
      plumbing: '/images/services/plumbing-960.webp',
      electrical: '/images/services/electrical-960.webp',
      'ac-hvac': '/images/services/ac-hvac-960.webp',
      cleaning: '/images/services/cleaning-960.webp',
      painting: '/images/services/painting-960.webp',
      carpentry: '/images/services/carpentry-960.webp',
    };
    return map[slug] || '/images/services/plumbing-960.webp';
  }
}
