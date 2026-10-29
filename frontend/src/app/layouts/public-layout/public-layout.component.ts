import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { resolveDefaultWorkspaceByRole } from '../../core/guards/auth.guard';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ApiHealthService } from '../../core/services/api-health.service';

interface ExploreCategoryGroup {
  slug: string;
  labelEn: string;
  labelAr: string;
  headingEn: string;
  headingAr: string;
  services: {
    slug: string;
    nameEn: string;
    nameAr: string;
    priceHintEn: string;
    priceHintAr: string;
  }[];
}

const EXPLORE_GROUPS: ExploreCategoryGroup[] = [
  {
    slug: 'plumbing',
    labelEn: 'Plumbing & Water Systems',
    labelAr: 'السباكة وأنظمة المياه',
    headingEn: 'Plumbing & Roof Tank Care',
    headingAr: 'خدمات السباكة وخزانات المياه',
    services: [
      {
        slug: 'water-leak-detection-repair',
        nameEn: 'Water Leak Detection & Pipe Repair',
        nameAr: 'كشف وإصلاح تسربات المياه والأنابيب',
        priceHintEn: 'From 15 JOD',
        priceHintAr: 'تبدأ من 15 د.أ',
      },
      {
        slug: 'drain-unblocking-water-tank-float',
        nameEn: 'Drain Unblocking & Roof Tank Float Valve',
        nameAr: 'تسليك المجاري وصيانة عوامة الخزان',
        priceHintEn: 'From 12 JOD',
        priceHintAr: 'تبدأ من 12 د.أ',
      },
    ],
  },
  {
    slug: 'electrical',
    labelEn: 'Electrical & Lighting',
    labelAr: 'الكهرباء والإنارة',
    headingEn: 'Electrical Faults, Panels & Lighting',
    headingAr: 'أعطال الكهرباء واللوحات والإنارة',
    services: [
      {
        slug: 'electrical-fault-diagnosis-breaker-repair',
        nameEn: 'Electrical Fault Diagnosis & Breaker Repair',
        nameAr: 'فحص الأعطال الكهربائية وإصلاح القواطع',
        priceHintEn: 'From 15 JOD',
        priceHintAr: 'تبدأ من 15 د.أ',
      },
      {
        slug: 'lighting-chandeliers-switches-installation',
        nameEn: 'Lighting, Chandeliers & Wall Socket Installation',
        nameAr: 'تركيب الإنارة والثريات والمفاتيح الكهربائية',
        priceHintEn: 'From 10 JOD',
        priceHintAr: 'تبدأ من 10 د.أ',
      },
    ],
  },
  {
    slug: 'ac-hvac',
    labelEn: 'AC & Split-Unit Cooling',
    labelAr: 'التكييف والتبريد',
    headingEn: 'Split AC Servicing & Installation',
    headingAr: 'صيانة وتنظيف وتركيب المكيفات',
    services: [
      {
        slug: 'split-ac-cleaning-seasonal-tuneup',
        nameEn: 'Split AC Deep Cleaning & Gas Check',
        nameAr: 'تنظيف وصيانة مكيفات سبليت وفحص الغاز',
        priceHintEn: 'From 18 JOD',
        priceHintAr: 'تبدأ من 18 د.أ',
      },
      {
        slug: 'split-ac-installation-relocation',
        nameEn: 'Split AC Installation & Unit Relocation',
        nameAr: 'تركيب ونقل وحدات التكييف المنزلي',
        priceHintEn: 'From 35 JOD',
        priceHintAr: 'تبدأ من 35 د.أ',
      },
    ],
  },
  {
    slug: 'cleaning',
    labelEn: 'Home & Tank Cleaning',
    labelAr: 'تنظيف المنازل والخزانات',
    headingEn: 'Deep Home Cleaning & Tank Sanitization',
    headingAr: 'التنظيف العميق وتعقيم الخزانات',
    services: [
      {
        slug: 'deep-home-move-in-cleaning',
        nameEn: 'Deep Apartment & Move-In Cleaning',
        nameAr: 'تنظيف عميق للشقق والمنازل قبل السكن',
        priceHintEn: 'From 45 JOD',
        priceHintAr: 'تبدأ من 45 د.أ',
      },
      {
        slug: 'water-tank-cleaning-sanitization',
        nameEn: 'Roof & Ground Water Tank Sanitization',
        nameAr: 'تنظيف وتعقيم خزانات المياه العلوية والأرضية',
        priceHintEn: 'From 25 JOD',
        priceHintAr: 'تبدأ من 25 د.أ',
      },
    ],
  },
  {
    slug: 'painting',
    labelEn: 'Painting & Gypsum Walls',
    labelAr: 'الدهان ومعالجة الجدران',
    headingEn: 'Interior Painting & Dampness Treatment',
    headingAr: 'دهان الغرف ومعالجة الرطوبة والتشققات',
    services: [
      {
        slug: 'interior-room-wall-painting',
        nameEn: 'Interior Room & Apartment Wall Painting',
        nameAr: 'دهان الغرف والجدران الداخلية',
        priceHintEn: 'From 65 JOD',
        priceHintAr: 'تبدأ من 65 د.أ',
      },
      {
        slug: 'wall-dampness-crack-gypsum-repair',
        nameEn: 'Wall Dampness, Crack & Gypsum Repair',
        nameAr: 'معالجة الرطوبة وتشققات الجدران والجبس',
        priceHintEn: 'From 25 JOD',
        priceHintAr: 'تبدأ من 25 د.أ',
      },
    ],
  },
  {
    slug: 'carpentry',
    labelEn: 'Carpentry, Doors & Locks',
    labelAr: 'النجارة والأبواب والأقفال',
    headingEn: 'Door Repair, Hinges & Furniture Assembly',
    headingAr: 'صيانة الأبواب والمفصلات وتركيب الأثاث',
    services: [
      {
        slug: 'wooden-door-lock-hinge-repair',
        nameEn: 'Wooden Door, Lock & Hinge Adjustment',
        nameAr: 'صيانة الأبواب الخشبية والأقفال والمفصلات',
        priceHintEn: 'From 15 JOD',
        priceHintAr: 'تبدأ من 15 د.أ',
      },
      {
        slug: 'furniture-assembly-kitchen-cabinet-fix',
        nameEn: 'Furniture Assembly & Kitchen Cabinet Hinges',
        nameAr: 'تركيب الأثاث وصيانة خزائن المطبخ',
        priceHintEn: 'From 18 JOD',
        priceHintAr: 'تبدأ من 18 د.أ',
      },
    ],
  },
];

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">{{ i18n.t().skipToContent }}</a>

    <header class="site-header" (keydown.escape)="closeAllMenus()">
      <div class="fm-container header-inner">
        <a routerLink="/" class="brand" aria-label="FixMate home" (click)="closeAllMenus()">
          <span class="brand-emblem" aria-hidden="true">F</span>
          <span class="brand-wordmark">FixMate</span>
        </a>

        <button
          type="button"
          class="menu-toggle"
          (click)="toggleMobileMenu()"
          [attr.aria-expanded]="mobileMenuOpen()"
          aria-controls="public-primary-nav"
        >
          {{ i18n.t().nav.menuToggle }}
        </button>

        <nav
          id="public-primary-nav"
          [class.open]="mobileMenuOpen()"
          aria-label="Main navigation"
        >
          <!-- Two-Column Explore Services Mega-Dropdown (Reference Screenshot 7) -->
          <div class="explore-dropdown-wrapper">
            <button
              type="button"
              class="explore-trigger"
              [class.active]="exploreMenuOpen()"
              [attr.aria-expanded]="exploreMenuOpen()"
              (click)="toggleExploreMenu()"
            >
              <span>{{ ar() ? 'استكشف الخدمات' : 'Explore Services' }}</span>
              <svg class="chevron-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            @if (exploreMenuOpen()) {
              <div class="explore-backdrop" (click)="closeExploreMenu()"></div>
              <div
                class="explore-mega-menu"
                role="region"
                [attr.aria-label]="ar() ? 'قائمة الخدمات' : 'Explore Services Menu'"
              >
                <div class="explore-mega-left">
                  @for (group of exploreGroups; track group.slug) {
                    <button
                      type="button"
                      class="explore-cat-item"
                      [class.selected]="activeGroup().slug === group.slug"
                      (mouseenter)="selectExploreGroup(group)"
                      (focus)="selectExploreGroup(group)"
                      (click)="selectExploreGroup(group)"
                    >
                      <span>{{ ar() ? group.labelAr : group.labelEn }}</span>
                      <span class="direction-arrow" aria-hidden="true">›</span>
                    </button>
                  }
                </div>

                <div class="explore-mega-right">
                  <div class="explore-mega-header">
                    <h3>{{ ar() ? activeGroup().headingAr : activeGroup().headingEn }}</h3>
                    <a
                      class="explore-cat-link"
                      routerLink="/services"
                      [queryParams]="{ categorySlug: activeGroup().slug }"
                      (click)="closeAllMenus()"
                    >
                      {{ ar() ? 'عرض القسم بالكامل' : 'View category' }}
                      <span class="direction-arrow">→</span>
                    </a>
                  </div>

                  <ul class="explore-service-list">
                    @for (svc of activeGroup().services; track svc.slug) {
                      <li>
                        <a
                          [routerLink]="['/services', svc.slug]"
                          (click)="closeAllMenus()"
                          class="explore-service-link"
                        >
                          <span class="explore-service-name">{{
                            ar() ? svc.nameAr : svc.nameEn
                          }}</span>
                          <span class="explore-service-price">{{
                            ar() ? svc.priceHintAr : svc.priceHintEn
                          }}</span>
                        </a>
                      </li>
                    }
                  </ul>

                  <div class="explore-mega-footer">
                    <a routerLink="/services" (click)="closeAllMenus()" class="browse-all-link">
                      {{ ar() ? 'تصفح جميع الخدمات (12 خدمة)' : 'Browse all services' }}
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>

          <a
            routerLink="/services"
            routerLinkActive="active"
            class="nav-link"
            (click)="closeAllMenus()"
          >
            {{ i18n.t().nav.services }}
          </a>

          <a
            routerLink="/providers"
            routerLinkActive="active"
            class="nav-link"
            (click)="closeAllMenus()"
          >
            {{ ar() ? 'مزودو الخدمات' : 'Find a pro' }}
          </a>

          <a
            routerLink="/auth/register"
            [queryParams]="{ role: 'PROVIDER' }"
            class="nav-link join-pro-link"
            (click)="closeAllMenus()"
          >
            {{ ar() ? 'انضم كمزود خدمة' : 'Join as a pro' }}
          </a>

          <div class="nav-actions">
            <button type="button" class="language-button" (click)="i18n.toggleLanguage()">
              {{ ar() ? 'English' : 'العربية' }}
            </button>

            @if (auth.isAuthenticated()) {
              <a class="fm-link-button" [routerLink]="workspace()" (click)="closeAllMenus()">
                {{ i18n.t().nav.dashboard }}
              </a>
              <button type="button" class="language-button" (click)="onLogout()">
                {{ i18n.t().nav.logout }}
              </button>
            } @else {
              <a
                class="signup-pill-btn"
                routerLink="/auth/register"
                (click)="closeAllMenus()"
              >
                {{ ar() ? 'إنشاء حساب' : 'Sign up' }}
              </a>
              <a class="login-link" routerLink="/auth/login" (click)="closeAllMenus()">
                {{ i18n.t().nav.login }}
              </a>
            }
          </div>
        </nav>
      </div>
    </header>

    <main id="main-content" class="pub-main" tabindex="-1">
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="fm-container">
        <div class="footer-grid">
          <div class="footer-brand-col">
            <a routerLink="/" class="brand footer-brand">
              <span class="brand-emblem" aria-hidden="true">F</span>
              <span class="brand-wordmark">FixMate</span>
            </a>
            <p class="footer-tagline">
              {{
                ar()
                  ? 'منصتك الموثوقة لخدمات وصيانة المنزل في عمّان وجميع محافظات الأردن.'
                  : 'Jordan’s trusted marketplace for home maintenance, repairs, and seasonal care.'
              }}
            </p>
            <div class="footer-badges">
              <span>{{ ar() ? 'الأسعار بالدينار الأردني (JOD)' : 'Transparent JOD Pricing' }}</span>
              <span>·</span>
              <span>{{ ar() ? 'مزودون معتمدون' : 'Admin-Reviewed Pros' }}</span>
            </div>
          </div>

          <div>
            <h3>{{ ar() ? 'خدمات شائعة' : 'Popular Services' }}</h3>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'plumbing' }">{{
              ar() ? 'السباكة وكشف التسربات' : 'Plumbing & Leak Repair'
            }}</a>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'ac-hvac' }">{{
              ar() ? 'تنظيف وصيانة المكيفات' : 'Split AC Servicing'
            }}</a>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'electrical' }">{{
              ar() ? 'الأعطال الكهربائية والإنارة' : 'Electrical & Lighting'
            }}</a>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'cleaning' }">{{
              ar() ? 'تنظيف المنازل والخزانات' : 'Deep Home & Tank Cleaning'
            }}</a>
          </div>

          <div>
            <h3>{{ ar() ? 'للمحترفين والعملاء' : 'Customers & Pros' }}</h3>
            <a routerLink="/providers">{{ ar() ? 'ابحث عن محترف' : 'Find a professional' }}</a>
            <a routerLink="/services">{{ ar() ? 'تصفح جميع الخدمات' : 'Browse service catalog' }}</a>
            <a routerLink="/auth/register" [queryParams]="{ role: 'PROVIDER' }">{{
              ar() ? 'سجّل كمزود خدمة' : 'Join as a pro in Jordan'
            }}</a>
          </div>

          <div>
            <h3>{{ ar() ? 'عن فيكس ميت' : 'Company & Support' }}</h3>
            <a routerLink="/about">{{ i18n.t().nav.about }}</a>
            <a routerLink="/faq">{{ i18n.t().nav.faq }}</a>
            <a routerLink="/contact">{{ i18n.t().nav.contact }}</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© 2026 FixMate Jordan. All rights reserved.</span>
          <span>{{
            ar()
              ? 'الأردن · عمّان، إربد، الزرقاء، العقبة · الأسعار بالدينار الأردني'
              : 'Amman · Irbid · Zarqa · Aqaba · Prices in JOD'
          }}</span>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent implements OnInit {
  readonly i18n = inject(LanguageService);
  readonly auth = inject(AuthService);
  readonly health = inject(ApiHealthService);
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal(false);
  readonly exploreMenuOpen = signal(false);
  readonly exploreGroups = EXPLORE_GROUPS;
  readonly activeGroup = signal<ExploreCategoryGroup>(EXPLORE_GROUPS[0]);

  readonly ar = () => this.i18n.lang() === 'ar';

  workspace() {
    return resolveDefaultWorkspaceByRole(this.auth.currentUser()?.role);
  }

  ngOnInit() {
    this.health.checkHealth();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
    if (!this.mobileMenuOpen()) {
      this.exploreMenuOpen.set(false);
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  toggleExploreMenu() {
    this.exploreMenuOpen.update((v) => !v);
  }

  closeExploreMenu() {
    this.exploreMenuOpen.set(false);
  }

  closeAllMenus() {
    this.mobileMenuOpen.set(false);
    this.exploreMenuOpen.set(false);
  }

  selectExploreGroup(group: ExploreCategoryGroup) {
    this.activeGroup.set(group);
  }

  onLogout() {
    this.closeAllMenus();
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }
}
