import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

let spinnerCounter = 0;

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  template: `
    <div
      [class.relative]="variant === 'button'"
      [class.inline-flex]="variant === 'button'"
      [class.py-4]="variant === 'inline'"
      [class.flex]="variant === 'page'"
      [class.justify-center]="variant === 'page'"
      [class.py-12]="variant === 'page'"
      [attr.aria-busy]="active ? 'true' : null"
      [attr.data-testid]="active ? 'loading-spinner' : null"
    >
      <ngx-spinner
        [name]="spinnerName"
        [fullScreen]="false"
        bdColor="rgba(255,255,255,0)"
        [size]="spinnerSize"
        color="#6366f1"
        type="ball-clip-rotate"
      >
        <span class="sr-only">{{ label }}</span>
      </ngx-spinner>
    </div>
  `,
})
export class LoadingSpinnerComponent implements OnChanges, OnDestroy {
  @Input() active = false;
  @Input() variant: 'page' | 'inline' | 'button' = 'page';
  @Input() label = 'Carregando...';

  readonly spinnerName = `app-spinner-${++spinnerCounter}`;

  private readonly spinner = inject(NgxSpinnerService);

  get spinnerSize(): 'small' | 'default' | 'medium' | 'large' {
    if (this.variant === 'button') return 'small';
    if (this.variant === 'inline') return 'medium';
    return 'default';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['active']) return;
    if (this.active) {
      void this.spinner.show(this.spinnerName);
    } else {
      void this.spinner.hide(this.spinnerName);
    }
  }

  ngOnDestroy(): void {
    void this.spinner.hide(this.spinnerName);
  }
}
