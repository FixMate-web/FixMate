import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { resolveDefaultWorkspaceByRole } from '../../core/guards/auth.guard';
import { LanguageService } from '../../core/i18n/language.service';
import { FmAlertComponent } from '../../shared/ui';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FmAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="register-heading">
      <h1 id="register-heading" class="auth-page-title">
        {{ i18n.lang() === 'ar' ? 'إنشاء حسابك' : 'Create your account' }}
      </h1>

      <div class="auth-card">
        @if (auth.errorMessage(); as errMsg) {
          <div class="auth-alert-wrap">
            <app-fm-alert variant="danger" [title]="errMsg" />
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="fm-field">
            <label class="fm-field__label" for="register-name">
              {{ i18n.t().auth.fullNameLabel }}
            </label>
            <input
              id="register-name"
              type="text"
              class="fm-field__control"
              formControlName="fullName"
              autocomplete="name"
              placeholder="Ahmad Al-Zoubi"
              [attr.aria-invalid]="isFieldInvalid('fullName')"
            />
            @if (isFieldInvalid('fullName')) {
              <p class="fm-field__error" role="alert">
                {{
                  i18n.lang() === 'ar'
                    ? 'الاسم الكامل مطلوب (2 إلى 120 حرفاً).'
                    : 'Full name is required (2–120 characters).'
                }}
              </p>
            }
          </div>

          <div class="fm-field">
            <label class="fm-field__label" for="register-email">
              {{ i18n.t().auth.emailLabel }}
            </label>
            <input
              id="register-email"
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
            <label class="fm-field__label" for="register-phone">
              {{ i18n.t().auth.phoneLabel }}
            </label>
            <input
              id="register-phone"
              type="tel"
              class="fm-field__control"
              dir="ltr"
              formControlName="phone"
              autocomplete="tel"
              placeholder="+962 79 000 0000"
            />
            <span class="fm-field__hint">
              {{
                i18n.lang() === 'ar'
                  ? 'نستخدم رقم الهاتف لتأكيد المواعيد مع مزود الخدمة في الأردن.'
                  : 'Used to coordinate service appointments across Jordan.'
              }}
            </span>
          </div>

          <div class="fm-field">
            <label class="fm-field__label" for="register-role">
              {{ i18n.t().auth.roleLabel }}
            </label>
            <select id="register-role" class="fm-field__control" formControlName="role">
              <option value="CUSTOMER">{{ i18n.t().auth.roleCustomer }}</option>
              <option value="PROVIDER">{{ i18n.t().auth.roleProvider }}</option>
            </select>
          </div>

          <div class="fm-field">
            <div class="fm-field__label-row">
              <label class="fm-field__label" for="register-password">
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
              id="register-password"
              [type]="showPassword() ? 'text' : 'password'"
              class="fm-field__control"
              formControlName="password"
              autocomplete="new-password"
              placeholder="••••••••"
              [attr.aria-invalid]="isFieldInvalid('password')"
            />
            <div class="pw-requirements">
              <p>
                {{
                  i18n.lang() === 'ar' ? 'يجب أن تكون كلمة المرور:' : 'Your password must:'
                }}
              </p>
              <ul>
                <li>
                  {{
                    i18n.lang() === 'ar'
                      ? 'بين 8 و 72 حرفاً'
                      : 'be 8 to 72 characters long'
                  }}
                </li>
                <li>
                  {{
                    i18n.lang() === 'ar'
                      ? 'تحتوي على أحرف وأرقام'
                      : 'include letters and numbers'
                  }}
                </li>
                <li>
                  {{
                    i18n.lang() === 'ar'
                      ? 'لا تحتوي على بريدك الإلكتروني'
                      : 'not contain your name or email'
                  }}
                </li>
              </ul>
            </div>
            @if (isFieldInvalid('password')) {
              <p class="fm-field__error" role="alert">
                {{
                  i18n.lang() === 'ar'
                    ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتحتوي على أحرف وأرقام.'
                    : 'Password must be at least 8 characters and include letters and numbers.'
                }}
              </p>
            }
          </div>

          <p class="auth-terms-note">
            {{
              i18n.lang() === 'ar'
                ? 'بالنقر على "إنشاء حساب"، فإنك توافق على شروط الاستخدام وسياسة الخصوصية.'
                : 'By clicking Create Account, you agree to the Terms of Use and Privacy Policy.'
            }}
          </p>

          <button
            type="submit"
            class="auth-pill-submit"
            [disabled]="auth.isLoading()"
          >
            {{
              auth.isLoading()
                ? i18n.lang() === 'ar'
                  ? 'جاري إنشاء الحساب...'
                  : 'Creating account...'
                : i18n.t().auth.registerSubmit
            }}
          </button>
        </form>

        <p class="auth-switch-link">
          {{ i18n.lang() === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?' }}
          <a routerLink="/auth/login">{{
            i18n.lang() === 'ar' ? 'تسجيل الدخول' : 'Log in'
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
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 4px 20px rgba(7, 47, 64, 0.05);
      }

      .auth-alert-wrap {
        margin-bottom: 18px;
      }

      .fm-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
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
        min-height: 48px;
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

      .fm-field__hint {
        font-size: 12px;
        color: #6b7280;
        padding-inline: 6px;
      }

      .pw-requirements {
        margin-top: 6px;
        padding-inline: 8px;
        font-size: 12px;
        color: #6b7280;

        p {
          margin: 0 0 4px;
          font-weight: 600;
        }

        ul {
          margin: 0;
          padding-inline-start: 18px;
          line-height: 1.6;
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

      .auth-terms-note {
        font-size: 12px;
        line-height: 1.6;
        color: #6b7280;
        text-align: center;
        margin: 14px 0;
      }

      .auth-pill-submit {
        width: 100%;
        min-height: 48px;
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

      .auth-switch-link {
        margin: 20px 0 0;
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
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly i18n = inject(LanguageService);

  readonly showPassword = signal<boolean>(false);
  private readonly submitted = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    role: [
      inject(ActivatedRoute).snapshot.queryParamMap.get('role') === 'PROVIDER'
        ? ('PROVIDER' as const)
        : ('CUSTOMER' as const),
      [Validators.required],
    ],
    phone: [''],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  isFieldInvalid(controlName: 'fullName' | 'email' | 'password'): boolean {
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

    const raw = this.form.getRawValue();
    this.auth
      .register({
        fullName: raw.fullName,
        email: raw.email,
        password: raw.password,
        phone: raw.phone || undefined,
        role: raw.role,
        preferredLanguage: this.i18n.lang(),
      })
      .subscribe({
        next: (user) => {
          void this.router.navigateByUrl(resolveDefaultWorkspaceByRole(user.role));
        },
        error: () => {
          // Handled via AuthService.errorMessage signal
        },
      });
  }
}
