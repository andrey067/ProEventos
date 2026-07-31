import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PalestranteService } from '../../../../services/palestrante.service';
import { PalestranteDetalheComponent } from './palestrante-detalhe.component';

describe('PalestranteDetalheComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [PalestranteDetalheComponent],
      providers: [
        {
          provide: PalestranteService,
          useValue: { getMe: vi.fn(), update: vi.fn() },
        },
      ],
    }).compileComponents();
  }

  it('calls getMe on init and fills the form', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    vi.mocked(svc.getMe).mockReturnValue(
      of({
        id: 7,
        nome: 'Speaker',
        email: 's@x.com',
        telefone: '11',
        imagemURL: 'http://img',
        miniCurriculo: 'Mini',
      }),
    );
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(svc.getMe).toHaveBeenCalled();
    expect(fixture.componentInstance.form.value.nome).toBe('Speaker');
    expect(fixture.componentInstance.form.value.miniCurriculo).toBe('Mini');
  });

  it('shows 404 warning and disables useful save', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    vi.mocked(svc.getMe).mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Salve o perfil com função Palestrante primeiro',
    );
    expect(fixture.componentInstance.palestranteId).toBeNull();
  });

  it('saves via update with id from getMe', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    const me = {
      id: 7,
      nome: 'Speaker',
      email: 's@x.com',
      telefone: '11',
      imagemURL: '',
      miniCurriculo: 'Mini',
    };
    vi.mocked(svc.getMe).mockReturnValue(of(me));
    vi.mocked(svc.update).mockReturnValue(of({ ...me, nome: 'Novo' }));
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.form.patchValue({ nome: 'Novo' });
    fixture.componentInstance.submit();
    expect(svc.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ id: 7, nome: 'Novo' }),
    );
  });
});
