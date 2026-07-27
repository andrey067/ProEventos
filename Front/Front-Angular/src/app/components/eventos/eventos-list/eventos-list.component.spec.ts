import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EventosListComponent } from './eventos-list.component';
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

describe('EventosListComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventosListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
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

    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([sampleEvento]);
    await flushView(fixture);

    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.eventos[0]?.tema).toBe('Angular Day');
  });

  it('shows empty state when no eventos', async () => {
    const fixture = createComponent();

    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([]);
    await flushView(fixture);

    expect(fixture.componentInstance.eventos).toEqual([]);
  });

  it('shows error when load fails', async () => {
    const fixture = createComponent();

    httpMock.expectOne(`${environment.apiUrl}/eventos`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar os eventos.');
  });

  it('searches by tema on submit', async () => {
    const fixture = createComponent();
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([]);

    fixture.componentInstance.searchForm.patchValue({ tema: 'angular' });
    fixture.componentInstance.search();

    httpMock.expectOne(`${environment.apiUrl}/eventos/tema/angular`).flush([sampleEvento]);
    await fixture.whenStable();

    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
  });

  it('clears search and reloads all eventos', async () => {
    const fixture = createComponent();
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([]);

    fixture.componentInstance.searchForm.patchValue({ tema: 'x' });
    fixture.componentInstance.clearSearch();

    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([sampleEvento]);
    await fixture.whenStable();

    expect(fixture.componentInstance.tema).toBe('');
    expect(fixture.componentInstance.eventos).toEqual([sampleEvento]);
  });

  it('deletes evento when confirmed', async () => {
    const fixture = createComponent();
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    expect(fixture.componentInstance.pendingDelete).toEqual(sampleEvento);

    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/eventos/1`).flush({ message: 'Ok' });
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
  });

  it('does not delete when confirm is cancelled', async () => {
    const fixture = createComponent();
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    fixture.componentInstance.cancelDelete();

    expect(fixture.componentInstance.pendingDelete).toBeNull();
    httpMock.expectNone(`${environment.apiUrl}/eventos/1`);
  });

  it('alerts on delete error', async () => {
    const fixture = createComponent();
    httpMock.expectOne(`${environment.apiUrl}/eventos`).flush([sampleEvento]);
    await fixture.whenStable();

    fixture.componentInstance.askDelete(sampleEvento);
    fixture.componentInstance.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/eventos/1`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(window.alert).toHaveBeenCalledWith('Erro ao deletar evento.');
  });
});
