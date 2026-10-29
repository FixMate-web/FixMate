import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">{{ i18n.t().skipToContent }}</a>
    <div class="auth-page">
      <header class="auth-header">
        <div class="auth-header-inner">
          <a routerLink="/" class="auth-brand" aria-label="FixMate home">
            <span class="auth-brand-emblem" aria-hidden="true">F</span>
            <span class="auth-brand-wordmark">FixMate</span>
          </a>

          <nav class="auth-top-nav" [attr.aria-label]="ar() ? 'خيارات الحساب' : 'Account options'">
            <a routerLink="/services" class="auth-nav-link">{{
              ar() ? 'استكشف الخدمات' : 'Explore Services'
            }}</a>
            <a
              routerLink="/auth/register"
              [queryParams]="{ role: 'PROVIDER' }"
              class="auth-nav-link"
              >{{ ar() ? 'انضم كمزود خدمة' : 'Join as a pro' }}</a
            >
            <button type="button" class="auth-lang-btn" (click)="i18n.toggleLanguage()">
              {{ ar() ? 'English' : 'العربية' }}
            </button>
            <a routerLink="/auth/register" routerLinkActive="selected" class="auth-signup-pill">{{
              ar() ? 'إنشاء حساب' : 'Sign up'
            }}</a>
            <a routerLink="/auth/login" routerLinkActive="selected" class="auth-login-link">{{
              ar() ? 'تسجيل الدخول' : 'Log in'
            }}</a>
          </nav>
        </div>
      </header>

      <main id="main-content" class="auth-main" tabindex="-1">
        <div class="auth-card-wrapper">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
}
