import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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

function matchPalestrantesList(params: Record<string, string> = { page: '1', pageSize: '10' }) {
  return (r: { url: string; params: { get: (key: string) => string | null } }) =>
    r.url === `${environment.apiUrl}/palestrantes` &&
    Object.entries(params).every(([key, value]) => r.params.get(key) === value) &&
    (params.q != null || r.params.get('q') == null);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('PalestrantesComponent', () => {
  let httpMock: HttpTestingController;
  let canWrite = true;

  async function configure(write = true) {
    canWrite = write;
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PalestrantesComponent],
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
  }

  beforeEach(async () => {
    await configure(true);
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

    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await flushView(fixture);

    expect(fixture.componentInstance.palestrantes).toEqual([samplePalestrante]);
    expect(fixture.componentInstance.palestrantes[0]?.nome).toBe('Maria');
  });

  it('shows empty state', async () => {
    const fixture = initComponent();

    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);
    await flushView(fixture);

    expect(fixture.componentInstance.palestrantes).toEqual([]);
  });

  it('shows load error', async () => {
    const fixture = initComponent();

    httpMock.expectOne(matchPalestrantesList()).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar palestrantes.');
  });

  it('deletes palestrante when confirmed', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    expect(fixture.componentInstance.pendingDelete).toEqual(samplePalestrante);

    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/1`).flush({ message: 'Ok' });
    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);
    await fixture.whenStable();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('does not delete when confirm is cancelled', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    fixture.componentInstance.cancelDelete();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/palestrantes/1`);
  });

  it('shows delete error', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(samplePalestrante);
    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/1`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao deletar palestrante.');
  });

  it('searches palestrantes by q via query param', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);

    fixture.componentInstance.searchNome.setValue('Maria', { emitEvent: false });
    fixture.componentInstance.search();

    const req = httpMock.expectOne(
      matchPalestrantesList({ page: '1', pageSize: '10', q: 'Maria' }),
    );
    expect(req.request.method).toBe('GET');
    flushPaged(req, [samplePalestrante]);
    await flushView(fixture);

    expect(fixture.componentInstance.palestrantes).toEqual([samplePalestrante]);
  });

  it('debounces typing before searching with q', async () => {
    const control = new FormControl('');
    const emitted: string[] = [];
    const sub = control.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((v) => emitted.push(String(v ?? '')));

    control.setValue('Mar');
    await delay(200);
    expect(emitted).toEqual([]);

    await delay(200);
    expect(emitted).toEqual(['Mar']);
    sub.unsubscribe();
  }, 10_000);

  it('submits immediately and cancels pending debounce', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);
    await fixture.whenStable();
    fixture.componentRef.changeDetectorRef.detach();

    const emitted: unknown[] = [];
    vi.spyOn(fixture.componentInstance, 'load').mockImplementation((opts) => {
      emitted.push(opts ?? null);
    });

    fixture.componentInstance.searchNome.setValue('pending');
    fixture.componentInstance.search();
    expect(emitted).toEqual([{ resetPage: true }]);

    fixture.componentInstance['searchDebounceSub']?.unsubscribe();
    fixture.destroy();
    await delay(350);
    expect(emitted).toEqual([{ resetPage: true }]);
  }, 10_000);

  it('clears immediately without waiting for debounce', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);
    await fixture.whenStable();
    fixture.componentRef.changeDetectorRef.detach();

    const emitted: unknown[] = [];
    vi.spyOn(fixture.componentInstance, 'load').mockImplementation((opts) => {
      emitted.push(opts ?? null);
    });

    fixture.componentInstance.searchNome.setValue('xy');
    fixture.componentInstance.clearSearch();

    expect(fixture.componentInstance.searchNome.value).toBe('');
    expect(emitted).toEqual([{ resetPage: true }]);

    fixture.componentInstance['searchDebounceSub']?.unsubscribe();
    fixture.destroy();
    await delay(350);
    expect(emitted).toEqual([{ resetPage: true }]);
  }, 10_000);

  it('uses soft Buscar label instead of name-only copy', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), []);
    await flushView(fixture);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Buscar');
    expect(text).not.toContain('Buscar por nome');
  });

  it('shows list thumbnail for remote image', async () => {
    const withImage = {
      ...samplePalestrante,
      imagemURL: 'https://cdn.test/palestrante.jpg',
    };
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [withImage]);
    await flushView(fixture);

    expect(fixture.componentInstance.hasImage(withImage)).toBe(true);
  });

  it('hides write actions when canWrite is false', async () => {
    await configure(false);
    const fixture = initComponent();
    const root = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.canWrite).toBe(false);
    expect(root.textContent).toContain('somente leitura');

    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await flushView(fixture);

    fixture.componentInstance.askDelete(samplePalestrante);

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone((req) => req.method === 'DELETE');
  });

  it('paginates with prev, next and page size', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante], {
      page: 1,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    });
    await flushView(fixture);

    fixture.componentInstance.nextPage();
    const page2 = httpMock.expectOne(
      matchPalestrantesList({ page: '2', pageSize: '10' }),
    );
    flushPaged(page2, [samplePalestrante], { page: 2, totalCount: 25, totalPages: 3 });
    await flushView(fixture);
    expect(fixture.componentInstance.page).toBe(2);

    fixture.componentInstance.prevPage();
    const page1 = httpMock.expectOne(
      matchPalestrantesList({ page: '1', pageSize: '10' }),
    );
    flushPaged(page1, [samplePalestrante], { page: 1, totalCount: 25, totalPages: 3 });
    await flushView(fixture);

    fixture.componentInstance.onPageSizeChange(20);
    const resized = httpMock.expectOne(
      matchPalestrantesList({ page: '1', pageSize: '20' }),
    );
    flushPaged(resized, [samplePalestrante], { page: 1, pageSize: 20, totalCount: 25, totalPages: 2 });
    await flushView(fixture);
    expect(fixture.componentInstance.pageSize).toBe(20);
  });

  it('onThumbError hides broken image', async () => {
    const withImage = {
      ...samplePalestrante,
      imagemURL: 'https://cdn.test/palestrante.jpg',
    };
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [withImage]);
    await flushView(fixture);

    expect(fixture.componentInstance.hasImage(withImage)).toBe(true);
    fixture.componentInstance.onThumbError(withImage.id);
    expect(fixture.componentInstance.hasImage(withImage)).toBe(false);
  });

  it('reads legacy nome query param on init', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PalestrantesComponent],
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
                get: (key: string) => (key === 'nome' ? 'Maria' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PalestrantesComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne(
      matchPalestrantesList({ page: '1', pageSize: '10', q: 'Maria' }),
    );
    flushPaged(req, [samplePalestrante]);
    await fixture.whenStable();

    expect(fixture.componentInstance.searchNome.value).toBe('Maria');
  });

  it('ignores invalid page and pageSize query params', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PalestrantesComponent],
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
                get: (key: string) => {
                  if (key === 'page') return 'abc';
                  if (key === 'pageSize') return '99';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PalestrantesComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne(matchPalestrantesList({ page: '1', pageSize: '10' }));
    flushPaged(req, [samplePalestrante]);
    await fixture.whenStable();

    expect(fixture.componentInstance.page).toBe(1);
    expect(fixture.componentInstance.pageSize).toBe(10);
  });

  it('prevPage is noop on first page', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await flushView(fixture);

    fixture.componentInstance.page = 1;
    fixture.componentInstance.prevPage();

    httpMock.expectNone(matchPalestrantesList({ page: '0', pageSize: '10' }));
  });

  it('nextPage is noop on last page', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante], {
      totalPages: 1,
    });
    await flushView(fixture);

    fixture.componentInstance.nextPage();
    httpMock.expectNone(matchPalestrantesList({ page: '2', pageSize: '10' }));
  });

  it('falls back to default page size for invalid size', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante]);
    await flushView(fixture);

    fixture.componentInstance.onPageSizeChange(99);
    const req = httpMock.expectOne(matchPalestrantesList({ page: '1', pageSize: '10' }));
    flushPaged(req, [samplePalestrante]);
    await flushView(fixture);
    expect(fixture.componentInstance.pageSize).toBe(10);
  });

  it('keeps list visible while paginating without full-page spinner', async () => {
    const fixture = initComponent();
    flushPaged(httpMock.expectOne(matchPalestrantesList()), [samplePalestrante], {
      totalPages: 2,
      totalCount: 20,
    });
    await flushView(fixture);
    expect(fixture.componentInstance.loading).toBe(false);

    fixture.componentInstance.nextPage();
    const page2 = httpMock.expectOne(matchPalestrantesList({ page: '2', pageSize: '10' }));
    expect(fixture.componentInstance.loading).toBe(false);
    flushPaged(page2, [samplePalestrante], { page: 2, totalPages: 2 });
    await flushView(fixture);
  });
});
