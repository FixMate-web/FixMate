import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type FmBadgeVariant =
  | 'neutral'
  | 'teal'
  | 'info'
  | 'navy'
  | 'success'
  | 'warning'
  | 'danger';

@Component({
  selector: 'app-fm-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="fm-badge"
      [class.fm-badge--neutral]="variant() === 'neutral'"
      [class.fm-badge--teal]="variant() === 'teal' || variant() === 'info'"
      [class.fm-badge--navy]="variant() === 'navy'"
      [class.fm-badge--success]="variant() === 'success'"
      [class.fm-badge--warning]="variant() === 'warning'"
      [class.fm-badge--danger]="variant() === 'danger'"
    >
      <ng-content />
    </span>
  `,
  styles: [
    `
      .fm-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--fm-space-1);
        padding-block: 0.2rem;
        padding-inline: var(--fm-space-3);
        border-radius: var(--fm-radius-pill);
        font-size: var(--fm-text-xs);
        font-weight: 700;
        line-height: 1.4;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      .fm-badge--neutral {
        background-color: var(--fm-color-surface-light);
        color: var(--fm-color-text-secondary);
        border-color: var(--fm-color-border);
      }

      .fm-badge--teal {
        background-color: var(--fm-color-brand-teal-subtle);
        color: var(--fm-color-brand-teal);
        border-color: var(--fm-color-info-border);
      }

      .fm-badge--navy {
        background-color: var(--fm-color-deep-navy);
        color: var(--fm-color-surface-white);
      }

      .fm-badge--success {
        background-color: var(--fm-color-success-bg);
        color: var(--fm-color-success);
        border-color: var(--fm-color-success-border);
      }

      .fm-badge--warning {
        background-color: var(--fm-color-warning-bg);
        color: var(--fm-color-warning);
        border-color: var(--fm-color-warning-border);
      }

      .fm-badge--danger {
        background-color: var(--fm-color-danger-bg);
        color: var(--fm-color-danger);
        border-color: var(--fm-color-danger-border);
      }
    `,
  ],
})
export class FmBadgeComponent {
  readonly variant = input<FmBadgeVariant>('neutral');
}
