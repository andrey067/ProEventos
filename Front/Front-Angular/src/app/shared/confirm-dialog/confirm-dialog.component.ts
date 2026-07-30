import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { modalBackdropAnimation, modalPanelAnimation } from '../motion';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  animations: [modalBackdropAnimation, modalPanelAnimation],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmar';
  @Input() message = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.cancel.emit();
  }
}
