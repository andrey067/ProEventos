import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AccountService } from '../../../services/account.service';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { Funcao, UserProfile } from '../../../models';
import { apiErrorMessage } from '../../../shared/api-error-message';
import {
  alertAnimation,
  pageEnterAnimation,
  panelEnterAnimation,
} from '../../../shared/motion';
import {
  PerfilDetalheComponent,
  ProfileFormPreview,
} from './perfil-detalhe/perfil-detalhe.component';
import { PalestranteDetalheComponent } from './palestrante-detalhe/palestrante-detalhe.component';
import { RedesSociaisComponent } from './redes-sociais/redes-sociais.component';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

type ProfileTab = 'perfil' | 'palestrante' | 'rede-social';

@Component({
  selector: 'app-profile',
  imports: [
    LoadingSpinnerComponent,
    PerfilDetalheComponent,
    PalestranteDetalheComponent,
    RedesSociaisComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation],
})
export class ProfileComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);

  snapshot: UserProfile | null = null;
  cardView: Pick<UserProfile, 'primeiroNome' | 'ultimoNome' | 'descricao' | 'nome'> | null = null;
  ehPalestrante = false;
  activeTab: ProfileTab = 'perfil';
  loading = true;
  error: string | null = null;
  imgBroken = false;
  readonly placeholder = PLACEHOLDER;

  ngOnInit(): void {
    this.accountService.getProfile().subscribe({
      next: (p) => this.applySnapshot(p),
      error: (err) => {
        this.loading = false;
        this.error = apiErrorMessage(err, 'Erro ao carregar perfil.');
      },
    });
  }

  get photoSrc(): string {
    if (this.imgBroken || !this.snapshot?.imagemURL) return this.placeholder;
    return this.snapshot.imagemURL;
  }

  onImgError(): void {
    this.imgBroken = true;
  }

  applySnapshot(p: UserProfile): void {
    this.snapshot = p;
    this.cardView = {
      nome: p.nome,
      primeiroNome: p.primeiroNome,
      ultimoNome: p.ultimoNome,
      descricao: p.descricao,
    };
    this.ehPalestrante = p.funcao === 'Palestrante';
    this.loading = false;
    this.imgBroken = false;
    if (!this.ehPalestrante && this.activeTab !== 'perfil') {
      this.activeTab = 'perfil';
    }
  }

  onFormPreview(preview: ProfileFormPreview): void {
    queueMicrotask(() => {
      this.cardView = {
        nome: '',
        primeiroNome: preview.primeiroNome,
        ultimoNome: preview.ultimoNome,
        descricao: preview.descricao,
      };
      const was = this.ehPalestrante;
      this.ehPalestrante = preview.funcao === 'Palestrante';
      if (was && !this.ehPalestrante && this.activeTab !== 'perfil') {
        this.activeTab = 'perfil';
      }
      this.cdr.detectChanges();
    });
  }

  onPerfilSaved(p: UserProfile): void {
    this.applySnapshot(p);
  }

  onPerfilCancelled(): void {
    if (this.snapshot) this.applySnapshot(this.snapshot);
  }

  selectTab(tab: ProfileTab): void {
    if (tab !== 'perfil' && !this.ehPalestrante) return;
    this.activeTab = tab;
  }
}
