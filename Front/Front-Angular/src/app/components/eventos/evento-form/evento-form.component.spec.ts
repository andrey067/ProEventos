import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EventoFormComponent } from './evento-form.component';
import { AuthTokenService } from '../../../services/auth-token.service';
import { environment } from '../../../../environments/environment';
import { PAGINATION_HEADER } from '../../../models/pagination';

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

  async function configure(idParam: string | null, canWrite = true) {
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
        {
          provide: AuthTokenService,
          useValue: {
            canWrite: vi.fn(() => canWrite),
            isAuthenticated: vi.fn(() => true),
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  }

  function flushEditLoad(overrides?: {
    evento?: object;
    lotes?: object[];
    redes?: object[];
    palestrantes?: object[] | { items: object[]; totalPages: number };
  }) {
    const id = (overrides?.evento as { id?: number } | undefined)?.id ?? 5;
    httpMock.expectOne(`${environment.apiUrl}/eventos/${id}`).flush(overrides?.evento ?? baseEvento);
    httpMock.expectOne(`${environment.apiUrl}/lotes/${id}`).flush(overrides?.lotes ?? []);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/evento/${id}`)
      .flush(overrides?.redes ?? []);
    const palestrantesBody = overrides?.palestrantes;
    const items = Array.isArray(palestrantesBody)
      ? palestrantesBody
      : (palestrantesBody?.items ?? []);
    const pageSize = 30;
    const totalCount = items.length;
    const totalPages =
      palestrantesBody && !Array.isArray(palestrantesBody)
        ? palestrantesBody.totalPages
        : totalCount === 0
          ? 0
          : Math.max(1, Math.ceil(totalCount / pageSize));
    httpMock
      .expectOne(
        (req) =>
          req.method === 'GET' &&
          req.urlWithParams.startsWith(`${environment.apiUrl}/palestrantes`),
      )
      .flush(items, {
        headers: {
          [PAGINATION_HEADER]: JSON.stringify({
            currentPage: 1,
            itemsPerPage: pageSize,
            totalItems: totalCount,
            totalPages,
          }),
        },
      });
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

  it('treats missing id param as new (route eventos/new has no :id)', async () => {
    await configure(null);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.isNew).toBe(true);
    expect(fixture.componentInstance.loading).toBe(false);
    httpMock.expectNone(`${environment.apiUrl}/eventos/0`);
  });

  it('treats id 0 as new and does not fetch', async () => {
    await configure('0');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.isNew).toBe(true);
    httpMock.expectNone(`${environment.apiUrl}/eventos/0`);
  });

  it('loads existing event with lotes and redes', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    flushEditLoad({
      lotes: [{ id: 1, nome: 'VIP', eventoId: 5 }],
      redes: [{ id: 2, nome: 'Site', url: 'https://x.com', eventoId: 5 }],
    });
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

  it('removes local lote without DELETE when id is 0', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addLote();
    fixture.componentInstance.askDeleteLote(0);
    fixture.componentInstance.confirmDelete();

    expect(fixture.componentInstance.lotes.length).toBe(0);
    httpMock.expectNone((req) => req.method === 'DELETE');
  });

  it('deletes persisted lote via API', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      lotes: [{ id: 9, nome: 'VIP', preco: 10, dataIncio: '', dataFim: '', quantidade: 1, eventoId: 5 }],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteLote(0);
    fixture.componentInstance.confirmDelete();

    const del = httpMock.expectOne(`${environment.apiUrl}/lotes/5/9`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'Ok' });
    await fixture.whenStable();

    expect(fixture.componentInstance.lotes.length).toBe(0);
  });

  it('deletes persisted rede via API', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      redes: [{ id: 3, nome: 'X', url: 'https://x.com', eventoId: 5 }],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDelete();

    const del = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/5/3`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'Ok' });
    await fixture.whenStable();

    expect(fixture.componentInstance.redes.length).toBe(0);
  });

  it('rejects tema shorter than 4 characters', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0, tema: 'abc' });
    fixture.componentInstance.save();

    httpMock.expectNone(`${environment.apiUrl}/eventos`);
    expect(fixture.componentInstance.form.get('tema')?.invalid).toBe(true);
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
    flushEditLoad();
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

  it('mirrors create input events into preview (two-way binding)', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[formControlName="local"]')).toBeTruthy();
    expect(root.querySelector('input[formControlName="telefone"]')).toBeTruthy();
    expect(root.querySelector('input[formControlName="email"]')).toBeTruthy();

    // Simulate user edits through the reactive form (template uses formControlName).
    fixture.componentInstance.form.patchValue({
      local: 'Arena Live',
      telefone: '11911112222',
      email: 'live@test.com',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.previewLocal).toBe('Arena Live');
    expect(fixture.componentInstance.previewTelefone).toBe('11911112222');
    expect(fixture.componentInstance.previewEmail).toBe('live@test.com');

    const card = root.querySelector('[data-testid="evento-preview-card"]');
    expect(card?.textContent).toContain('Arena Live');
    expect(card?.textContent).toContain('11911112222');
    expect(card?.textContent).toContain('live@test.com');
  });

  it('prefills preview on edit load and keeps syncing after change', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      evento: {
        ...baseEvento,
        local: 'Sala A',
        telefone: '11900001111',
        email: 'edit@test.com',
        dataEvento: '2026-03-15',
        imagemURL: 'https://example.com/e.jpg',
      },
      lotes: [],
      redes: [],
      palestrantes: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    let card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="evento-preview-card"]',
    );
    expect(card?.textContent).toContain('Sala A');
    expect(card?.textContent).toContain('11900001111');
    expect(card?.textContent).toContain('edit@test.com');
    expect(card?.textContent).toMatch(/15\/03\/2026/);

    fixture.componentInstance.form.patchValue({ local: 'Sala B' });
    fixture.detectChanges();

    card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="evento-preview-card"]',
    );
    expect(card?.textContent).toContain('Sala B');
  });

  it('updates preview date when dataEvento form control changes', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.get('dataEvento')?.setValue('2026-07-20');
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="evento-preview-card"]',
    );
    expect(card?.textContent).toMatch(/20\/07\/2026/);
  });

  it('associates selected palestrante via API', async () => {
    await configure('5');
    const palestrante = {
      id: 7,
      nome: 'Ana',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'ana@test.com',
    };

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      evento: { ...baseEvento, palestrantes: [] },
      palestrantes: [palestrante],
    });
    await fixture.whenStable();

    fixture.componentInstance.associateId = 7;
    fixture.componentInstance.associateSelected();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/5/palestrantes/7`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Ok' });
    await fixture.whenStable();

    expect(fixture.componentInstance.linkedPalestrantes).toEqual([palestrante]);
    expect(fixture.componentInstance.associateId).toBeNull();
    expect(fixture.componentInstance.success).toBe('Palestrante associado.');
  });

  it('disassociates palestrante via API after confirm', async () => {
    await configure('5');
    const palestrante = {
      id: 7,
      nome: 'Ana',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'ana@test.com',
    };

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      evento: { ...baseEvento, palestrantes: [palestrante] },
      palestrantes: [palestrante],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDisassociate(palestrante);
    fixture.componentInstance.confirmDelete();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/5/palestrantes/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Ok' });
    await fixture.whenStable();

    expect(fixture.componentInstance.linkedPalestrantes).toEqual([]);
    expect(fixture.componentInstance.success).toBe('Palestrante desassociado.');
  });

  it('hides write controls when canWrite is false', async () => {
    await configure('new', false);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.canWrite).toBe(false);
    expect(fixture.componentInstance.form.disabled).toBe(true);
    expect(root.textContent).toContain('somente leitura');
    expect(root.textContent).not.toContain('Salvar');

    fixture.componentInstance.addLote();
    fixture.componentInstance.addRede();
    fixture.componentInstance.associateId = 7;
    fixture.componentInstance.associateSelected();
    fixture.componentInstance.save();

    expect(fixture.componentInstance.lotes.length).toBe(0);
    expect(fixture.componentInstance.redes.length).toBe(0);
    httpMock.expectNone(`${environment.apiUrl}/eventos`);
  });

  it('disables form and blocks associate when editing without write access', async () => {
    await configure('5', false);
    const palestrante = {
      id: 7,
      nome: 'Ana',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'ana@test.com',
    };

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      evento: { ...baseEvento, palestrantes: [palestrante] },
      palestrantes: [palestrante],
    });
    await fixture.whenStable();

    expect(fixture.componentInstance.form.disabled).toBe(true);
    fixture.componentInstance.associateId = 7;
    fixture.componentInstance.associateSelected();
    fixture.componentInstance.askDisassociate(palestrante);

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/eventos/5/palestrantes/7`);
  });

  it('shows error when rede delete fails', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      redes: [{ id: 3, nome: 'X', url: 'https://x.com', eventoId: 5 }],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDelete();

    const del = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/5/3`);
    del.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao excluir rede social.');
  });

  it('removes local rede without DELETE when id is 0', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDelete();

    expect(fixture.componentInstance.redes.length).toBe(0);
    expect(fixture.componentInstance.success).toBe('Rede social removida.');
    httpMock.expectNone((req) => req.method === 'DELETE');
  });

  it('shows error when disassociate fails', async () => {
    await configure('5');
    const palestrante = {
      id: 7,
      nome: 'Ana',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'ana@test.com',
    };

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      evento: { ...baseEvento, palestrantes: [palestrante] },
      palestrantes: [palestrante],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDisassociate(palestrante);
    fixture.componentInstance.confirmDelete();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/5/palestrantes/7`);
    req.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao desassociar palestrante.');
  });

  it('exposes tema and qtd validation messages', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const tema = fixture.componentInstance.form.get('tema');
    tema?.setValue('ab');
    tema?.markAsTouched();
    expect(fixture.componentInstance.temaErrorMessage()).toContain('4 e 50');

    tema?.setValue('x'.repeat(51));
    tema?.markAsTouched();
    expect(fixture.componentInstance.temaErrorMessage()).toContain('máximo');

    const qtd = fixture.componentInstance.form.get('qtdPessoas');
    qtd?.setValue(200000);
    qtd?.markAsTouched();
    expect(fixture.componentInstance.qtdErrorMessage()).toContain('120000');

    qtd?.setValue(0);
    expect(fixture.componentInstance.qtdErrorMessage()).toContain('Mínimo');
  });

  it('shows error when associate fails', async () => {
    await configure('5');
    const palestrante = {
      id: 7,
      nome: 'Ana',
      miniCurriculo: '',
      imagemURL: '',
      telefone: '',
      email: 'ana@test.com',
    };

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({ palestrantes: [palestrante] });
    await fixture.whenStable();

    fixture.componentInstance.associateId = 7;
    fixture.componentInstance.associateSelected();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/5/palestrantes/7`);
    req.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao associar palestrante.');
  });

  it('shows error when save fails on create', async () => {
    await configure('new');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0, tema: 'Novo Tema' });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    req.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao salvar evento.');
  });

  it('cancels pending delete without API call', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      lotes: [{ id: 9, nome: 'VIP', preco: 10, dataIncio: '', dataFim: '', quantidade: 1, eventoId: 5 }],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteLote(0);
    fixture.componentInstance.cancelDelete();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/lotes/5/9`);
  });

  it('shows error when lote delete fails', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      lotes: [{ id: 9, nome: 'VIP', preco: 10, dataIncio: '', dataFim: '', quantidade: 1, eventoId: 5 }],
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteLote(0);
    fixture.componentInstance.confirmDelete();

    const del = httpMock.expectOne(`${environment.apiUrl}/lotes/5/9`);
    del.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao excluir lote.');
  });

  it('associateSelected ignores unknown palestrante id', async () => {
    await configure('5');

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({ palestrantes: [] });
    await fixture.whenStable();

    fixture.componentInstance.associateId = 999;
    fixture.componentInstance.associateSelected();

    httpMock.expectNone(`${environment.apiUrl}/eventos/5/palestrantes/999`);
  });

  it('exposes confirm dialog copy for lote, rede and palestrante deletes', async () => {
    await configure('5');
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({
      lotes: [
        {
          id: 9,
          nome: 'VIP',
          preco: 100,
          quantidade: 10,
          dataIncio: '01-01-2026',
          dataFim: '31-01-2026',
          eventoId: 5,
        },
      ],
      redes: [{ id: 11, nome: 'Twitter', url: 'https://x.com', eventoId: 5 }],
      evento: { ...baseEvento, palestrantes: [{ id: 2, nome: 'João' }] },
    });
    await fixture.whenStable();

    fixture.componentInstance.askDeleteLote(0);
    expect(fixture.componentInstance.confirmTitle).toBe('Excluir lote');
    expect(fixture.componentInstance.confirmMessage).toContain('VIP');
    fixture.componentInstance.cancelDelete();

    fixture.componentInstance.addLote();
    fixture.componentInstance.lotes.at(1)?.patchValue({ id: 0, nome: '', preco: 1, quantidade: 1, dataIncio: '', dataFim: '', eventoId: 5 });
    fixture.componentInstance.askDeleteLote(1);
    expect(fixture.componentInstance.confirmMessage).toContain('este lote');
    fixture.componentInstance.cancelDelete();

    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.confirmTitle).toBe('Excluir rede social');
    expect(fixture.componentInstance.confirmMessage).toContain('Twitter');
    fixture.componentInstance.cancelDelete();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(1)?.patchValue({ id: 0, nome: '', url: 'https://x.com', eventoId: 5 });
    fixture.componentInstance.askDeleteRede(1);
    expect(fixture.componentInstance.confirmMessage).toContain('esta rede');
    fixture.componentInstance.cancelDelete();

    fixture.componentInstance.askDisassociate({ id: 2, nome: 'João' } as never);
    expect(fixture.componentInstance.confirmLabel).toBe('Desassociar');
    expect(fixture.componentInstance.confirmMessage).toContain('João');
  });

  it('clears imagemURL when commitUrl receives empty draft', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.openUrlEditor();
    fixture.componentInstance.urlDraft = '   ';
    fixture.componentInstance.commitUrl();

    expect(fixture.componentInstance.form.get('imagemURL')?.value).toBe('');
    expect(fixture.componentInstance.showUrlEditor).toBe(false);
  });

  it('marks preview image as failed on image error', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      imagemURL: 'https://example.com/photo.jpg',
    });
    fixture.componentInstance.onImageError();
    await vi.waitFor(() => {
      expect(fixture.componentInstance.showPreviewImage).toBe(false);
    });
  });

  it('shows tema maxlength validation message', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    const tema = fixture.componentInstance.form.get('tema');
    tema?.setValue('a'.repeat(51));
    tema?.markAsTouched();
    tema?.setErrors({ maxlength: true });
    expect(fixture.componentInstance.temaErrorMessage()).toContain('máximo 50');
  });

  it('saves new evento without lotes or redes', async () => {
    await configure(null);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      tema: 'Evento Simples',
      local: 'SP',
      dataEvento: '2026-01-15',
      qtdPessoas: 50,
      telefone: '11999999999',
      email: 'a@b.com',
    });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    req.flush({ ...baseEvento, id: 99, tema: 'Evento Simples' });
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/eventos', 99]);
  });

  it('shows qtd minimum validation message', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    const qtd = fixture.componentInstance.form.get('qtdPessoas');
    qtd?.setValue(0);
    qtd?.markAsTouched();
    qtd?.setErrors({ min: true });
    expect(fixture.componentInstance.qtdErrorMessage()).toContain('Mínimo');
  });

  it('does not open URL editor without write access', async () => {
    await configure(null, false);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.openUrlEditor();
    expect(fixture.componentInstance.showUrlEditor).toBe(false);
  });

  it('returns tema invalid fallback message', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    const tema = fixture.componentInstance.form.get('tema');
    tema?.setValue('bad');
    tema?.markAsTouched();
    tema?.setErrors({ custom: true });
    expect(fixture.componentInstance.temaErrorMessage()).toBe('Tema inválido.');
  });

  it('removes local rede without API and shows success', async () => {
    await configure('5');
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad();
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({ id: 0, nome: 'X', url: 'https://x.com' });
    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDelete();

    expect(fixture.componentInstance.redes.length).toBe(0);
    expect(fixture.componentInstance.success).toBe('Rede social removida.');
  });

  it('confirmDelete is noop when pending is null', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete();
    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('updates evento with redes only and fetches lotes fallback', async () => {
    await configure('5');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad();
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({
      id: 0,
      nome: 'R1',
      url: 'https://r.com',
      eventoId: 5,
    });
    fixture.componentInstance.save();

    httpMock.expectOne(`${environment.apiUrl}/eventos/5`).flush(baseEvento);
    httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/5`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/lotes/5`).flush([]);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/eventos', 5]);
  });

  it('ignores commitUrl when editor is closed', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ imagemURL: 'https://example.com/x.jpg' });
    fixture.componentInstance.commitUrl();
    expect(fixture.componentInstance.form.get('imagemURL')?.value).toBe(
      'https://example.com/x.jpg',
    );
  });

  it('does not disassociate on new evento', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.askDisassociate({ id: 1, nome: 'X' } as never);
    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('does not save when user cannot write', async () => {
    await configure(null, false);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ ...baseEvento, id: 0 });
    fixture.componentInstance.save();

    httpMock.expectNone(`${environment.apiUrl}/eventos`);
  });

  it('does not associate on new evento', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.associateId = 1;
    fixture.componentInstance.associateSelected();

    httpMock.expectNone((req) => req.url.includes('/palestrantes'));
  });

  it('deleteLoteAt is noop when lote index is missing', async () => {
    await configure('5');
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({ lotes: [] });
    await fixture.whenStable();

    (fixture.componentInstance as unknown as { deleteLoteAt: (i: number) => void }).deleteLoteAt(0);
    httpMock.expectNone((req) => req.method === 'DELETE');
  });

  it('deleteRedeAt is noop when rede index is missing', async () => {
    await configure('5');
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.detectChanges();
    flushEditLoad({ redes: [] });
    await fixture.whenStable();

    (fixture.componentInstance as unknown as { deleteRedeAt: (i: number) => void }).deleteRedeAt(0);
    httpMock.expectNone((req) => req.method === 'DELETE');
  });
});
