import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type FmAlertVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-fm-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fm-alert"
      [class.fm-alert--info]="variant() === 'info'"
      [class.fm-alert--success]="variant() === 'success'"
      [class.fm-alert--warning]="variant() === 'warning'"
      [class.fm-alert--danger]="variant() === 'danger'"
      [attr.role]="variant() === 'danger' ? 'alert' : 'status'"
    >
      <div class="fm-alert__content">
        @if (title()) {
          <strong class="fm-alert__title">{{ title() }}</strong>
        }
        <div class="fm-alert__body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .fm-alert {
        padding-block: var(--fm-space-3);
        padding-inline: var(--fm-space-4);
        border-radius: var(--fm-radius-md);
        border: 1px solid transparent;
        border-inline-start-width: 4px;
        margin-block-end: var(--fm-space-4);
        font-size: var(--fm-text-sm);
      }

      .fm-alert__title {
        display: block;
        font-weight: 700;
        margin-block-end: var(--fm-space-1);
      }

      .fm-alert--info {
        background-color: var(--fm-color-info-bg);
        border-color: var(--fm-color-info-border);
        border-inline-start-color: var(--fm-color-brand-teal);
        color: var(--fm-color-deep-navy);
      }

      .fm-alert--success {
        background-color: var(--fm-color-success-bg);
        border-color: var(--fm-color-success-border);
        border-inline-start-color: var(--fm-color-success);
        color: var(--fm-color-success);
      }

      .fm-alert--warning {
        background-color: var(--fm-color-warning-bg);
        border-color: var(--fm-color-warning-border);
        border-inline-start-color: var(--fm-color-warm-accent);
        color: var(--fm-color-warning);
      }

      .fm-alert--danger {
        background-color: var(--fm-color-danger-bg);
        border-color: var(--fm-color-danger-border);
        border-inline-start-color: var(--fm-color-danger);
        color: var(--fm-color-danger);
      }
    `,
  ],
})
export class FmAlertComponent {
  readonly variant = input<FmAlertVariant>('info');
  readonly title = input<string>('');
}
