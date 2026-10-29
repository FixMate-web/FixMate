import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { resolveDefaultWorkspaceByRole, sanitizeReturnUrl } from '../../core/guards/auth.guard';
import { LanguageService } from '../../core/i18n/language.service';
import { FmAlertComponent } from '../../shared/ui';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FmAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="login-heading">
      <h1 id="login-heading" class="auth-page-title">
        {{ i18n.lang() === 'ar' ? 'مرحباً بعودتك' : 'Welcome back' }}
      </h1>

      <div class="auth-card">
        @if (auth.errorMessage(); as errMsg) {
          <div class="auth-alert-wrap">
            <app-fm-alert variant="danger" [title]="errMsg" />
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="fm-field">
            <label class="fm-field__label" for="login-email">
              {{ i18n.t().auth.emailLabel }}
            </label>
            <input
              id="login-email"
              type="email"
              class="fm-field__control"
              dir="ltr"
              formControlName="email"
              autocomplete="email"
              placeholder="name@example.com"
              [attr.aria-invalid]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <p class="fm-field__error" role="alert">
                {{
                  i18n.lang() === 'ar'
                    ? 'يرجى إدخال بريد إلكتروني صحيح.'
                    : 'Please enter a valid email address.'
                }}
              </p>
            }
          </div>

          <div class="fm-field">
            <div class="fm-field__label-row">
              <label class="fm-field__label" for="login-password">
                {{ i18n.t().auth.passwordLabel }}
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
              <p class="fm-field__error" role="alert">
                {{ i18n.lang() === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Password is required.' }}
              </p>
            }
          </div>

          <button type="submit" class="auth-pill-submit" [disabled]="auth.isLoading()">
            {{
              auth.isLoading()
                ? i18n.lang() === 'ar'
                  ? 'جاري تسجيل الدخول...'
                  : 'Signing in...'
                : i18n.t().auth.loginSubmit
            }}
          </button>
        </form>

        <div class="auth-divider">
          <span>{{ i18n.lang() === 'ar' ? 'أو' : 'OR' }}</span>
        </div>

        <p class="auth-terms-note">
          {{
            i18n.lang() === 'ar'
              ? 'بتسجيل الدخول، فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة FixMate الأردن.'
              : 'By signing in, you agree to FixMate Jordan’s Terms of Use and Privacy Policy.'
          }}
        </p>

        <p class="auth-switch-link">
          {{ i18n.lang() === 'ar' ? 'ليس لديك حساب؟' : 'Don’t have an account?' }}
          <a routerLink="/auth/register">{{
            i18n.lang() === 'ar' ? 'إنشاء حساب جديد' : 'Sign up'
          }}</a>
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-page-title {
        text-align: center;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.6px;
        color: #111827;
        margin-bottom: 24px;
      }

      .auth-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 3px;
        padding: 26px;
      }

      .auth-alert-wrap {
        margin-bottom: 18px;
      }

      .fm-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 18px;
      }

      .fm-field__label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .fm-field__label {
        font-size: 14px;
        font-weight: 700;
        color: #111827;
      }

      .fm-field__control {
        width: 100%;
        min-height: 44px;
        padding: 10px 18px;
        font-family: var(--fm-font-sans);
        font-size: 15px;
        color: #111827;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;

        &:focus {
          outline: none;
          border-color: #009fd9;
          box-shadow: 0 0 0 3px rgba(0, 159, 217, 0.16);
        }
      }

      .fm-field__error {
        margin: 2px 8px 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--fm-color-danger);
      }

      .pw-toggle {
        background: none;
        border: none;
        color: #009fd9;
        font-family: var(--fm-font-sans);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 2px 4px;
      }

      .auth-pill-submit {
        width: 100%;
        min-height: 44px;
        margin-top: 6px;
        background: #072f40;
        color: #ffffff;
        border: 0;
        border-radius: 999px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          transform 0.15s ease;

        &:hover:not(:disabled) {
          background: #052330;
          transform: translateY(-1px);
        }
      }

      .auth-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 22px 0 16px;
        color: #9ca3af;
        font-size: 12px;
        font-weight: 600;

        &::before,
        &::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
      }

      .auth-terms-note {
        font-size: 12px;
        line-height: 1.6;
        color: #6b7280;
        text-align: center;
        margin-bottom: 18px;
      }

      .auth-switch-link {
        margin: 0;
        text-align: center;
        font-size: 14px;
        color: #374151;

        a {
          color: #009fd9;
          font-weight: 700;
          text-decoration: none;
          margin-inline-start: 4px;

          &:hover {
            text-decoration: underline;
          }
        }
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
