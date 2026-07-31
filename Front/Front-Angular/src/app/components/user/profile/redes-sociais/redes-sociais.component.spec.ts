import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RedeSocialService } from '../../../../services/rede-social.service';
import { RedesSociaisComponent } from './redes-sociais.component';

describe('RedesSociaisComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [RedesSociaisComponent],
      providers: [
        {
          provide: RedeSocialService,
          useValue: {
            getMine: vi.fn(),
            saveMine: vi.fn(),
            deleteMine: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }

  it('loads and saves redes', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 1, nome: 'GitHub', url: 'https://github.com/me' }]),
    );
    vi.mocked(redeSocialService.saveMine).mockReturnValue(
      of([{ id: 1, nome: 'GitHub', url: 'https://github.com/updated' }]),
    );

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(redeSocialService.getMine).toHaveBeenCalled();
    expect(fixture.componentInstance.redes.length).toBe(1);

    fixture.componentInstance.redes.at(0)?.patchValue({
      url: 'https://github.com/updated',
    });
    fixture.componentInstance.saveRedes();
    await fixture.whenStable();

    expect(redeSocialService.saveMine).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          nome: 'GitHub',
          url: 'https://github.com/updated',
        }),
      ]),
    );
    expect(fixture.componentInstance.success).toBe('Redes sociais salvas com sucesso.');
  });

  it('deletes persisted rede via deleteMine after confirmation', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 5, nome: 'LinkedIn', url: 'https://linkedin.com/in/me' }]),
    );
    vi.mocked(redeSocialService.deleteMine).mockReturnValue(of({ message: 'Removida' }));

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.deleteRedeMessage).toContain('LinkedIn');
    fixture.componentInstance.confirmDeleteRede();
    await fixture.whenStable();

    expect(redeSocialService.deleteMine).toHaveBeenCalledWith(5);
    expect(fixture.componentInstance.redes.length).toBe(0);
  });

  it('shows error when load fails', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar redes sociais.');
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('shows error when save fails', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 1, nome: 'GitHub', url: 'https://github.com/me' }]),
    );
    vi.mocked(redeSocialService.saveMine).mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'rede inválida' },
          }),
      ),
    );

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.saveRedes();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('rede inválida');
    expect(fixture.componentInstance.saving).toBe(false);
  });

  it('does not save when form is invalid', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(of([]));

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.saveRedes();
    expect(redeSocialService.saveMine).not.toHaveBeenCalled();
  });

  it('removes unpersisted rede locally without API', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(of([]));

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.addRede();
    fixture.componentInstance.redes.at(0)?.patchValue({
      nome: 'Temp',
      url: 'https://temp.dev',
    });
    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();

    expect(redeSocialService.deleteMine).not.toHaveBeenCalled();
    expect(fixture.componentInstance.redes.length).toBe(0);
    expect(fixture.componentInstance.success).toBe('Rede social removida.');
  });

  it('shows delete error and cancel clears pending', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 5, nome: 'X', url: 'https://x.com' }]),
    );
    vi.mocked(redeSocialService.deleteMine).mockReturnValue(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.deleteRedeMessage).toContain('X');
    fixture.componentInstance.cancelDeleteRede();
    expect(fixture.componentInstance.pendingRedeDelete).toBeNull();
    expect(fixture.componentInstance.deleteRedeMessage).toBe('');

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();
    await fixture.whenStable();
    expect(fixture.componentInstance.error).toBe('Erro ao excluir rede social.');
  });

  it('uses fallback name and no-ops confirm/delete edge cases', async () => {
    await setup();
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 1, nome: '', url: 'https://x.com' }]),
    );

    const fixture = TestBed.createComponent(RedesSociaisComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    expect(fixture.componentInstance.deleteRedeMessage).toContain('esta rede');

    fixture.componentInstance.pendingRedeDelete = null;
    fixture.componentInstance.confirmDeleteRede();
    expect(redeSocialService.deleteMine).not.toHaveBeenCalled();

    fixture.componentInstance.askDeleteRede(99);
    fixture.componentInstance.confirmDeleteRede();
    expect(redeSocialService.deleteMine).not.toHaveBeenCalled();
  });
});
