import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { resolveDefaultWorkspaceByRole } from '../../core/guards/auth.guard';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ExploreMenuComponent } from '../../shared/marketplace/explore-menu.component';
import { ApiHealthService } from '../../core/services/api-health.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ExploreMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">{{ i18n.t().skipToContent }}</a>

    <header class="site-header" (keydown.escape)="closeAllMenus(); focusExploreTrigger()">
      <div class="fm-container header-inner">
        <a routerLink="/" class="brand" aria-label="FixMate home" (click)="closeAllMenus()">
          <img
            class="brand-emblem"
            src="/brand/fixmate-logo-80.webp"
            width="36"
            height="36"
            alt=""
          />
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

        <nav id="public-primary-nav" [class.open]="mobileMenuOpen()" aria-label="Main navigation">
          <!-- Two-Column Explore Services Mega-Dropdown (Reference Screenshot 7) -->
          <div
            class="explore-dropdown-wrapper"
            (focusout)="onExploreFocusOut($event)"
            (mouseenter)="cancelExploreClose()"
            (mouseleave)="scheduleExploreClose()"
          >
            <button
              type="button"
              class="explore-trigger"
              [class.active]="exploreMenuOpen()"
              [attr.aria-expanded]="exploreMenuOpen()"
              aria-controls="explore-services-panel"
              (click)="toggleExploreMenu()"
            >
              <span>{{ ar() ? 'استكشف خدماتنا' : 'Explore Services' }}</span>
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
              <app-explore-menu (navigate)="closeAllMenus()" />
            }
          </div>

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
              <a class="signup-pill-btn" routerLink="/auth/register" (click)="closeAllMenus()">
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
              <img
                class="brand-emblem"
                src="/brand/fixmate-logo-80.webp"
                width="36"
                height="36"
                alt=""
              />
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
            <a routerLink="/services" [queryParams]="{ categorySlug: 'ac-maintenance' }">{{
              ar() ? 'تنظيف وصيانة المكيفات' : 'Split AC Servicing'
            }}</a>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'electrical-repairs' }">{{
              ar() ? 'الأعطال الكهربائية والإنارة' : 'Electrical & Lighting'
            }}</a>
            <a routerLink="/services" [queryParams]="{ categorySlug: 'cleaning' }">{{
              ar() ? 'تنظيف المنازل والخزانات' : 'Deep Home & Tank Cleaning'
            }}</a>
          </div>

          <div>
            <h3>{{ ar() ? 'للمحترفين والعملاء' : 'Customers & Pros' }}</h3>
            <a routerLink="/providers">{{ ar() ? 'ابحث عن محترف' : 'Find a professional' }}</a>
            <a routerLink="/services">{{
              ar() ? 'تصفح جميع الخدمات' : 'Browse service catalog'
            }}</a>
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
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mobileMenuOpen = signal(false);
  readonly exploreMenuOpen = signal(false);
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  readonly ar = () => this.i18n.lang() === 'ar';

  workspace() {
    return resolveDefaultWorkspaceByRole(this.auth.currentUser()?.role);
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.closeTimer));
  }

  ngOnInit() {
    this.health.checkHealth();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
    if (this.mobileMenuOpen()) this.resetNavScroll();
    if (!this.mobileMenuOpen()) {
      this.exploreMenuOpen.set(false);
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  toggleExploreMenu() {
    this.exploreMenuOpen.update((v) => !v);
    if (this.exploreMenuOpen()) this.resetNavScroll();
  }

  private resetNavScroll() {
    setTimeout(()=>{const nav=this.element.nativeElement.querySelector<HTMLElement>('#public-primary-nav');if(nav)nav.scrollTop=0;});
  }

  closeExploreMenu() {
    clearTimeout(this.closeTimer);
    this.exploreMenuOpen.set(false);
  }

  closeAllMenus() {
    this.mobileMenuOpen.set(false);
    this.exploreMenuOpen.set(false);
  }

  cancelExploreClose() {
    clearTimeout(this.closeTimer);
  }
  scheduleExploreClose() {
    if (window.matchMedia('(min-width:961px)').matches)
      this.closeTimer = setTimeout(() => this.closeExploreMenu(), 250);
  }

  focusExploreTrigger() {
    this.element.nativeElement
      .querySelector<HTMLButtonElement>(
        window.innerWidth <= 960 ? '.menu-toggle' : '.explore-trigger',
      )
      ?.focus();
  }

  onExploreFocusOut(event: FocusEvent) {
    const wrapper = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && !wrapper.contains(event.relatedTarget))
      this.closeExploreMenu();
  }

  onLogout() {
    this.closeAllMenus();
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }
}
