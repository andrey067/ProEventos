import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { PalestranteFormComponent } from './palestrante-form.component';
import { AuthTokenService } from '../../../services/auth-token.service';
import { environment } from '../../../../environments/environment';

const samplePalestrante = {
  id: 3,
  nome: 'Maria',
  miniCurriculo: 'Bio',
  imagemURL: 'https://cdn.test/photo.jpg',
  telefone: '11999999999',
  email: 'maria@example.com',
};

describe('PalestranteFormComponent', () => {
  let httpMock: HttpTestingController;

  async function configure(idParam: string | null, canWrite = true) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PalestranteFormComponent],
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

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('renders create form when id is new', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isNew).toBe(true);
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('loads palestrante and redes for edit', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([{ id: 1, nome: 'LinkedIn', url: 'https://linkedin.com', eventoId: 0 }]);
    await fixture.whenStable();

    expect(fixture.componentInstance.editingId).toBe(3);
    expect(fixture.componentInstance.form.get('nome')?.value).toBe('Maria');
    expect(fixture.componentInstance.redes.length).toBe(1);
    expect(fixture.componentInstance.showPreviewImage).toBe(true);
  });

  it('shows error for invalid id', async () => {
    await configure('abc');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error).toBe('Palestrante não encontrado.');
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('creates palestrante and navigates away', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      nome: 'Novo',
      miniCurriculo: 'Bio',
      telefone: '11',
      email: 'n@test.com',
      imagemURL: '',
    });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 8, ...fixture.componentInstance.form.getRawValue() });
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/palestrantes']);
    expect(fixture.componentInstance.success).toBe('Palestrante salvo.');
  });

  it('adds and removes local rede', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.addRede();
    expect(fixture.componentInstance.redes.length).toBe(1);

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();
    expect(fixture.componentInstance.redes.length).toBe(0);
  });

  it('disables form when user cannot write', async () => {
    await configure('new', false);
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.disabled).toBe(true);
    fixture.componentInstance.addRede();
    expect(fixture.componentInstance.redes.length).toBe(0);
  });

  it('handles preview image error', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      imagemURL: 'https://cdn.test/photo.jpg',
    });
    fixture.componentInstance.onPreviewError();
    await fixture.whenStable();
    expect(fixture.componentInstance.showPreviewImage).toBe(false);
  });

  it('updates palestrante and saves redes', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([]);
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ nome: 'Maria Atualizada' });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...samplePalestrante, nome: 'Maria Atualizada' });
    const redesReq = httpMock.expectOne(
      `${environment.apiUrl}/redes-sociais/palestrante/3`,
    );
    expect(redesReq.request.method).toBe('PUT');
    redesReq.flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.success).toBe('Palestrante salvo.');
  });

  it('shows error when load fails', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar o palestrante.');
  });

  it('shows error when redes load fails', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar redes sociais.');
  });

  it('deletes persisted rede via API', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([{ id: 5, nome: 'GitHub', url: 'https://github.com', eventoId: 0 }]);
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();

    const del = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3/5`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'Ok' });
    await fixture.whenStable();

    expect(fixture.componentInstance.redes.length).toBe(0);
    expect(fixture.componentInstance.success).toBe('Rede social excluída.');
  });

  it('cancelDeleteRede clears pending state', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.addRede();
    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.cancelDeleteRede();

    expect(fixture.componentInstance.pendingRedeDelete).toBeNull();
    expect(fixture.componentInstance.redes.length).toBe(1);
  });

  it('shows save error', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      nome: 'Novo',
      miniCurriculo: 'Bio',
      telefone: '11',
      email: 'n@test.com',
      imagemURL: '',
    });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes`);
    req.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao salvar palestrante.');
  });

  it('navigates back on cancel', async () => {
    await configure('new');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.cancel();
    expect(navigateSpy).toHaveBeenCalledWith(['/palestrantes']);
  });

  it('shows error when rede save fails after update', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([]);
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({
      id: 0,
      nome: 'LinkedIn',
      url: 'https://linkedin.com/in/maria',
    });
    fixture.componentInstance.save();

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`);
    req.flush(samplePalestrante);
    const redesReq = httpMock.expectOne(
      `${environment.apiUrl}/redes-sociais/palestrante/3`,
    );
    redesReq.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe(
      'Palestrante salvo, mas houve erro ao salvar redes.',
    );
  });

  it('shows error when persisted rede delete fails', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([{ id: 5, nome: 'GitHub', url: 'https://github.com', eventoId: 0 }]);
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();

    const del = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3/5`);
    del.error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao excluir rede social.');
  });

  it('exposes deleteRedeMessage for pending rede delete', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([{ id: 5, nome: 'GitHub', url: 'https://github.com', eventoId: 0 }]);
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.deleteRedeMessage).toContain('GitHub');
    fixture.componentInstance.cancelDeleteRede();
    expect(fixture.componentInstance.deleteRedeMessage).toBe('');
  });

  it('marks preview image as failed on preview error', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock
      .expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`)
      .flush([]);
    await fixture.whenStable();

    fixture.componentInstance.onPreviewError();
    await vi.waitFor(() => {
      expect(fixture.componentInstance.showPreviewImage).toBe(false);
    });
  });

  it('does not save when form is invalid', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ nome: '' });
    fixture.componentInstance.save();

    httpMock.expectNone(`${environment.apiUrl}/palestrantes`);
  });

  it('shows load error when getById fails', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/palestrantes/3`)
      .error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar o palestrante.');
  });

  it('uses fallback label in deleteRedeMessage when nome is blank', async () => {
    await configure('3');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/palestrantes/3`).flush(samplePalestrante);
    httpMock.expectOne(`${environment.apiUrl}/redes-sociais/palestrante/3`).flush([]);
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({ id: 0, nome: '', url: '' });
    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.deleteRedeMessage).toContain('esta rede');
  });

  it('confirmDeleteRede is noop when pending is null', async () => {
    await configure('new');
    const fixture = TestBed.createComponent(PalestranteFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.confirmDeleteRede();
    expect(fixture.componentInstance.pendingRedeDelete).toBeNull();
  });
});
