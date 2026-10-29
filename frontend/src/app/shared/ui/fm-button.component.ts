import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type FmButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type FmButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-fm-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [attr.type]="type()"
      class="fm-btn"
      [class.fm-btn--primary]="variant() === 'primary'"
      [class.fm-btn--secondary]="variant() === 'secondary'"
      [class.fm-btn--accent]="variant() === 'accent'"
      [class.fm-btn--ghost]="variant() === 'ghost'"
      [class.fm-btn--danger]="variant() === 'danger'"
      [class.fm-btn--sm]="size() === 'sm'"
      [class.fm-btn--md]="size() === 'md'"
      [class.fm-btn--lg]="size() === 'lg'"
      [class.fm-btn--block]="fullWidth()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <span class="fm-btn__spinner" aria-hidden="true"></span>
      }
      <span class="fm-btn__label">
        <ng-content />
      </span>
    </button>
  `,
  styles: [
    `
      .fm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--fm-space-2);
        font-family: var(--fm-font-sans);
        font-weight: 600;
        border-radius: var(--fm-radius-md);
        border: 1px solid transparent;
        cursor: pointer;
        text-decoration: none;
        transition:
          background-color var(--fm-transition-fast),
          border-color var(--fm-transition-fast),
          color var(--fm-transition-fast);

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .fm-btn--sm {
        padding-block: var(--fm-space-1);
        padding-inline: var(--fm-space-3);
        font-size: var(--fm-text-sm);
        min-height: 2.125rem;
      }

      .fm-btn--md {
        padding-block: var(--fm-space-2);
        padding-inline: var(--fm-space-4);
        font-size: var(--fm-text-base);
        min-height: 2.625rem;
      }

      .fm-btn--lg {
        padding-block: var(--fm-space-3);
        padding-inline: var(--fm-space-6);
        font-size: var(--fm-text-lg);
        min-height: 3rem;
      }

      .fm-btn--block {
        width: 100%;
      }

      .fm-btn--primary {
        background-color: var(--fm-color-brand-teal);
        color: var(--fm-color-surface-white);

        &:hover:not(:disabled) {
          background-color: var(--fm-color-brand-teal-hover);
        }
      }

      .fm-btn--secondary {
        background-color: var(--fm-color-surface-white);
        color: var(--fm-color-deep-navy);
        border-color: var(--fm-color-border-strong);

        &:hover:not(:disabled) {
          background-color: var(--fm-color-surface-light);
          border-color: var(--fm-color-deep-navy);
        }
      }

      .fm-btn--accent {
        background-color: var(--fm-color-warm-accent);
        color: var(--fm-color-deep-navy);

        &:hover:not(:disabled) {
          background-color: var(--fm-color-warm-accent-hover);
        }
      }

      .fm-btn--ghost {
        background-color: transparent;
        color: var(--fm-color-deep-navy);

        &:hover:not(:disabled) {
          background-color: var(--fm-color-brand-teal-subtle);
        }
      }

      .fm-btn--danger {
        background-color: var(--fm-color-danger);
        color: var(--fm-color-surface-white);

        &:hover:not(:disabled) {
          background-color: var(--fm-color-danger-hover);
        }
      }

      .fm-btn__spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-block-start-color: transparent;
        border-radius: 50%;
        animation: fm-spin 0.7s linear infinite;
      }

      @keyframes fm-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class FmButtonComponent {
  readonly variant = input<FmButtonVariant>('primary');
  readonly size = input<FmButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  readonly clicked = output<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
