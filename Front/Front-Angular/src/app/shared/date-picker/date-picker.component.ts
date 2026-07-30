import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  inject,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import type { Instance } from 'flatpickr/dist/types/instance';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      <input
        #input
        type="text"
        class="date-picker-input w-full rounded-[length:var(--radius-control)] border border-line bg-panel py-2 pl-3 pr-10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        [placeholder]="placeholder"
        [disabled]="disabled"
      />
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-muted"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      :host ::ng-deep .flatpickr-input,
      :host ::ng-deep .flatpickr-input.form-control,
      :host ::ng-deep input.date-picker-input {
        width: 100%;
        border-radius: var(--radius-control);
        border: 1px solid var(--color-line, #e2e8f0);
        background: var(--color-panel, #fff);
        padding: 0.5rem 2.5rem 0.5rem 0.75rem;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class DatePickerComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('input', { static: true }) inputRef!: ElementRef<HTMLInputElement>;
  @Input() placeholder = 'Selecione a data';

  disabled = false;
  private picker?: Instance;
  private pendingValue = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    // Flatpickr callbacks run outside NgZone — re-enter so form + preview update.
    this.ngZone.runOutsideAngular(() => {
      this.picker = flatpickr(this.inputRef.nativeElement, {
        locale: Portuguese,
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: false,
        disableMobile: true,
        onChange: (_dates, dateStr) => {
          this.ngZone.run(() => {
            this.onChange(dateStr || '');
            this.onTouched();
            this.cdr.markForCheck();
          });
        },
        onClose: () => {
          this.ngZone.run(() => this.onTouched());
        },
      });
    });

    const alt = this.picker?.altInput;
    if (alt) {
      alt.classList.add(
        'w-full',
        'rounded-[length:var(--radius-control)]',
        'border',
        'border-line',
        'bg-panel',
        'py-2',
        'pl-3',
        'pr-10',
        'text-sm',
        'outline-none',
        'focus:border-accent',
        'focus:ring-2',
        'focus:ring-accent/20',
      );
    }

    if (this.pendingValue && this.picker) {
      this.picker.setDate(this.pendingValue, false);
    }
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }

  writeValue(value: string | null): void {
    const next = value?.trim() ?? '';
    this.pendingValue = next;
    if (this.picker) {
      if (next) this.picker.setDate(next, false);
      else this.picker.clear();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.picker?.altInput?.setAttribute('disabled', 'true');
    else this.picker?.altInput?.removeAttribute('disabled');
  }
}
