import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '../../core/i18n/language.service';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
  FmConfirmDialogComponent,
  FmEmptyStateComponent,
  FmInputComponent,
  FmSelectComponent,
  FmSpinnerComponent,
  FmTextareaComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-ui-showcase-page',
  standalone: true,
  imports: [
    FmAlertComponent,
    FmBadgeComponent,
    FmButtonComponent,
    FmCardComponent,
    FmConfirmDialogComponent,
    FmEmptyStateComponent,
    FmInputComponent,
    FmSelectComponent,
    FmSpinnerComponent,
    FmTextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fm-container">
      <header class="showcase-header">
        <app-fm-badge variant="teal">Development UI Primitives Showcase</app-fm-badge>
        <h1>FixMate Design System Primitives</h1>
        <p>
          Interactive verification of buttons, form controls, status badges, alerts, spinners, empty
          states, and confirmation dialogs in both RTL (Arabic) and LTR (English).
        </p>
      </header>

      <div class="showcase-grid">
        <app-fm-card title="1. Buttons & Variants" subtitle="FmButtonComponent">
          <div class="showcase-row">
            <app-fm-button variant="primary">Primary (#126C73)</app-fm-button>
            <app-fm-button variant="secondary">Secondary (#1F3447)</app-fm-button>
            <app-fm-button variant="accent">Warm Accent (#F0A34B)</app-fm-button>
            <app-fm-button variant="ghost">Ghost</app-fm-button>
            <app-fm-button variant="danger">Danger</app-fm-button>
            <app-fm-button variant="primary" [loading]="true">Loading</app-fm-button>
            <app-fm-button variant="secondary" [disabled]="true">Disabled</app-fm-button>
          </div>
        </app-fm-card>

        <app-fm-card
          title="2. Status Badges & Spinners"
          subtitle="FmBadgeComponent & FmSpinnerComponent"
        >
          <div class="showcase-row">
            <app-fm-badge variant="warning">REQUESTED</app-fm-badge>
            <app-fm-badge variant="teal">ACCEPTED</app-fm-badge>
            <app-fm-badge variant="navy">IN_PROGRESS</app-fm-badge>
            <app-fm-badge variant="success">COMPLETED / APPROVED</app-fm-badge>
            <app-fm-badge variant="danger">CANCELLED / REJECTED</app-fm-badge>
            <app-fm-badge variant="neutral">EXPIRED</app-fm-badge>
          </div>
          <div class="showcase-row" style="margin-top: 1rem;">
            <app-fm-spinner label="Loading schedule slots..." />
          </div>
        </app-fm-card>

        <app-fm-card title="3. Accessible Form Controls" subtitle="FmInput, FmSelect & FmTextarea">
          <app-fm-input
            inputId="demo-district"
            label="Amman District / الحي"
            placeholder="Abdoun / عبدون"
            hint="Manual Jordanian address field (no GPS)"
          />
          <app-fm-select
            selectId="demo-category"
            label="Service Category / التصنيف"
            [options]="categoryOptions"
            value="plumbing"
          />
          <app-fm-textarea
            textareaId="demo-notes"
            label="Maintenance Description / وصف العطل"
            [rows]="3"
            placeholder="Describe the issue..."
          />
        </app-fm-card>

        <app-fm-card title="4. Alerts & Confirmation Dialog" subtitle="FmAlert & FmConfirmDialog">
          <app-fm-alert variant="info" title="Information Alert">
            All monetary values are represented in integer fils (1 JOD = 1,000 fils).
          </app-fm-alert>
          <app-fm-alert variant="success" title="Success Alert">
            Provider profile approved by administrator.
          </app-fm-alert>
          <app-fm-alert variant="danger" title="Validation Error Alert">
            Selected 30-minute time slot is already reserved.
          </app-fm-alert>

          <app-fm-button variant="danger" (clicked)="dialogOpen.set(true)">
            Open Confirmation Dialog
          </app-fm-button>

          <app-fm-confirm-dialog
            [open]="dialogOpen()"
            title="Cancel Booking Request?"
            message="Are you sure you want to cancel this booking request? Any reserved provider slots will be released."
            confirmLabel="Confirm Cancellation"
            cancelLabel="Keep Booking"
            [destructive]="true"
            (confirmed)="dialogOpen.set(false)"
            (cancelled)="dialogOpen.set(false)"
          />
        </app-fm-card>
      </div>

      <div style="margin-top: 1.5rem;">
        <app-fm-empty-state
          icon="✦"
          title="Reusable Empty State Component"
          description="Used whenever a search query or booking list returns zero items, without inventing placeholder records."
        />
      </div>
    </div>
  `,
  styles: [
    `
      .showcase-header {
        margin-block-end: var(--fm-space-6);

        h1 {
          margin-block-start: var(--fm-space-2);
        }

        p {
          color: var(--fm-color-text-secondary);
        }
      }

      .showcase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: var(--fm-space-4);
      }

      .showcase-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--fm-space-2);
      }
    `,
  ],
})
export class UiShowcasePageComponent {
  readonly i18n = inject(LanguageService);
  readonly dialogOpen = signal<boolean>(false);

  readonly categoryOptions = [
    { value: 'plumbing', label: 'Plumbing / السباكة' },
    { value: 'electrical-repairs', label: 'Electrical Repairs / الكهرباء' },
    { value: 'ac-maintenance', label: 'AC Maintenance / التكييف' },
  ] as const;
}
