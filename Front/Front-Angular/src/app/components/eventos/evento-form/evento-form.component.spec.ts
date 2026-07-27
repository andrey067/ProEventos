import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EventoFormComponent } from './evento-form.component';
import { environment } from '../../../../environments/environment';

const baseEvento = {
  id: 5,
  tema: 'Carregado',
  local: 'Local',
  dataEvento: '01-01-2026',
  qtdPessoas: 50,
  telefone: '11999999999',
  email: 'test@example.com',
  imagemURL: '',
};

describe('EventoFormComponent', () => {
  let httpMock: HttpTestingController;

  async function configure(idParam: string) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EventoFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? idParam : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('renders new event form', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Novo evento');
    expect(fixture.componentInstance.isNew).toBe(true);
  });

  it('loads existing event with lotes and redes', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/eventos/5`).flush(baseEvento);
    httpMock.expectOne(`${environment.apiUrl}/lotes/5`).flush([{ id: 1, nome: 'VIP', eventoId: 5 }]);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/evento/5`)
      .flush([{ id: 2, nome: 'Site', url: 'https://x.com', eventoId: 5 }]);
    await fixture.whenStable();

    expect(fixture.componentInstance.form.get('tema')?.value).toBe('Carregado');
    expect(fixture.componentInstance.lotes.length).toBe(1);
    expect(fixture.componentInstance.redes.length).toBe(1);
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('shows error for invalid id', async () => {
    await configure('abc');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ID inválido.');
  });

  it('shows error when load fails', async () => {
    await configure('99');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/eventos/99`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Evento não encontrado.');

    httpMock.match(() => true).forEach((req) => {
      if (!req.cancelled) req.flush([]);
    });
  });

  it('adds lote and rede rows', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addLote();
    fixture.componentInstance.addRede();

    expect(fixture.componentInstance.lotes.length).toBe(1);
    expect(fixture.componentInstance.redes.length).toBe(1);
  });

  it('creates new evento and navigates', async () => {
    await configure('new');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0, tema: 'Novo Tema' });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...baseEvento, id: 10, tema: 'Novo Tema' });
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/eventos', 10]);
  });

  it('updates evento with lotes and redes', async () => {
    await configure('5');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/eventos/5`).flush(baseEvento);
    httpMock.expectOne(`${environment.apiUrl}/lotes/5`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/5`).flush([]);
    await fixture.whenStable();

    fixture.componentInstance.addLote();
    fixture.componentInstance.lotes.at(0)?.patchValue({
      id: 0,
      nome: 'L1',
      preco: 10,
      dataIncio: '',
      dataFim: '',
      quantidade: 5,
      eventoId: 5,
    });
    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({
      id: 0,
      nome: 'R1',
      url: 'https://r.com',
      eventoId: 5,
    });
    fixture.componentInstance.save();

    httpMock.expectOne(`${environment.apiUrl}/eventos/5`).flush(baseEvento);
    httpMock.expectOne(`${environment.apiUrl}/lotes/5`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/5`).flush([]);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/eventos', 5]);
  });

  it('shows error when save fails', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0 });
    fixture.componentInstance.save();

    httpMock.expectOne(`${environment.apiUrl}/eventos`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao salvar evento.');
  });

  it('shows error when lotes/redes save fails after evento saved', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0 });
    fixture.componentInstance.addLote();
    fixture.componentInstance.lotes.at(0)?.patchValue({
      id: 0,
      nome: 'L1',
      preco: 1,
      dataIncio: '',
      dataFim: '',
      quantidade: 1,
      eventoId: 0,
    });
    fixture.componentInstance.save();

    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush({ ...baseEvento, id: 11 });
    httpMock.expectOne(`${environment.apiUrl}/lotes/11`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe(
      'Evento salvo, mas houve erro ao salvar lotes/redes.',
    );

    httpMock.match(() => true).forEach((req) => {
      if (!req.cancelled) req.flush([]);
    });
  });

  it('does not submit when form is invalid', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.save();

    httpMock.expectNone(`${environment.apiUrl}/eventos`);
    expect(fixture.componentInstance.form.touched).toBe(true);
  });

  it('shows preview placeholder and rejects local image path', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="evento-preview-card"]');
    expect(card?.textContent).toContain('Clique para informar URL da imagem');

    fixture.componentInstance.openUrlEditor();
    expect(fixture.componentInstance.showUrlEditor).toBe(true);

    fixture.componentInstance.urlDraft = '/assets/local.jpg';
    fixture.componentInstance.commitUrl();

    expect(fixture.componentInstance.urlError).toContain('http://');
    expect(fixture.componentInstance.form.get('imagemURL')?.value).toBe('');
    expect(fixture.componentInstance.showUrlEditor).toBe(true);

    fixture.componentInstance.urlDraft = 'https://example.com/ok.jpg';
    fixture.componentInstance.commitUrl();

    expect(fixture.componentInstance.form.get('imagemURL')?.value).toBe(
      'https://example.com/ok.jpg',
    );
    expect(fixture.componentInstance.showUrlEditor).toBe(false);
  });

  it('mirrors local and contact fields in preview card', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({
      local: 'Arena SP',
      telefone: '11977776666',
      email: 'preview@test.com',
    });
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="evento-preview-card"]',
    );
    expect(card?.textContent).toContain('Arena SP');
    expect(card?.textContent).toContain('11977776666');
    expect(card?.textContent).toContain('preview@test.com');
    expect(card?.textContent).toContain('Clique para informar URL da imagem');
  });
});
