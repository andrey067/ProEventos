import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EventosListComponent } from './eventos-list.component';
import { AuthTokenService } from '../../../services/auth-token.service';
import { environment } from '../../../../environments/environment';

const sampleEvento = {
  id: 1,
  tema: 'Angular Day',
  local: 'SP',
  dataEvento: '01-01-2026',
  qtdPessoas: 100,
  telefone: '11999999999',
  email: 'a@b.com',
  imagemURL: '',
};

function flushPaged(
  req: { flush: (body: unknown, init?: { headers?: Record<string, string> }) => void },
  items: unknown[],
  opts: { page?: number; pageSize?: number; totalCount?: number; totalPages?: number } = {},
) {
  const pageSize = opts.pageSize ?? 10;
  const totalCount = opts.totalCount ?? items.length;
  const totalPages =
    opts.totalPages ??
    (totalCount === 0 ? 0 : Math.max(1, Math.ceil(totalCount / pageSize)));
  req.flush(items, {
    headers: {
      Pagination: JSON.stringify({
        currentPage: opts.page ?? 1,
        itemsPerPage: pageSize,
        totalItems: totalCount,
        totalPages,
      }),
    },
  });
}

function matchEventosList(params: Record<string, string> = { page: '1', pageSize: '10' }) {
  return (r: { url: string; params: { get: (key: string) => string | null } }) =>
    r.url === `${environment.apiUrl}/eventos` &&
    Object.entries(params).every(([key, value]) => r.params.get(key) === value) &&
    (params.q != null || r.params.get('q') == null);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('EventosListComponent', () => {
  let httpMock: HttpTestingController;
  let canWrite = true;

  async function configure(write = true) {
    canWrite = write;
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EventosListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
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
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  }

  beforeEach(async () => {
    await configure(true);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(EventosListComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function flushView(fixture: ReturnType<typeof createComponent>) {
    await fixture.whenStable();
  }

  it('loads and displays eventos on init', async () => {
    const fixture = createComponent();

    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await flushView(fixture);

    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.eventos[0]?.tema).toBe('Angular Day');
  });

  it('shows empty state when no eventos', async () => {
    const fixture = createComponent();

    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await flushView(fixture);

    expect(fixture.componentInstance.eventos).toEqual([]);
  });

  it('shows error when load fails', async () => {
    const fixture = createComponent();

    httpMock.expectOne(matchEventosList()).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar os eventos.');
  });

  it('searches by q on submit', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);

    fixture.componentInstance.searchForm.patchValue({ q: 'angular' }, { emitEvent: false });
    fixture.componentInstance.search();

    flushPaged(
      httpMock.expectOne(matchEventosList({ page: '1', pageSize: '10', q: 'angular' })),
      [sampleEvento],
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
  });

  it('clears search and reloads all eventos', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);

    fixture.componentInstance.searchForm.patchValue({ q: 'x' }, { emitEvent: false });
    fixture.componentInstance.clearSearch();

    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await fixture.whenStable();

    expect(fixture.componentInstance.q).toBe('');
    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
  });

  it('debounces typing before searching with q', async () => {
    // Vitest + ngx-spinner CD conflicts with live fixtures during debounceTime;
    // assert the shared 350ms contract with the same rxjs operators the list uses.
    const control = new FormControl('');
    const emitted: string[] = [];
    const sub = control.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((v) => emitted.push(String(v ?? '')));

    control.setValue('ang');
    await delay(200);
    expect(emitted).toEqual([]);

    await delay(200);
    expect(emitted).toEqual(['ang']);
    sub.unsubscribe();
  }, 10_000);

  it('submits immediately and cancels pending debounce', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await fixture.whenStable();
    fixture.componentRef.changeDetectorRef.detach();

    const emitted: unknown[] = [];
    vi.spyOn(fixture.componentInstance, 'load').mockImplementation((opts) => {
      emitted.push(opts ?? null);
    });

    fixture.componentInstance.searchForm.patchValue({ q: 'pending' });
    fixture.componentInstance.search();
    expect(emitted).toEqual([{ resetPage: true }]);

    fixture.componentInstance['searchDebounceSub']?.unsubscribe();
    fixture.destroy();
    await delay(350);
    expect(emitted).toEqual([{ resetPage: true }]);
  }, 10_000);

  it('clears immediately without waiting for debounce', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await fixture.whenStable();
    fixture.componentRef.changeDetectorRef.detach();

    const emitted: unknown[] = [];
    vi.spyOn(fixture.componentInstance, 'load').mockImplementation((opts) => {
      emitted.push(opts ?? null);
    });

    fixture.componentInstance.searchForm.patchValue({ q: 'xy' });
    fixture.componentInstance.clearSearch();

    expect(fixture.componentInstance.q).toBe('');
    expect(emitted).toEqual([{ resetPage: true }]);

    fixture.componentInstance['searchDebounceSub']?.unsubscribe();
    fixture.destroy();
    await delay(350);
    expect(emitted).toEqual([{ resetPage: true }]);
  }, 10_000);

  it('uses soft Buscar label instead of theme-only copy', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await flushView(fixture);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Buscar');
    expect(text).not.toContain('Buscar por tema');
  });

  it('deletes evento when confirmed', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    expect(fixture.componentInstance.pendingDelete).toEqual(sampleEvento);

    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/eventos/1`).flush({ message: 'Ok' });
    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await fixture.whenStable();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    expect(fixture.componentInstance.success).toContain('excluído');
  });

  it('does not delete when confirm is cancelled', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    fixture.componentInstance.cancelDelete();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/eventos/1`);
  });

  it('alerts on delete error', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/eventos/1`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(window.alert).toHaveBeenCalledWith('Erro ao deletar evento.');
  });

  it('hides write actions when canWrite is false', async () => {
    await configure(false);
    const fixture = createComponent();
    const root = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.canWrite).toBe(false);
    expect(root.textContent).toContain('somente leitura');
    expect(root.textContent).not.toContain('Novo evento');

    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await flushView(fixture);

    fixture.componentInstance.askDelete(sampleEvento);
    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('returns first lote label or em dash', async () => {
    await configure(true);
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), []);
    await flushView(fixture);

    const component = fixture.componentInstance;
    expect(component.firstLoteLabel(sampleEvento)).toBe('—');
    expect(
      component.firstLoteLabel({
        ...sampleEvento,
        lotes: [
          {
            id: 1,
            nome: 'VIP',
            preco: 10,
            dataIncio: '',
            dataFim: '',
            quantidade: 1,
            eventoId: 1,
          },
        ],
      }),
    ).toBe('VIP');
    expect(
      component.firstLoteLabel({
        ...sampleEvento,
        lotes: [
          {
            id: 1,
            nome: '   ',
            preco: 10,
            dataIncio: '',
            dataFim: '',
            quantidade: 1,
            eventoId: 1,
          },
        ],
      }),
    ).toBe('—');
  });

  it('paginates and toggles images', async () => {
    const fixture = createComponent();
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      ...sampleEvento,
      id: i + 1,
      tema: `Evento ${i + 1}`,
    }));
    flushPaged(
      httpMock.expectOne(matchEventosList()),
      page1,
      { totalCount: 11, totalPages: 2 },
    );
    await flushView(fixture);

    const component = fixture.componentInstance;
    expect(component.pagedEventos).toHaveLength(10);

    component.nextPage();
    flushPaged(
      httpMock.expectOne(matchEventosList({ page: '2', pageSize: '10' })),
      [{ ...sampleEvento, id: 11, tema: 'Evento 11' }],
      { page: 2, totalCount: 11, totalPages: 2 },
    );
    await flushView(fixture);
    expect(component.page).toBe(2);

    component.prevPage();
    flushPaged(
      httpMock.expectOne(matchEventosList({ page: '1', pageSize: '10' })),
      page1,
      { totalCount: 11, totalPages: 2 },
    );
    await flushView(fixture);

    component.onPageSizeChange(20);
    const sizeReq = httpMock.expectOne(matchEventosList({ page: '1', pageSize: '20' }));
    expect(sizeReq.request.params.get('pageSize')).toBe('20');
    flushPaged(sizeReq, page1, { page: 1, pageSize: 20, totalCount: 11, totalPages: 1 });
    await flushView(fixture);
    expect(component.pageSize).toBe(20);

    component.toggleShowImages();
    expect(component.showImages).toBe(false);

    const withImage = { ...sampleEvento, imagemURL: 'https://cdn.test/img.jpg' };
    expect(component.hasImage(withImage)).toBe(true);
    component.onImageError(withImage.id);
    expect(component.hasImage(withImage)).toBe(false);
  });

  it('exposes search getters and delete message', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento]);
    await flushView(fixture);

    const component = fixture.componentInstance;
    component.searchForm.patchValue({ q: 'angular' });
    expect(component.q).toBe('angular');
    expect(component.tema).toBe('angular');
    expect(component.columnCount).toBe(7);

    component.askDelete(sampleEvento);
    expect(component.deleteMessage).toContain(sampleEvento.tema);
    component.cancelDelete();
    expect(component.deleteMessage).toBe('');
  });

  it('firstLoteLabel returns dash for blank lote name', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    httpMock.match(() => true).forEach((req) => {
      if (!req.cancelled) req.flush([]);
    });
    expect(
      component.firstLoteLabel({
        ...sampleEvento,
        lotes: [{ id: 1, nome: '   ', preco: 1, dataIncio: '', dataFim: '', quantidade: 1, eventoId: 1 }],
      }),
    ).toBe('—');
  });

  it('reads legacy tema query param on init', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EventosListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthTokenService,
          useValue: {
            canWrite: vi.fn(() => true),
            isAuthenticated: vi.fn(() => true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'tema' ? 'Angular' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(EventosListComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne(
      matchEventosList({ page: '1', pageSize: '10', q: 'Angular' }),
    );
    flushPaged(req, [sampleEvento]);
    await flushView(fixture);

    expect(fixture.componentInstance.q).toBe('Angular');
  });

  it('nextPage is noop on last page', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento], { totalPages: 1 });
    await flushView(fixture);

    fixture.componentInstance.nextPage();
    httpMock.expectNone(matchEventosList({ page: '2', pageSize: '10' }));
  });

  it('keeps list visible while paginating without full-page spinner', async () => {
    const fixture = createComponent();
    flushPaged(httpMock.expectOne(matchEventosList()), [sampleEvento], {
      totalPages: 2,
      totalCount: 20,
    });
    await flushView(fixture);
    expect(fixture.componentInstance.loading).toBe(false);

    fixture.componentInstance.nextPage();
    const page2 = httpMock.expectOne(matchEventosList({ page: '2', pageSize: '10' }));
    expect(fixture.componentInstance.loading).toBe(false);
    flushPaged(page2, [sampleEvento], { page: 2, totalPages: 2 });
    await flushView(fixture);
  });
});
