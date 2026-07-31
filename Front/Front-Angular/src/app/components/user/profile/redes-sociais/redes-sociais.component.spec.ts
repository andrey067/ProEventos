import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
});
