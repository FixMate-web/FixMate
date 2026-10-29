import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface FmSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-fm-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fm-field">
      <label class="fm-field__label" [attr.for]="selectId()">
        {{ label() }}
        @if (required()) {
          <span class="fm-field__required" aria-hidden="true">*</span>
        }
      </label>

      <select
        class="fm-field__select"
        [class.fm-field__select--error]="!!error()"
        [id]="selectId()"
        [value]="value()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.aria-invalid]="!!error()"
        (change)="onSelectChange($event)"
      >
        @if (placeholder()) {
          <option value="" disabled>{{ placeholder() }}</option>
        }
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value" [selected]="opt.value === value()">
            {{ opt.label }}
          </option>
        }
      </select>

      @if (error()) {
        <p class="fm-field__error" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p class="fm-field__hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [
    `
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

      .fm-field__required {
        color: var(--fm-color-danger);
        margin-inline-start: var(--fm-space-1);
      }

      .fm-field__select {
        width: 100%;
        min-height: 2.625rem;
        padding-block: var(--fm-space-2);
        padding-inline: var(--fm-space-3);
        font-family: var(--fm-font-sans);
        font-size: var(--fm-text-base);
        color: var(--fm-color-text-primary);
        background-color: var(--fm-color-surface-white);
        border: 1px solid var(--fm-color-border-strong);
        border-radius: var(--fm-radius-md);

        &:disabled {
          background-color: var(--fm-color-surface-light);
          color: var(--fm-color-text-muted);
          cursor: not-allowed;
        }
      }

      .fm-field__select--error {
        border-color: var(--fm-color-danger);
      }

      .fm-field__hint {
        margin: 0;
        font-size: var(--fm-text-xs);
        color: var(--fm-color-text-secondary);
      }

      .fm-field__error {
        margin: 0;
        font-size: var(--fm-text-xs);
        font-weight: 600;
        color: var(--fm-color-danger);
      }
    `,
  ],
})
export class FmSelectComponent {
  readonly selectId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly FmSelectOption[]>();
  readonly value = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);

  readonly valueChange = output<string>();

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  }
}
