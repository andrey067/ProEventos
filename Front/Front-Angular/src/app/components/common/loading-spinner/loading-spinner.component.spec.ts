import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  const show = vi.fn().mockResolvedValue(undefined);
  const hide = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
      providers: [
        {
          provide: NgxSpinnerService,
          useValue: {
            show,
            hide,
            getSpinner: vi.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compileComponents();
    vi.clearAllMocks();
  });

  it('uses button and inline spinner sizes', () => {
    const fixture = TestBed.createComponent(LoadingSpinnerComponent);
    const component = fixture.componentInstance;

    component.variant = 'button';
    expect(component.spinnerSize).toBe('small');
    component.variant = 'inline';
    expect(component.spinnerSize).toBe('medium');
    component.variant = 'page';
    expect(component.spinnerSize).toBe('default');
  });

  it('shows and hides spinner through ngOnChanges', () => {
    const fixture = TestBed.createComponent(LoadingSpinnerComponent);
    const component = fixture.componentInstance;

    component.active = true;
    component.ngOnChanges({
      active: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(show).toHaveBeenCalled();

    component.active = false;
    component.ngOnChanges({
      active: {
        currentValue: false,
        previousValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(hide).toHaveBeenCalled();
  });

  it('hides spinner on destroy', () => {
    const fixture = TestBed.createComponent(LoadingSpinnerComponent);
    fixture.componentInstance.ngOnDestroy();
    expect(hide).toHaveBeenCalled();
  });
});
