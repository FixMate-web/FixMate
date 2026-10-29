import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import {
  resolveDefaultWorkspaceByRole,
  sanitizeReturnUrl,
} from '../../core/guards/auth.guard';
import { LanguageService } from '../../core/i18n/language.service';
import { FmAlertComponent, FmButtonComponent } from '../../shared/ui';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FmAlertComponent, FmButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="login-heading">
      <h1 id="login-heading" class="auth-page-title">{{ i18n.t().auth.loginTitle }}</h1>
      <p class="auth-page-subtitle">{{ i18n.t().auth.loginSubtitle }}</p>

      @if (auth.errorMessage(); as errMsg) {
        <app-fm-alert variant="danger" [title]="errMsg" />
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="fm-field">
          <label class="fm-field__label" for="login-email">
            {{ i18n.t().auth.emailLabel }} <span aria-hidden="true">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            class="fm-field__control"
            dir="ltr"
            formControlName="email"
            autocomplete="email"
            placeholder="user@example.com"
            [attr.aria-invalid]="isFieldInvalid('email')"
          />
          @if (isFieldInvalid('email')) {
            <p class="fm-field__error" role="alert">{{ i18n.lang() === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.' }}</p>
          }
        </div>

        <div class="fm-field">
          <div class="fm-field__label-row">
            <label class="fm-field__label" for="login-password">
              {{ i18n.t().auth.passwordLabel }} <span aria-hidden="true">*</span>
            </label>
            <button
              type="button"
              class="pw-toggle"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="
                showPassword() ? i18n.t().auth.hidePassword : i18n.t().auth.showPassword
              "
            >
              {{ showPassword() ? i18n.t().auth.hidePassword : i18n.t().auth.showPassword }}
            </button>
          </div>
          <input
            id="login-password"
            [type]="showPassword() ? 'text' : 'password'"
            class="fm-field__control"
            formControlName="password"
            autocomplete="current-password"
            placeholder="••••••••"
            [attr.aria-invalid]="isFieldInvalid('password')"
          />
          @if (isFieldInvalid('password')) {
            <p class="fm-field__error" role="alert">{{ i18n.lang() === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Password is required.' }}</p>
          }
        </div>

        <app-fm-button
          type="submit"
          variant="primary"
          [fullWidth]="true"
          [loading]="auth.isLoading()"
          [disabled]="auth.isLoading()"
        >
          {{ i18n.t().auth.loginSubmit }}
        </app-fm-button>
      </form>

      <p class="auth-switch-link">
        <a routerLink="/auth/register">{{ i18n.t().auth.noAccountPrompt }}</a>
      </p>
    </section>
  `,
  styles: [
    `
      .auth-page-title {
        font-size: var(--fm-text-xl);
        margin-block-end: var(--fm-space-1);
      }

      .auth-page-subtitle {
        font-size: var(--fm-text-sm);
        color: var(--fm-color-text-secondary);
        margin-block-end: var(--fm-space-4);
      }

      .fm-field {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-1);
        margin-block-end: var(--fm-space-4);
      }

      .fm-field__label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .fm-field__label {
        font-size: var(--fm-text-sm);
        font-weight: 600;
        color: var(--fm-color-deep-navy);
      }

      .fm-field__control {
        width: 100%;
        min-height: 2.625rem;
        padding-block: var(--fm-space-2);
        padding-inline: var(--fm-space-3);
        font-family: var(--fm-font-sans);
        font-size: var(--fm-text-base);
        border: 1px solid var(--fm-color-border-strong);
        border-radius: var(--fm-radius-md);
      }

      .fm-field__error {
        margin: 0;
        font-size: var(--fm-text-xs);
        font-weight: 600;
        color: var(--fm-color-danger);
      }

      .pw-toggle {
        background: none;
        border: none;
        color: var(--fm-color-brand-teal);
        font-family: var(--fm-font-sans);
        font-size: var(--fm-text-xs);
        font-weight: 600;
        cursor: pointer;
        padding: var(--fm-space-1);
      }

      .auth-switch-link {
        margin-block-start: var(--fm-space-4);
        margin-block-end: 0;
        text-align: center;
        font-size: var(--fm-text-sm);
      }
    `,
  ],
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly i18n = inject(LanguageService);

  readonly showPassword = signal<boolean>(false);
  private readonly submitted = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  isFieldInvalid(controlName: 'email' | 'password'): boolean {
    const ctrl = this.form.controls[controlName];
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.auth.clearError();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: (user) => {
        const rawReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = rawReturnUrl
          ? sanitizeReturnUrl(rawReturnUrl)
          : resolveDefaultWorkspaceByRole(user.role);
        void this.router.navigateByUrl(target);
      },
      error: () => {
        // Error state is populated on AuthService.errorMessage signal
      },
    });
  }
}
