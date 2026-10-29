import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupportedLanguage } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FmAlertComponent,
    FmBadgeComponent,
    FmButtonComponent,
    FmCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="profile-page">
      <header class="profile-header">
        <div>
          <h1>{{ i18n.t().auth.profileTitle }}</h1>
          <p>{{ i18n.t().auth.profileSubtitle }}</p>
        </div>
        @if (auth.currentUser(); as user) {
          <div class="profile-badges">
            <app-fm-badge variant="teal">{{i18n.lang()==='ar'?(user.role==='ADMIN'?'إدارة':user.role==='PROVIDER'?'مزود خدمة':'عميل'):(user.role==='ADMIN'?'Administrator':user.role==='PROVIDER'?'Professional':'Customer')}}</app-fm-badge>
            <app-fm-badge variant="success">{{i18n.lang()==='ar'?'حساب نشط':'Active account'}}</app-fm-badge>
          </div>
        }
      </header>

      @if (savedSuccess()) {
        <app-fm-alert variant="success" [title]="i18n.t().auth.profileSaved" />
      }
      @if (auth.errorMessage(); as errMsg) {
        <app-fm-alert variant="danger" [title]="errMsg" />
      }

      <app-fm-card [title]="i18n.t().auth.profileTitle">
        <form [formGroup]="form" (ngSubmit)="onSave()" novalidate>
          <div class="fm-field">
            <label class="fm-field__label" for="profile-email">
              {{ i18n.t().auth.emailLabel }}
            </label>
            <input
              id="profile-email"
              type="email"
              class="fm-field__control"
              [value]="auth.currentUser()?.email ?? ''"
              disabled
            />
          </div>

          <div class="fm-field">
            <label class="fm-field__label" for="profile-fullname">
              {{ i18n.t().auth.fullNameLabel }} *
            </label>
            <input
              id="profile-fullname"
              type="text"
              class="fm-field__control"
              formControlName="fullName"
            />
          </div>

          <div class="fm-field">
            <label class="fm-field__label" for="profile-phone">
              {{ i18n.t().auth.phoneLabel }}
            </label>
            <input
              id="profile-phone"
              type="tel"
              class="fm-field__control"
              formControlName="phone"
              placeholder="+962 79 000 0000"
            />
          </div>

          <div class="fm-field">
            <label class="fm-field__label" for="profile-lang">
              {{ i18n.t().auth.languagePrefLabel }}
            </label>
            <select
              id="profile-lang"
              class="fm-field__control"
              formControlName="preferredLanguage"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="profile-actions">
            <app-fm-button
              type="submit"
              variant="primary"
              [loading]="auth.isLoading()"
              [disabled]="auth.isLoading() || form.invalid"
            >
              {{ i18n.t().auth.saveProfile }}
            </app-fm-button>

            <app-fm-button
              type="button"
              variant="danger"
              (clicked)="onLogout()"
            >
              {{ i18n.t().nav.logout }}
            </app-fm-button>
          </div>
        </form>
      </app-fm-card>
    </section>
  `,
  styles: [
    `
      .profile-page{max-width:760px}.profile-header h1{font-size:36px}.fm-field__control{min-height:48px}
      .profile-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--fm-space-3);
        margin-block-end: var(--fm-space-5);

        p {
          margin: 0;
          color: var(--fm-color-text-secondary);
          font-size: var(--fm-text-sm);
        }
      }

      .profile-badges {
        display: flex;
        gap: var(--fm-space-2);
      }

      .fm-field {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-1);
        margin-block-end: var(--fm-space-4);
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

        &:disabled {
          background-color: var(--fm-color-surface-light);
          color: var(--fm-color-text-muted);
        }
      }

      .profile-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--fm-space-3);
        margin-block-start: var(--fm-space-5);
      }
    `,
  ],
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly i18n = inject(LanguageService);

  readonly savedSuccess = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: [''],
    preferredLanguage: ['ar' as SupportedLanguage, [Validators.required]],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        fullName: user.fullName,
        phone: user.phone ?? '',
        preferredLanguage: user.preferredLanguage,
      });
    } else {
      this.auth.fetchMe().subscribe({
        next: (profile) => {
          this.form.patchValue({
            fullName: profile.fullName,
            phone: profile.phone ?? '',
            preferredLanguage: profile.preferredLanguage,
          });
        },
      });
    }
  }

  onSave(): void {
    this.savedSuccess.set(false);
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    this.auth
      .updateMyProfile({
        fullName: raw.fullName,
        phone: raw.phone,
        preferredLanguage: raw.preferredLanguage,
      })
      .subscribe({
        next: () => {
          this.savedSuccess.set(true);
        },
      });
  }

  onLogout(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigateByUrl('/auth/login');
    });
  }
}
