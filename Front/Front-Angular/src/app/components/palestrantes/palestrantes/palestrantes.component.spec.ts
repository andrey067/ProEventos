import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PalestrantesComponent } from './palestrantes.component';
import { AuthTokenService } from '../../../services/auth-token.service';
import { environment } from '../../../../environments/environment';

const samplePalestrante = {
  id: 1,
  nome: 'Maria',
  miniCurriculo: 'Dev',
  imagemURL: '',
  telefone: '11999999999',
  email: 'maria@example.com',
};

describe('PalestrantesComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalestrantesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthTokenService,
          useValue: { isAuthenticated: vi.fn(() => true) },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function initComponent() {
    const fixture = TestBed.createComponent(PalestrantesComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function flushView(fixture: ReturnType<typeof initComponent>) {
    await fixture.whenStable();
  }

  it('loads and displays palestrantes', async () => {
    const fixture = initComponent();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await flushView(fixture);

    expect(fixture.componentInstance.palestrantes).toEqual([samplePalestrante]);
    expect(fixture.componentInstance.palestrantes[0]?.nome).toBe('Maria');
  });

  it('shows empty state', async () => {
    const fixture = initComponent();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);
    await flushView(fixture);

    expect(fixture.componentInstance.palestrantes).toEqual([]);
  });

  it('shows load error', async () => {
    const fixture = initComponent();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar palestrantes.');
  });

  it('creates palestrante', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);

    const component = fixture.componentInstance;
    component.form.patchValue({
      nome: 'João',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'joao@example.com',
    });
    component.save();

    const createReq = httpMock.expectOne(`${environment.apiUrl}/palestrantes`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ id: 2, ...component.form.getRawValue() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    httpMock
      .expectOne(`${environment.apiUrl}/palestrantes`)
      .flush([{ id: 2, ...component.form.getRawValue() }]);
    await flushView(fixture);

    expect(component.editingId).toBeNull();
  });

  it('updates palestrante when editing', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.edit(samplePalestrante);
    fixture.componentInstance.form.patchValue({ nome: 'Maria Silva' });
    fixture.componentInstance.save();

    const updateReq = httpMock.expectOne(`${environment.apiUrl}/palestrantes/1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({ ...samplePalestrante, nome: 'Maria Silva' });

    await new Promise((resolve) => setTimeout(resolve, 0));
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);
    await flushView(fixture);

    expect(fixture.componentInstance.editingId).toBeNull();
  });

  it('resets form when cancel is clicked during edit', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.edit(samplePalestrante);
    fixture.componentInstance.resetForm();

    expect(fixture.componentInstance.editingId).toBeNull();
    expect(fixture.componentInstance.form.get('nome')?.value).toBe('');
  });

  it('deletes palestrante when confirmed', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    expect(fixture.componentInstance.pendingDelete).toEqual(samplePalestrante);

    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/1`).flush({ message: 'Ok' });
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('does not delete when confirm is cancelled', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    fixture.componentInstance.cancelDelete();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/palestrantes/1`);
  });

  it('shows save error', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);

    fixture.componentInstance.form.patchValue({ nome: 'Erro' });
    fixture.componentInstance.save();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao salvar palestrante.');
  });

  it('alerts on delete error', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/1`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(window.alert).toHaveBeenCalledWith('Erro ao deletar palestrante.');
  });

  it('does not submit when form is invalid', async () => {
    const fixture = initComponent();
    httpMock.expectOne(`${environment.apiUrl}/palestrantes`).flush([]);

    fixture.componentInstance.save();

    httpMock.expectNone(`${environment.apiUrl}/palestrantes`);
    expect(fixture.componentInstance.form.touched).toBe(true);
  });
});
