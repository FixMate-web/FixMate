import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-fm-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fm-field">
      <label class="fm-field__label" [attr.for]="inputId()">
        {{ label() }}
        @if (required()) {
          <span class="fm-field__required" aria-hidden="true">*</span>
        }
      </label>

      <input
        class="fm-field__control"
        [class.fm-field__control--error]="!!error()"
        [id]="inputId()"
        [attr.type]="type()"
        [value]="value()"
        [attr.placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? inputId() + '-error' : hint() ? inputId() + '-hint' : null"
        (input)="onInput($event)"
      />

      @if (error()) {
        <p class="fm-field__error" [id]="inputId() + '-error'" role="alert">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p class="fm-field__hint" [id]="inputId() + '-hint'">
          {{ hint() }}
        </p>
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

      .fm-field__control {
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
        transition: border-color var(--fm-transition-fast);

        &:disabled {
          background-color: var(--fm-color-surface-light);
          color: var(--fm-color-text-muted);
          cursor: not-allowed;
        }
      }

      .fm-field__control--error {
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
export class FmInputComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'tel' | 'number'>('text');
  readonly value = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);

  readonly valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
