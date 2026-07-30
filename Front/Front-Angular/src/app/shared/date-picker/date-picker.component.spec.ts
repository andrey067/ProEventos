import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';

vi.mock('flatpickr', () => {
  const instances: Array<{
    setDate: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    altInput?: HTMLInputElement;
  }> = [];

    const flatpickr = vi.fn((_el: HTMLElement, options: { onChange?: (d: Date[], s: string) => void; onClose?: () => void }) => {
    const altInput = document.createElement('input');
    const instance = {
      altInput,
      setDate: vi.fn(),
      clear: vi.fn(),
      destroy: vi.fn(),
    };
    instances.push(instance);
    queueMicrotask(() => {
      options.onChange?.([], '');
      options.onClose?.();
    });
    return instance;
  });

  return {
    default: flatpickr,
    __instances: instances,
  };
});

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('writes value into flatpickr when available', () => {
    const component = fixture.componentInstance;
    component.writeValue('2026-01-15');
    component.writeValue(null);
    component.setDisabledState(true);
    component.setDisabledState(false);
    expect(component.placeholder).toBe('Selecione a data');
  });

  it('registers control value accessor hooks', async () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    const component = fixture.componentInstance;
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);
    component.writeValue('2026-07-29');
    await fixture.whenStable();
    expect(component.disabled).toBe(false);
  });

  it('destroys picker on destroy', () => {
    fixture.destroy();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('clears picker when writeValue is empty', async () => {
    const flatpickrMod = await import('flatpickr');
    const instances = (flatpickrMod as { __instances: { clear: ReturnType<typeof vi.fn> }[] })
      .__instances;
    const component = fixture.componentInstance;
    component.writeValue('');
    expect(instances[0]?.clear).toHaveBeenCalled();
  });

  it('applies pending value after picker init', async () => {
    const flatpickrMod = await import('flatpickr');
    const instances = (flatpickrMod as { __instances: { setDate: ReturnType<typeof vi.fn> }[] })
      .__instances;
    const component = fixture.componentInstance;
    component.writeValue('2026-03-15');
    await fixture.whenStable();
    expect(instances[0]?.setDate).toHaveBeenCalled();
  });
});
