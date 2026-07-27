import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
  });

  it('does not render dialog when closed', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('message', 'Apagar?');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('emits confirm and cancel', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Excluir');
    fixture.componentRef.setInput('message', 'Deseja deletar o item?');
    fixture.detectChanges();

    const confirmSpy = vi.fn();
    const cancelSpy = vi.fn();
    component.confirm.subscribe(confirmSpy);
    component.cancel.subscribe(cancelSpy);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="dialog"]')).toBeTruthy();
    expect(root.textContent).toContain('Deseja deletar o item?');

    const buttons = Array.from(root.querySelectorAll('button'));
    buttons.find((b) => b.textContent?.trim() === 'Cancelar')?.click();
    expect(cancelSpy).toHaveBeenCalledTimes(1);

    buttons.find((b) => b.textContent?.trim() === 'Confirmar')?.click();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('emits cancel on Escape when open', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    component.onEscape();
    expect(cancelSpy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    component.onEscape();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});
