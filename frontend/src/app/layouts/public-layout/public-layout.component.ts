import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { resolveDefaultWorkspaceByRole } from '../../core/guards/auth.guard';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ApiHealthService } from '../../core/services/api-health.service';
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <a class="skip-link" href="#main-content">{{ i18n.t().skipToContent }}</a>
    <div class="announcement">
      {{ ar() ? 'العناية ببيتك تبدأ باختيار الشخص المناسب' : 'A little help. A happier home.' }}
      <span>·</span> {{ ar() ? 'صُنع للأردن' : 'Made for Jordan' }}
    </div>
    <header class="site-header">
      <div class="fm-container header-inner">
        <a routerLink="/" class="brand" aria-label="FixMate home"
          ><svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M5 15 16 5l11 10v12H5Z" />
            <path d="m11 18 4 4 7-8" /></svg
          ><span>fixmate<span class="brand-dot">.</span></span></a
        >
        <button
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
          (keydown.escape)="closeMobileMenu()"
          aria-label="Main navigation"
        >
          <a routerLink="/services" routerLinkActive="active" (click)="closeMobileMenu()">{{
            i18n.t().nav.services
          }}</a>
          <a routerLink="/providers" routerLinkActive="active" (click)="closeMobileMenu()">{{
            ar() ? 'مزودو الخدمات' : 'Find a professional'
          }}</a>
          <a routerLink="/about" routerLinkActive="active" (click)="closeMobileMenu()">{{
            i18n.t().nav.about
          }}</a>
          <a routerLink="/faq" routerLinkActive="active" (click)="closeMobileMenu()">{{
            ar() ? 'المساعدة' : 'Help'
          }}</a>
          <div class="nav-actions">
            <button class="language-button" (click)="i18n.toggleLanguage()">
              {{ ar() ? 'English' : 'العربية' }}
            </button>
            @if (auth.isAuthenticated()) {
              <a
                class="fm-link-button"
                [routerLink]="workspace()"
                (click)="closeMobileMenu()"
                >{{ i18n.t().nav.dashboard }}</a
              ><button class="language-button" (click)="onLogout()">
                {{ i18n.t().nav.logout }}
              </button>
            } @else {
              <a routerLink="/auth/login" (click)="closeMobileMenu()">{{ i18n.t().nav.login }}</a
              ><a class="fm-link-button" routerLink="/auth/register" (click)="closeMobileMenu()"
                >{{ ar() ? 'انضم إلينا' : 'Get started' }} <span aria-hidden="true">↗</span></a
              >
            }
          </div>
        </nav>
      </div>
    </header>
    <main id="main-content" class="pub-main" tabindex="-1"><router-outlet /></main>
    <footer class="site-footer">
      <div class="fm-container">
        <div class="footer-grid">
          <div>
            <a routerLink="/" class="brand">fixmate.</a>
            <p>{{ ar() ? 'بيت مرتّب. بال مرتاح.' : 'Your home, in good company.' }}</p>
            <p>
              {{
                ar()
                  ? 'اكتشف خدمات العناية بالمنزل في الأردن.'
                  : 'Discover home care, thoughtfully connected in Jordan.'
              }}
            </p>
          </div>
          <div>
            <h3>{{ ar() ? 'اكتشف' : 'Explore' }}</h3>
            <a routerLink="/services">{{ i18n.t().nav.services }}</a
            ><a routerLink="/providers">{{ i18n.t().nav.providers }}</a
            ><a routerLink="/auth/register">{{
              ar() ? 'انضم كمزود خدمة' : 'Become a professional'
            }}</a>
          </div>
          <div>
            <h3>{{ ar() ? 'نحن هنا لمساعدتك' : 'Good to know' }}</h3>
            <a routerLink="/about">{{ i18n.t().nav.about }}</a
            ><a routerLink="/faq">{{ i18n.t().nav.faq }}</a
            ><a routerLink="/contact">{{ i18n.t().nav.contact }}</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 FixMate</span
          ><span>{{ ar() ? 'الأردن · الأسعار بالدينار الأردني' : 'Jordan · Prices in JOD' }}</span>
        </div>
      </div>
    </footer>`,
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent implements OnInit {
  readonly i18n = inject(LanguageService);
  readonly auth = inject(AuthService);
  readonly health = inject(ApiHealthService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);
  readonly ar = () => this.i18n.lang() === 'ar';
  workspace(){return resolveDefaultWorkspaceByRole(this.auth.currentUser()?.role);}
  ngOnInit() {
    this.health.checkHealth();
  }
  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }
  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
  onLogout() {
    this.closeMobileMenu();
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }
}
