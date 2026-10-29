import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { resolveDefaultWorkspaceByRole } from '../../core/guards/auth.guard';
import { LanguageService } from '../../core/i18n/language.service';
import { FmAlertComponent, FmButtonComponent } from '../../shared/ui';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FmAlertComponent, FmButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="register-heading">
      <h1 id="register-heading" class="auth-page-title">{{ i18n.t().auth.registerTitle }}</h1>
      <p class="auth-page-subtitle">{{ i18n.t().auth.registerSubtitle }}</p>

      @if (auth.errorMessage(); as errMsg) {
        <app-fm-alert variant="danger" [title]="errMsg" />
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="fm-field">
          <label class="fm-field__label" for="register-name">
            {{ i18n.t().auth.fullNameLabel }} <span aria-hidden="true">*</span>
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
              Full name is required (2–120 characters).
            </p>
          }
        </div>

        <div class="fm-field">
          <label class="fm-field__label" for="register-email">
            {{ i18n.t().auth.emailLabel }} <span aria-hidden="true">*</span>
          </label>
          <input
            id="register-email"
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
          <label class="fm-field__label" for="register-role">
            {{ i18n.t().auth.roleLabel }} <span aria-hidden="true">*</span>
          </label>
          <select id="register-role" class="fm-field__control" formControlName="role">
            <option value="CUSTOMER">{{ i18n.t().auth.roleCustomer }}</option>
            <option value="PROVIDER">{{ i18n.t().auth.roleProvider }}</option>
          </select>
        </div>

        <div class="fm-field">
          <label class="fm-field__label" for="register-phone">
            {{ i18n.t().auth.phoneLabel }}
          </label>
          <input
            id="register-phone"
            type="tel"
            class="fm-field__control"
            formControlName="phone"
            autocomplete="tel"
            placeholder="+962 79 000 0000"
          />
        </div>

        <div class="fm-field">
          <div class="fm-field__label-row">
            <label class="fm-field__label" for="register-password">
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
            id="register-password"
            [type]="showPassword() ? 'text' : 'password'"
            class="fm-field__control"
            formControlName="password"
            autocomplete="new-password"
            placeholder="••••••••"
            [attr.aria-invalid]="isFieldInvalid('password')"
          />
          @if (isFieldInvalid('password')) {
            <p class="fm-field__error" role="alert">
              Password must be at least 8 characters and include letters and numbers.
            </p>
          }
        </div>

        <app-fm-button
          type="submit"
          variant="primary"
          [fullWidth]="true"
          [loading]="auth.isLoading()"
          [disabled]="auth.isLoading()"
        >
          {{ i18n.t().auth.registerSubmit }}
        </app-fm-button>
      </form>

      <p class="auth-switch-link">
        <a routerLink="/auth/login">{{ i18n.t().auth.haveAccountPrompt }}</a>
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
        background-color: var(--fm-color-surface-white);
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
    role: [inject(ActivatedRoute).snapshot.queryParamMap.get('role') === 'PROVIDER' ? 'PROVIDER' as const : 'CUSTOMER' as const, [Validators.required]],
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
