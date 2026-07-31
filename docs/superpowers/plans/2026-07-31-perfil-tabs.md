# Perfil Tabs + Card Mirror (3 fronts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the profile page on Angular, Vue, and React into Perfil / Palestrante / Rede Social tabs with live card mirroring of nome/descrição and isolated saves per tab.

**Architecture:** Parent page keeps card (`snapshot` + `cardView`) and semantic tabset; each tab is a child component with its own form and save. Tab Perfil emits `{ primeiroNome, ultimoNome, descricao, funcao }` on every change. Tabs Palestrante and Rede Social appear only when `funcao === 'Palestrante'`. Palestrante tab loads via new `getMe()` → `GET /palestrantes/me` and saves via existing `update(id, …)`.

**Tech Stack:** Angular standalone + Reactive Forms + Vitest; Vue 3 + vee-validate/Zod + Vitest; React + RHF/Zod + Vitest/RTL; existing Tailwind design tokens (`border-line`, `accent`, `bg-panel`); no new tab library.

## Global Constraints

- No new backend endpoints or migrations — reuse `GET /palestrantes/me`, `PUT /palestrantes/{id}`, self-scoped redes APIs.
- No new UI tab dependency (ngx-bootstrap Tabs, Headless UI tabs, etc.).
- No multipart image upload — keep `imagemURL` as text.
- Live card mirror only for Perfil fields (`primeiroNome`, `ultimoNome`, `descricao`) — not palestrante/redes.
- Explicit Save buttons only (no auto-save / debounce of minicurrículo).
- Do not change dedicated change-password routes (`/perfil/senha`, redirects that already point to perfil).
- Do not put profile palestrante child under `palestrantes/` CRUD folder — keep under `user/profile` | `user/perfil` | `user/`.
- Show extra tabs as soon as form `funcao === 'Palestrante'` (before save).
- 404 on `getMe`: show exactly `Salve o perfil com função Palestrante primeiro`.
- Tab labels (PT): **Perfil** | **Palestrante** | **Rede Social**.
- Copy/parity reference: `docs/superpowers/specs/2026-07-31-perfil-tabs-design.md` and `specs/018-rede-social-palestrante-parity/depara.md`.

---

## File Structure

### Shared contract (all fronts)

```ts
/** Emitted by Tab Perfil → parent for card + ehPalestrante */
type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: 'Participante' | 'Palestrante' | string; // use local Funcao type
};
```

### Angular (`Front/Front-Angular/`)

| Path | Responsibility |
|------|----------------|
| `src/app/services/palestrante.service.ts` | Add `getMe()` |
| `src/app/services/palestrante.service.spec.ts` | Test `GET …/me` |
| `src/app/components/user/profile/profile.component.{ts,html,spec.ts}` | Orchestrator: card + tabset + `snapshot`/`cardView`/`activeTab`/`ehPalestrante` |
| `src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.{ts,html,spec.ts}` | Tab Perfil form + senha + emit preview + save/cancel |
| `src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.{ts,html,spec.ts}` | Tab Palestrante: getMe + update |
| `src/app/components/user/profile/redes-sociais/redes-sociais.component.{ts,html,spec.ts}` | Tab Rede Social: getMine/saveMine/deleteMine |

### Vue (`Front/Front-Vue/`)

| Path | Responsibility |
|------|----------------|
| `src/services/palestranteService.ts` (+ `.spec.ts`) | Add `getMe` |
| `src/components/user/perfil/PerfilUsuario.vue` (+ `.spec.ts`) | Orchestrator |
| `src/components/user/perfil/PerfilDetalhe.vue` (+ `.spec.ts`) | Tab Perfil |
| `src/components/user/perfil/PalestranteDetalhe.vue` (+ `.spec.ts`) | Tab Palestrante |
| `src/components/user/perfil/RedesSociais.vue` (+ `.spec.ts`) | Tab Rede Social |

### React (`Front/Front-React/`)

| Path | Responsibility |
|------|----------------|
| `src/services/palestranteService.ts` (+ `.test.ts`) | Add `getMe` |
| `src/components/user/ProfilePage.tsx` (+ `.test.tsx`) | Orchestrator |
| `src/components/user/PerfilDetalhe.tsx` (+ `.test.tsx`) | Tab Perfil |
| `src/components/user/PalestranteDetalhe.tsx` (+ `.test.tsx`) | Tab Palestrante |
| `src/components/user/RedesSociais.tsx` (+ `.test.tsx`) | Tab Rede Social |

### Reuse (do not recreate)

- Angular: `createRedeGroup`, `createPalestranteForm` / `patchPalestranteForm`, `AccountService`, `RedeSocialService`, `ConfirmDialogComponent`
- Vue: `redeSocialFormSchema`, `palestranteSchema`, `accountService`, `redeSocialService`, `ConfirmDialog`
- React: `redeSocialSchema`, `palestranteSchema`, `accountService`, `redeSocialService`, `ConfirmDialog`, `HttpError`

---

### Task 1: `getMe` on all three PalestranteServices

**Files:**
- Modify: `Front/Front-Angular/src/app/services/palestrante.service.ts`
- Modify: `Front/Front-Angular/src/app/services/palestrante.service.spec.ts`
- Modify: `Front/Front-Vue/src/services/palestranteService.ts`
- Modify: `Front/Front-Vue/src/services/palestranteService.spec.ts`
- Modify: `Front/Front-React/src/services/palestranteService.ts`
- Modify: `Front/Front-React/src/services/palestranteService.test.ts`

**Interfaces:**
- Consumes: existing HTTP clients / `baseUrl`
- Produces:
  - Angular: `getMe(): Observable<Palestrante>` → `GET {apiUrl}/palestrantes/me`
  - Vue: `getMe: () => http.get<Palestrante>("/palestrantes/me")`
  - React: `getMe(): Promise<Palestrante>` → `http<Palestrante>("/palestrantes/me")`

- [ ] **Step 1: Write failing Angular service test**

Add inside `describe('PalestranteService', …)` in `palestrante.service.spec.ts`:

```ts
  it('should fetch current user palestrante via getMe', () => {
    const mock = {
      id: 9,
      nome: 'Eu',
      miniCurriculo: 'Bio',
      imagemURL: '',
      telefone: '11',
      email: 'eu@x.com',
    };

    service.getMe().subscribe((data) => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
```

- [ ] **Step 2: Run Angular test — expect fail**

Run: `cd Front/Front-Angular && pnpm exec vitest run src/app/services/palestrante.service.spec.ts -t "getMe"`

Expected: FAIL (`getMe is not a function` / property missing).

- [ ] **Step 3: Implement Angular `getMe`**

In `palestrante.service.ts`, after `getById`:

```ts
  getMe(): Observable<Palestrante> {
    return this.http.get<Palestrante>(`${this.baseUrl}/me`);
  }
```

- [ ] **Step 4: Write failing Vue service test**

In `palestranteService.spec.ts`:

```ts
  it("getMe calls GET /palestrantes/me", async () => {
    (http.get as any).mockResolvedValue({ data: { id: 1, nome: "Eu" } });
    await palestranteService.getMe();
    expect(http.get).toHaveBeenCalledWith("/palestrantes/me");
  });
```

- [ ] **Step 5: Implement Vue `getMe`**

In `palestranteService` object, after `getById`:

```ts
  getMe: () => http.get<Palestrante>("/palestrantes/me"),
```

- [ ] **Step 6: Write failing React service test**

In `palestranteService.test.ts` (mirror `getById` pattern):

```ts
  it("busca palestrante do usuário logado via getMe", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPalestrante,
    } as Response);

    const result = await palestranteService.getMe();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes/me",
      expect.any(Object),
    );
    expect(result).toEqual(mockPalestrante);
  });
```

- [ ] **Step 7: Implement React `getMe`**

After `getById` in `palestranteService.ts`:

```ts
  getMe(): Promise<Palestrante> {
    return http<Palestrante>("/palestrantes/me");
  },
```

- [ ] **Step 8: Run all three service suites — expect pass**

```bash
cd Front/Front-Angular && pnpm exec vitest run src/app/services/palestrante.service.spec.ts
cd Front/Front-Vue && pnpm exec vitest run src/services/palestranteService.spec.ts
cd Front/Front-React && pnpm exec vitest run src/services/palestranteService.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add Front/Front-Angular/src/app/services/palestrante.service.ts \
  Front/Front-Angular/src/app/services/palestrante.service.spec.ts \
  Front/Front-Vue/src/services/palestranteService.ts \
  Front/Front-Vue/src/services/palestranteService.spec.ts \
  Front/Front-React/src/services/palestranteService.ts \
  Front/Front-React/src/services/palestranteService.test.ts
git commit -m "$(cat <<'EOF'
feat(fronts): add PalestranteService.getMe for profile tabs

EOF
)"
```

---

### Task 2: Angular — Tab Perfil (`perfil-detalhe`) + live card preview contract

**Files:**
- Create: `Front/Front-Angular/src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.ts`
- Create: `Front/Front-Angular/src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.html`
- Create: `Front/Front-Angular/src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.spec.ts`
- Modify: `Front/Front-Angular/src/app/components/user/profile/profile.component.ts`
- Modify: `Front/Front-Angular/src/app/components/user/profile/profile.component.html`
- Modify: `Front/Front-Angular/src/app/components/user/profile/profile.component.spec.ts`

**Interfaces:**
- Consumes: `AccountService.getProfile` / `updateProfile`; `UserProfile` input as `@Input() profile`
- Produces:
  - `@Output() formPreview = new EventEmitter<ProfileFormPreview>()`
  - `@Output() saved = new EventEmitter<UserProfile>()`
  - `@Output() cancelled = new EventEmitter<void>()`
  - Method `resetTo(profile: UserProfile): void` (optional; parent can pass new `@Input` and child `ngOnChanges`)

- [ ] **Step 1: Write failing parent test for live card mirror**

In `profile.component.spec.ts`, add (after existing setup mocks; parent will need `PalestranteService` mock later — add empty stub now):

```ts
  it('updates card nome/descricao live when perfil tab emits formPreview', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'Live',
      ultimoNome: 'Nome',
      descricao: 'Bio ao vivo',
      funcao: 'Participante',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Live Nome');
    expect(text).toContain('Bio ao vivo');
  });

  it('hides Palestrante and Rede Social tabs when funcao is Participante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="tablist"]')).toBeTruthy();
    expect(el.textContent).toContain('Perfil');
    expect(el.querySelector('[data-tab="palestrante"]')).toBeNull();
    expect(el.querySelector('[data-tab="rede-social"]')).toBeNull();
  });

  it('shows extra tabs when formPreview sets funcao Palestrante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'Nome',
      ultimoNome: 'Sobrenome',
      descricao: 'Bio',
      funcao: 'Palestrante',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-tab="palestrante"]')).toBeTruthy();
    expect(el.querySelector('[data-tab="rede-social"]')).toBeTruthy();
  });
```

Update `setup()` providers to include:

```ts
{
  provide: PalestranteService,
  useValue: { getMe: vi.fn(), update: vi.fn() },
},
```

Import `PalestranteService` from the services path.

- [ ] **Step 2: Run parent tests — expect fail**

Run: `cd Front/Front-Angular && pnpm exec vitest run src/app/components/user/profile/profile.component.spec.ts -t "live|hides Palestrante|shows extra"`

Expected: FAIL (`onFormPreview` / tablist missing).

- [ ] **Step 3: Create `perfil-detalhe` component**

`perfil-detalhe.component.ts` — move the current profile form + password block + submit/cancel from `ProfileComponent` into this child. Key surface:

```ts
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AccountService } from '../../../../services/account.service';
import { apiErrorMessage } from '../../../../shared/api-error-message';
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  Funcao,
  Titulo,
  UserProfile,
} from '../../../../models';

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value ?? '';
  const confirm = group.get('confirmePassword')?.value ?? '';
  if (!password && !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-perfil-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil-detalhe.component.html',
})
export class PerfilDetalheComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  @Input({ required: true }) profile!: UserProfile;
  @Output() formPreview = new EventEmitter<ProfileFormPreview>();
  @Output() saved = new EventEmitter<UserProfile>();
  @Output() cancelled = new EventEmitter<void>();

  readonly tituloOptions = TITULO_OPTIONS;
  readonly funcaoOptions = FUNCAO_OPTIONS;

  form = this.fb.group(
    {
      titulo: ['NaoInformado' as Titulo, Validators.required],
      primeiroNome: ['', Validators.required],
      ultimoNome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      funcao: ['Participante' as Funcao, Validators.required],
      descricao: ['', Validators.required],
      password: [''],
      confirmePassword: [''],
    },
    { validators: passwordMatch },
  );

  saving = false;
  error: string | null = null;
  success: string | null = null;

  ngOnInit(): void {
    this.applyProfile(this.profile);
    this.form.valueChanges.subscribe(() => this.emitPreview());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && !changes['profile'].firstChange && this.profile) {
      this.applyProfile(this.profile);
    }
  }

  private emitPreview(): void {
    const v = this.form.getRawValue();
    this.formPreview.emit({
      primeiroNome: v.primeiroNome ?? '',
      ultimoNome: v.ultimoNome ?? '',
      descricao: v.descricao ?? '',
      funcao: (v.funcao ?? 'Participante') as Funcao,
    });
  }

  private applyProfile(p: UserProfile): void {
    this.form.reset({
      titulo: p.titulo,
      primeiroNome: p.primeiroNome,
      ultimoNome: p.ultimoNome,
      email: p.email,
      telefone: p.telefone,
      funcao: p.funcao,
      descricao: p.descricao,
      password: '',
      confirmePassword: '',
    });
    this.error = null;
    this.success = null;
    this.emitPreview();
  }

  cancelEdit(): void {
    this.applyProfile(this.profile);
    this.cancelled.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;
    this.error = null;
    this.success = null;
    const payload: Parameters<AccountService['updateProfile']>[0] = {
      userName: this.profile.userName,
      email: v.email!,
      primeiroNome: v.primeiroNome!,
      ultimoNome: v.ultimoNome!,
      titulo: v.titulo as Titulo,
      funcao: v.funcao as Funcao,
      telefone: v.telefone!,
      descricao: v.descricao!,
    };
    if (v.password) payload.password = v.password;

    this.accountService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.success = 'Perfil atualizado.';
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving = false;
        this.error = apiErrorMessage(err, 'Erro ao salvar perfil.');
      },
    });
  }
}
```

HTML: move the current “Detalhe Perfil” + “Mudar Senha” field markup from `profile.component.html` into `perfil-detalhe.component.html`, keep the same Tailwind classes, wrap in a fragment/`div`, buttons Cancelar / Salvar calling `cancelEdit()` / `submit()`.

- [ ] **Step 4: Slim parent to orchestrator + tabset + cardView**

In `profile.component.ts`:

```ts
import { Component, OnInit, inject } from '@angular/core';
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

type ProfileTab = 'perfil' | 'palestrante' | 'rede-social';

@Component({
  selector: 'app-profile',
  imports: [
    LoadingSpinnerComponent,
    PerfilDetalheComponent,
    // PalestranteDetalheComponent / RedesSociaisComponent added in Tasks 3–4
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation],
})
export class ProfileComponent implements OnInit {
  private readonly accountService = inject(AccountService);

  snapshot: UserProfile | null = null;
  cardView: Pick<UserProfile, 'primeiroNome' | 'ultimoNome' | 'descricao' | 'nome'> | null = null;
  ehPalestrante = false;
  activeTab: ProfileTab = 'perfil';
  loading = true;
  error: string | null = null;
  imgBroken = false;
  readonly placeholder = /* same PLACEHOLDER const as today */;

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
```

For Task 2 only, stub empty `PalestranteDetalheComponent` / `RedesSociaisComponent` **or** leave their imports out and render placeholder panels in the template when `ehPalestrante` — prefer creating minimal stub components that render `<p>…</p>` so Task 3/4 replace them without thrashing the parent template twice. Minimal stubs:

```ts
// palestrante-detalhe.component.ts (stub — replaced in Task 3)
@Component({
  selector: 'app-palestrante-detalhe',
  standalone: true,
  template: `<p class="text-sm text-muted">Carregando detalhe palestrante…</p>`,
})
export class PalestranteDetalheComponent {}

// redes-sociais.component.ts (stub — replaced in Task 4)
@Component({
  selector: 'app-redes-sociais',
  standalone: true,
  template: `<p class="text-sm text-muted">Carregando redes…</p>`,
})
export class RedesSociaisComponent {}
```

Template tabset + card (replace right-hand monolith form):

```html
<aside …>
  …
  <p>
    <span class="font-semibold">Nome:</span>
    {{ cardView?.nome || (cardView?.primeiroNome + ' ' + cardView?.ultimoNome) }}
  </p>
  <p class="text-muted">{{ cardView?.descricao }}</p>
  … counters from snapshot …
</aside>

<div [@panelEnter] class="flex flex-col rounded-[length:var(--radius-control)] border border-line bg-panel">
  <div role="tablist" aria-label="Seções do perfil" class="flex gap-1 border-b border-line px-2 pt-2">
    <button
      type="button"
      role="tab"
      data-tab="perfil"
      [attr.aria-selected]="activeTab === 'perfil'"
      class="px-4 py-2 text-sm font-medium"
      [class.border-b-2]="activeTab === 'perfil'"
      [class.border-accent]="activeTab === 'perfil'"
      [class.text-accent]="activeTab === 'perfil'"
      [class.text-muted]="activeTab !== 'perfil'"
      (click)="selectTab('perfil')"
    >
      Perfil
    </button>
    @if (ehPalestrante) {
      <button type="button" role="tab" data-tab="palestrante" … (click)="selectTab('palestrante')">
        Palestrante
      </button>
      <button type="button" role="tab" data-tab="rede-social" … (click)="selectTab('rede-social')">
        Rede Social
      </button>
    }
  </div>

  <div class="border border-t-0 border-transparent p-6" role="tabpanel">
    @if (activeTab === 'perfil' && snapshot) {
      <app-perfil-detalhe
        [profile]="snapshot"
        (formPreview)="onFormPreview($event)"
        (saved)="onPerfilSaved($event)"
        (cancelled)="onPerfilCancelled()"
      />
    }
    @if (activeTab === 'palestrante' && ehPalestrante) {
      <app-palestrante-detalhe />
    }
    @if (activeTab === 'rede-social' && ehPalestrante) {
      <app-redes-sociais />
    }
  </div>
</div>
```

Remove redes markup and `RedeSocialService` usage from the parent (moved in Task 4 — until then stub is fine; migrate redes tests in Task 4).

Temporarily keep redes tests skipped or update them to expect the tab button then child — prefer updating “does not show redes for Participante” to assert tabs hidden, and leave load/save/delete redes tests for Task 4 (mark with `it.skip` with comment `// Task 4` if they break).

- [ ] **Step 5: Run profile + perfil-detalhe specs**

```bash
cd Front/Front-Angular && pnpm exec vitest run \
  src/app/components/user/profile/profile.component.spec.ts \
  src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.spec.ts
```

Expected: new live-card / tabs tests PASS; migrated cancel/save profile tests PASS (call through child or keep covering via parent if still wired). Write a minimal `perfil-detalhe.component.spec.ts` that mocks `AccountService` and asserts `formPreview` emit on value change + `updateProfile` on submit (mirror existing profile form tests moved here).

- [ ] **Step 6: Commit**

```bash
git add Front/Front-Angular/src/app/components/user/profile/
git commit -m "$(cat <<'EOF'
feat(angular): extract perfil-detalhe tab and live card preview

EOF
)"
```

---

### Task 3: Angular — Tab Palestrante (`palestrante-detalhe`)

**Files:**
- Modify: `Front/Front-Angular/src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.ts`
- Create: `Front/Front-Angular/src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.html`
- Create: `Front/Front-Angular/src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.spec.ts`
- Modify: `Front/Front-Angular/src/app/components/user/profile/profile.component.spec.ts` (getMe on become palestrante)

**Interfaces:**
- Consumes: `PalestranteService.getMe()`, `PalestranteService.update(id, palestrante)`, `createPalestranteForm` / `patchPalestranteForm` from `forms/schemas/palestrante-form.factory.ts` (omit redes FormArray usage in this tab — only nome, email, telefone, imagemURL, miniCurriculo)
- Produces: self-contained save; **does not** emit to card

- [ ] **Step 1: Write failing component tests**

```ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PalestranteService } from '../../../../services/palestrante.service';
import { PalestranteDetalheComponent } from './palestrante-detalhe.component';

describe('PalestranteDetalheComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [PalestranteDetalheComponent],
      providers: [
        {
          provide: PalestranteService,
          useValue: { getMe: vi.fn(), update: vi.fn() },
        },
      ],
    }).compileComponents();
  }

  it('calls getMe on init and fills the form', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    vi.mocked(svc.getMe).mockReturnValue(
      of({
        id: 7,
        nome: 'Speaker',
        email: 's@x.com',
        telefone: '11',
        imagemURL: 'http://img',
        miniCurriculo: 'Mini',
      }),
    );
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(svc.getMe).toHaveBeenCalled();
    expect(fixture.componentInstance.form.value.nome).toBe('Speaker');
    expect(fixture.componentInstance.form.value.miniCurriculo).toBe('Mini');
  });

  it('shows 404 warning and disables useful save', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    vi.mocked(svc.getMe).mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Salve o perfil com função Palestrante primeiro',
    );
    expect(fixture.componentInstance.palestranteId).toBeNull();
  });

  it('saves via update with id from getMe', async () => {
    await setup();
    const svc = TestBed.inject(PalestranteService);
    const me = {
      id: 7,
      nome: 'Speaker',
      email: 's@x.com',
      telefone: '11',
      imagemURL: '',
      miniCurriculo: 'Mini',
    };
    vi.mocked(svc.getMe).mockReturnValue(of(me));
    vi.mocked(svc.update).mockReturnValue(of({ ...me, nome: 'Novo' }));
    const fixture = TestBed.createComponent(PalestranteDetalheComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.form.patchValue({ nome: 'Novo' });
    fixture.componentInstance.submit();
    expect(svc.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ id: 7, nome: 'Novo' }),
    );
  });
});
```

Also in `profile.component.spec.ts`:

```ts
  it('loads palestrante getMe when user becomes Palestrante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    const palestrante = TestBed.inject(PalestranteService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(palestrante.getMe).mockReturnValue(
      of({ id: 1, nome: 'A', email: '', telefone: '', imagemURL: '', miniCurriculo: '' }),
    );
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'N',
      ultimoNome: 'S',
      descricao: 'D',
      funcao: 'Palestrante',
    });
    fixture.componentInstance.selectTab('palestrante');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(palestrante.getMe).toHaveBeenCalled();
  });
```

Note: `getMe` is called by the child on init when the tab mounts — selecting the tab must create the child. If using `@if (activeTab === 'palestrante')`, mounting triggers load.

- [ ] **Step 2: Run tests — expect fail**

Run: `cd Front/Front-Angular && pnpm exec vitest run src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.spec.ts`

Expected: FAIL (stub has no form).

- [ ] **Step 3: Implement full `PalestranteDetalheComponent`**

```ts
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PalestranteService } from '../../../../services/palestrante.service';
import {
  createPalestranteForm,
  patchPalestranteForm,
} from '../../../../forms/schemas/palestrante-form.factory';
import { apiErrorMessage } from '../../../../shared/api-error-message';
import { Palestrante } from '../../../../models';

@Component({
  selector: 'app-palestrante-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './palestrante-detalhe.component.html',
})
export class PalestranteDetalheComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly palestranteService = inject(PalestranteService);

  form = createPalestranteForm(this.fb);
  palestranteId: number | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  missingProfile = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.missingProfile = false;
    this.palestranteService.getMe().subscribe({
      next: (p) => {
        this.palestranteId = p.id;
        patchPalestranteForm(this.form, p);
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.missingProfile = true;
          this.error = 'Salve o perfil com função Palestrante primeiro';
          this.palestranteId = null;
          return;
        }
        this.error = apiErrorMessage(err, 'Erro ao carregar palestrante.');
      },
    });
  }

  submit(): void {
    if (this.palestranteId == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: Palestrante = {
      id: this.palestranteId,
      nome: v.nome ?? '',
      email: v.email ?? '',
      telefone: v.telefone ?? '',
      imagemURL: v.imagemURL ?? '',
      miniCurriculo: v.miniCurriculo ?? '',
    };
    this.saving = true;
    this.error = null;
    this.success = null;
    this.palestranteService.update(this.palestranteId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Palestrante atualizado.';
      },
      error: (err) => {
        this.saving = false;
        this.error = apiErrorMessage(err, 'Erro ao salvar palestrante.');
      },
    });
  }
}
```

HTML fields (same control classes as palestrante form page): `nome`, `email`, `telefone`, `imagemURL`, `miniCurriculo` (textarea), Salvar button disabled when `missingProfile || palestranteId == null || saving`.

Do **not** include redes FormArray UI here.

- [ ] **Step 4: Run tests — expect pass**

```bash
cd Front/Front-Angular && pnpm exec vitest run \
  src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.spec.ts \
  src/app/components/user/profile/profile.component.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add Front/Front-Angular/src/app/components/user/profile/palestrante-detalhe/ \
  Front/Front-Angular/src/app/components/user/profile/profile.component.spec.ts \
  Front/Front-Angular/src/app/components/user/profile/profile.component.ts \
  Front/Front-Angular/src/app/components/user/profile/profile.component.html
git commit -m "$(cat <<'EOF'
feat(angular): add palestrante-detalhe tab with getMe/update

EOF
)"
```

---

### Task 4: Angular — Tab Rede Social (`redes-sociais`)

**Files:**
- Modify: `Front/Front-Angular/src/app/components/user/profile/redes-sociais/redes-sociais.component.{ts,html}`
- Create: `…/redes-sociais.component.spec.ts`
- Modify: `profile.component.spec.ts` — unskip/migrate redes tests to child or parent+tab

**Interfaces:**
- Consumes: `RedeSocialService.getMine/saveMine/deleteMine`, `createRedeGroup`, `ConfirmDialogComponent`
- Produces: isolated redes save/delete; no card updates

- [ ] **Step 1: Move redes logic into child + migrate tests**

Copy load/save/delete/`pendingRedeDelete`/`setRedes` from the old monolith into `RedesSociaisComponent`. On `ngOnInit`, call `getMine()`.

Spec file should include the three behaviors previously on the parent:

```ts
it('loads and saves redes', …);
it('deletes persisted rede via deleteMine after confirmation', …);
```

Parent test:

```ts
it('does not show Rede Social tab for Participante', …); // already Task 2
it('shows Rede Social tab for Palestrante and renders child', async () => {
  …
  fixture.componentInstance.onFormPreview({ …, funcao: 'Palestrante' });
  fixture.componentInstance.selectTab('rede-social');
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('app-redes-sociais')).toBeTruthy();
});
```

Remove `it.skip` from Task 2 if any.

- [ ] **Step 2: Run Angular profile suite**

```bash
cd Front/Front-Angular && pnpm exec vitest run src/app/components/user/profile/
```

Expected: PASS. Also confirm change-password component still untouched:

```bash
pnpm exec vitest run src/app/components/user/change-password/
```

- [ ] **Step 3: Commit**

```bash
git add Front/Front-Angular/src/app/components/user/profile/
git commit -m "$(cat <<'EOF'
feat(angular): extract redes-sociais profile tab

EOF
)"
```

---

### Task 5: Vue — Orchestrator tabs + `PerfilDetalhe` + live card

**Files:**
- Create: `Front/Front-Vue/src/components/user/perfil/PerfilDetalhe.vue`
- Create: `Front/Front-Vue/src/components/user/perfil/PerfilDetalhe.spec.ts`
- Create stubs: `PalestranteDetalhe.vue`, `RedesSociais.vue` (filled in Tasks 6–7)
- Modify: `Front/Front-Vue/src/components/user/perfil/PerfilUsuario.vue`
- Modify: `Front/Front-Vue/src/components/user/perfil/PerfilUsuario.spec.ts`

**Interfaces:**
- Consumes: `accountService.getProfile/updateProfile`; props `profile: UserProfile`
- Produces: emit `formPreview: ProfileFormPreview`, `saved: UserProfile`, `cancelled: void`

- [ ] **Step 1: Write failing parent tests**

In `PerfilUsuario.spec.ts`:

```ts
  it("updates card nome/descricao live from formPreview", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    const vm = wrapper.vm as any;
    vm.onFormPreview({
      primeiroNome: "Live",
      ultimoNome: "Nome",
      descricao: "Bio ao vivo",
      funcao: "Participante",
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Live Nome");
    expect(wrapper.text()).toContain("Bio ao vivo");
  });

  it("hides Palestrante and Rede Social tabs for Participante", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
    expect(wrapper.find('[data-tab="palestrante"]').exists()).toBe(false);
  });

  it("shows extra tabs when funcao becomes Palestrante", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    (wrapper.vm as any).onFormPreview({
      primeiroNome: "N",
      ultimoNome: "S",
      descricao: "D",
      funcao: "Palestrante",
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-tab="palestrante"]').exists()).toBe(true);
    expect(wrapper.find('[data-tab="rede-social"]').exists()).toBe(true);
  });
```

Mock `palestranteService` in the suite (`vi.mock("@/services/palestranteService", …)`).

- [ ] **Step 2: Run — expect fail**

```bash
cd Front/Front-Vue && pnpm test -- src/components/user/perfil/PerfilUsuario.spec.ts -t "live|hides Palestrante|shows extra"
```

- [ ] **Step 3: Extract `PerfilDetalhe.vue`**

Move profile Zod schema, vee-validate form, password fields, submit/cancel from `PerfilUsuario.vue` into `PerfilDetalhe.vue`.

```vue
<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { accountService } from "@/services/accountService";
import type { Funcao, UserProfile } from "@/Models/identity/User";
import { isAxiosError } from "axios";

const props = defineProps<{ profile: UserProfile }>();
const emit = defineEmits<{
  formPreview: [ProfileFormPreview];
  saved: [UserProfile];
  cancelled: [];
}>();

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

// profileSchema: same as current PerfilUsuario inline schema
const { handleSubmit, defineField, errors, resetForm, values, meta } = useForm({
  validationSchema: toTypedSchema(profileSchema),
});

watch(
  () => [values.primeiroNome, values.ultimoNome, values.descricao, values.funcao],
  () => {
    emit("formPreview", {
      primeiroNome: values.primeiroNome ?? "",
      ultimoNome: values.ultimoNome ?? "",
      descricao: values.descricao ?? "",
      funcao: (values.funcao ?? "Participante") as Funcao,
    });
  },
  { immediate: true },
);

watch(
  () => props.profile,
  (p) => {
    resetForm({ values: { /* map from p, password: "" */ } });
  },
  { immediate: true },
);

function cancelEdit() {
  resetForm({ values: { /* from props.profile */ } });
  emit("cancelled");
}

const onSubmit = handleSubmit(async (formValues) => {
  // same updateProfile payload as today
  const profile = await accountService.updateProfile(payload);
  emit("saved", profile);
});
</script>
```

- [ ] **Step 4: Rewrite `PerfilUsuario.vue` as orchestrator**

Keep load of `getProfile`, `snapshot` + `cardView`, `ehPalestrante`, `activeTab`, semantic tablist markup (same structure/classes as Angular), bind card to `cardView` for nome/descrição and `snapshot` for photo/userName/counters.

```ts
const cardView = reactive({
  nome: "",
  primeiroNome: "",
  ultimoNome: "",
  descricao: "",
});

function onFormPreview(preview: ProfileFormPreview) {
  cardView.nome = "";
  cardView.primeiroNome = preview.primeiroNome;
  cardView.ultimoNome = preview.ultimoNome;
  cardView.descricao = preview.descricao;
  const was = ehPalestrante.value;
  ehPalestrante.value = preview.funcao === "Palestrante";
  if (was && !ehPalestrante.value && activeTab.value !== "perfil") {
    activeTab.value = "perfil";
  }
}
```

Stub children:

```vue
<!-- PalestranteDetalhe.vue stub -->
<template><p class="text-sm text-muted">Carregando detalhe palestrante…</p></template>
<script setup lang="ts"></script>
```

Skip/migrate redes tests like Angular Task 2 (`it.skip` until Task 7).

- [ ] **Step 5: Run specs — expect pass for new tests + perfil save/cancel**

```bash
cd Front/Front-Vue && pnpm test -- src/components/user/perfil/
```

- [ ] **Step 6: Commit**

```bash
git add Front/Front-Vue/src/components/user/perfil/
git commit -m "$(cat <<'EOF'
feat(vue): extract PerfilDetalhe tab and live card preview

EOF
)"
```

---

### Task 6: Vue — `PalestranteDetalhe`

**Files:**
- Modify: `Front/Front-Vue/src/components/user/perfil/PalestranteDetalhe.vue`
- Create: `Front/Front-Vue/src/components/user/perfil/PalestranteDetalhe.spec.ts`
- Modify: `PerfilUsuario.spec.ts` (getMe when tab selected)

**Interfaces:**
- Consumes: `palestranteService.getMe`, `palestranteService.update`, `palestranteSchema`
- Produces: local save only

- [ ] **Step 1: Write failing tests**

```ts
import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PalestranteDetalhe from "./PalestranteDetalhe.vue";
import { palestranteService } from "@/services/palestranteService";
import { AxiosError } from "axios";

vi.mock("@/services/palestranteService", () => ({
  palestranteService: {
    getMe: vi.fn(),
    update: vi.fn(),
  },
}));

describe("PalestranteDetalhe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getMe and fills fields", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: {
        id: 7,
        nome: "Speaker",
        email: "s@x.com",
        telefone: "11",
        imagemURL: "",
        miniCurriculo: "Mini",
      },
    });
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(palestranteService.getMe).toHaveBeenCalled();
    expect((wrapper.find('input[name="nome"]').element as HTMLInputElement).value).toBe("Speaker");
  });

  it("shows 404 warning", async () => {
    const err = new AxiosError("missing");
    (err as any).response = { status: 404 };
    (palestranteService.getMe as any).mockRejectedValue(err);
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(wrapper.text()).toContain("Salve o perfil com função Palestrante primeiro");
  });

  it("saves via update with getMe id", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: { id: 7, nome: "Speaker", email: "", telefone: "", imagemURL: "", miniCurriculo: "" },
    });
    (palestranteService.update as any).mockResolvedValue({ data: { id: 7, nome: "Novo" } });
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    await wrapper.find('input[name="nome"]').setValue("Novo");
    await wrapper.find('form').trigger("submit.prevent");
    await flushPromises();
    expect(palestranteService.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ nome: "Novo" }),
    );
  });
});
```

Mocks must return Axios-shaped `{ data: Palestrante }` — same as `PalestranteFormPage.spec.ts` for `getById`.

- [ ] **Step 2: Implement component**

Unwrap like `PalestranteFormPage.vue`:

```ts
const { data } = await palestranteService.getMe();
palestranteId.value = data.id;
// setValues from data.nome / email / telefone / imagemURL / miniCurriculo
```

Fields: nome, email, telefone, imagemURL, miniCurriculo; states `loading/saving/error/success/missingProfile/palestranteId`; 404 via `isAxiosError(err) && err.response?.status === 404`.

- [ ] **Step 3: Run — expect pass**

```bash
cd Front/Front-Vue && pnpm test -- src/components/user/perfil/PalestranteDetalhe.spec.ts src/components/user/perfil/PerfilUsuario.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add Front/Front-Vue/src/components/user/perfil/
git commit -m "$(cat <<'EOF'
feat(vue): add PalestranteDetalhe profile tab with getMe/update

EOF
)"
```

---

### Task 7: Vue — `RedesSociais`

**Files:**
- Modify: `Front/Front-Vue/src/components/user/perfil/RedesSociais.vue`
- Create: `Front/Front-Vue/src/components/user/perfil/RedesSociais.spec.ts`
- Modify: `PerfilUsuario.vue` / `.spec.ts` — unskip redes tests

**Interfaces:**
- Consumes: `redeSocialService.listMine/saveMine/removeMine`, `redeSocialFormSchema`, `ConfirmDialog`
- Produces: isolated save/delete

- [ ] **Step 1: Move redes block from old monolith into `RedesSociais.vue`**

Preserve exact UX: add row, validate nome/url, Salvar Redes, confirm before delete.

- [ ] **Step 2: Migrate tests from `PerfilUsuario.spec.ts`**

Move “loads and saves redes” / “deletes persisted rede” into `RedesSociais.spec.ts`. Keep parent assertion that tab exists only for Palestrante.

- [ ] **Step 3: Run full perfil suite**

```bash
cd Front/Front-Vue && pnpm test -- src/components/user/perfil/
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add Front/Front-Vue/src/components/user/perfil/
git commit -m "$(cat <<'EOF'
feat(vue): extract RedesSociais profile tab

EOF
)"
```

---

### Task 8: React — Orchestrator tabs + `PerfilDetalhe` + live card

**Files:**
- Create: `Front/Front-React/src/components/user/PerfilDetalhe.tsx` (+ `.test.tsx`)
- Create stubs: `PalestranteDetalhe.tsx`, `RedesSociais.tsx`
- Modify: `Front/Front-React/src/components/user/ProfilePage.tsx` (+ `.test.tsx`)

**Interfaces:**
- Consumes: `accountService.getProfile/updateProfile`; props `{ profile: UserProfile; onPreview; onSaved; onCancelled }`
- Produces: `onPreview(ProfileFormPreview)` via `watch` on RHF values

- [ ] **Step 1: Write failing parent tests**

In `ProfilePage.test.tsx`:

```tsx
  it("atualiza card nome/descricao ao vivo", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByDisplayValue(baseProfile.primeiroNome);
    const primeiro = screen.getByLabelText(/primeiro nome/i);
    await userEvent.clear(primeiro);
    await userEvent.type(primeiro, "Live");
    // After extraction, typing may be inside PerfilDetalhe — still visible in document
    expect(await screen.findByText(/Live/)).toBeInTheDocument();
  });

  it("oculta tabs Palestrante e Rede Social para Participante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await screen.findByRole("tablist");
    expect(screen.queryByRole("tab", { name: "Palestrante" })).not.toBeInTheDocument();
  });

  it("mostra tabs extras ao selecionar função Palestrante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await screen.findByLabelText(/função/i);
    await userEvent.selectOptions(screen.getByLabelText(/função/i), "Palestrante");
    expect(await screen.findByRole("tab", { name: "Palestrante" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rede Social" })).toBeInTheDocument();
  });
```

Add `vi.mock("@/services/palestranteService", …)`.

- [ ] **Step 2: Run — expect fail**

```bash
cd Front/Front-React && pnpm test -- src/components/user/ProfilePage.test.tsx -t "ao vivo|oculta tabs|mostra tabs"
```

- [ ] **Step 3: Extract `PerfilDetalhe` and slim `ProfilePage`**

`PerfilDetalhe.tsx`:

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountService } from "@/services/accountService";
import type { Funcao, UserProfile } from "@/models/User";

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

// Move existing profileSchema from ProfilePage here

type Props = {
  profile: UserProfile;
  onPreview: (p: ProfileFormPreview) => void;
  onSaved: (p: UserProfile) => void;
  onCancelled: () => void;
};

export function PerfilDetalhe({ profile, onPreview, onSaved, onCancelled }: Props) {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { /* from profile, password: "" */ },
  });

  const watched = form.watch(["primeiroNome", "ultimoNome", "descricao", "funcao"]);
  useEffect(() => {
    onPreview({
      primeiroNome: watched[0] ?? "",
      ultimoNome: watched[1] ?? "",
      descricao: watched[2] ?? "",
      funcao: (watched[3] ?? "Participante") as Funcao,
    });
  }, [watched, onPreview]);

  useEffect(() => {
    form.reset({ /* from profile */ });
  }, [profile, form]);

  // submit / cancel same as current ProfilePage
  return (/* fields + Mudar Senha + buttons */);
}
```

`ProfilePage.tsx`: load profile, `snapshot`/`cardView`/`ehPalestrante`/`activeTab`, tablist markup, card binds to `cardView` for nome/descrição.

Skip redes tests until Task 10.

- [ ] **Step 4: Run — expect pass**

```bash
cd Front/Front-React && pnpm test -- src/components/user/ProfilePage.test.tsx src/components/user/PerfilDetalhe.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add Front/Front-React/src/components/user/
git commit -m "$(cat <<'EOF'
feat(react): extract PerfilDetalhe tab and live card preview

EOF
)"
```

---

### Task 9: React — `PalestranteDetalhe`

**Files:**
- Modify: `Front/Front-React/src/components/user/PalestranteDetalhe.tsx`
- Create: `Front/Front-React/src/components/user/PalestranteDetalhe.test.tsx`
- Modify: `ProfilePage.test.tsx`

**Interfaces:**
- Consumes: `palestranteService.getMe/update`, `palestranteSchema`, `HttpError`
- Produces: local save only

- [ ] **Step 1: Write failing tests**

```tsx
it("chama getMe e preenche o formulário", async () => {
  vi.mocked(palestranteService.getMe).mockResolvedValue({
    id: 7,
    nome: "Speaker",
    email: "s@x.com",
    telefone: "11",
    imagemURL: "",
    miniCurriculo: "Mini",
  });
  render(<PalestranteDetalhe />);
  expect(await screen.findByDisplayValue("Speaker")).toBeInTheDocument();
  expect(palestranteService.getMe).toHaveBeenCalled();
});

it("exibe aviso em 404", async () => {
  vi.mocked(palestranteService.getMe).mockRejectedValue(new HttpError(404, "missing"));
  render(<PalestranteDetalhe />);
  expect(
    await screen.findByText("Salve o perfil com função Palestrante primeiro"),
  ).toBeInTheDocument();
});

it("salva via update com id do getMe", async () => {
  vi.mocked(palestranteService.getMe).mockResolvedValue({
    id: 7, nome: "Speaker", email: "", telefone: "", imagemURL: "", miniCurriculo: "",
  });
  vi.mocked(palestranteService.update).mockResolvedValue({
    id: 7, nome: "Novo", email: "", telefone: "", imagemURL: "", miniCurriculo: "",
  });
  render(<PalestranteDetalhe />);
  await screen.findByDisplayValue("Speaker");
  await userEvent.clear(screen.getByLabelText(/nome/i));
  await userEvent.type(screen.getByLabelText(/nome/i), "Novo");
  await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
  await waitFor(() =>
    expect(palestranteService.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ id: 7, nome: "Novo" }),
    ),
  );
});
```

- [ ] **Step 2: Implement**

```tsx
export function PalestranteDetalhe() {
  const [palestranteId, setPalestranteId] = useState<number | null>(null);
  const [missingProfile, setMissingProfile] = useState(false);
  // RHF + palestranteSchema
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await palestranteService.getMe();
        if (cancelled) return;
        setPalestranteId(me.id);
        form.reset({ nome: me.nome, email: me.email, telefone: me.telefone, imagemURL: me.imagemURL, miniCurriculo: me.miniCurriculo });
      } catch (err) {
        if (err instanceof HttpError && err.status === 404) {
          setMissingProfile(true);
          setError("Salve o perfil com função Palestrante primeiro");
          return;
        }
        setError(/* apiErrorMessage */);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  // onSubmit → update(palestranteId, { id, ...values })
}
```

- [ ] **Step 3: Run — expect pass**

```bash
cd Front/Front-React && pnpm test -- src/components/user/PalestranteDetalhe.test.tsx src/components/user/ProfilePage.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add Front/Front-React/src/components/user/
git commit -m "$(cat <<'EOF'
feat(react): add PalestranteDetalhe profile tab with getMe/update

EOF
)"
```

---

### Task 10: React — `RedesSociais` + final regression

**Files:**
- Modify: `Front/Front-React/src/components/user/RedesSociais.tsx` (+ `.test.tsx`)
- Modify: `ProfilePage.tsx` / `.test.tsx`
- Verify change-password redirect untouched

**Interfaces:**
- Consumes: `redeSocialService.getMine/saveMine/deleteMine`, `redeSocialSchema`, `ConfirmDialog`
- Produces: isolated save/delete

- [ ] **Step 1: Extract redes UI/state into `RedesSociais.tsx`**

Same behavior as current inline block in `ProfilePage.tsx`.

- [ ] **Step 2: Migrate redes tests into `RedesSociais.test.tsx`**

Keep parent tests for tab visibility.

- [ ] **Step 3: Full front regression commands**

```bash
cd Front/Front-Angular && pnpm test
cd Front/Front-Vue && pnpm test
cd Front/Front-React && pnpm test
```

Expected: all PASS. Manually spot-check acceptance:

| Criterion | Check |
|-----------|--------|
| Card + tabs layout | visual / DOM `role="tablist"` |
| Perfil + senha + live mirror | unit tests Tasks 2/5/8 |
| Extra tabs only when `funcao === Palestrante` | unit tests |
| Palestrante getMe + PUT | Tasks 3/6/9 |
| Redes parity | Tasks 4/7/10 |
| `getMe` on services | Task 1 |
| No change-password / palestrantes list regression | existing suites still green |

- [ ] **Step 4: Commit**

```bash
git add Front/Front-React/src/components/user/
git commit -m "$(cat <<'EOF'
feat(react): extract RedesSociais profile tab

EOF
)"
```

---

## Self-Review

**1. Spec coverage**

| Spec requirement | Task(s) |
|------------------|---------|
| Tabs Perfil / Palestrante / Rede Social | 2, 5, 8 |
| Extra tabs only when `funcao === Palestrante` (before save) | 2, 5, 8 |
| Live card mirror nome/descrição | 2, 5, 8 |
| Isolated saves | 2–4, 5–7, 8–10 |
| Tab Palestrante fields + getMe + PUT | 3, 6, 9 |
| 404 warning copy | 3, 6, 9 |
| Redes extract + confirm delete | 4, 7, 10 |
| `getMe` on 3 services | 1 |
| Semantic tabs, no new library | 2, 5, 8 |
| No backend / no image upload / no auto-save | Global Constraints |
| Tests listed in design | embedded in each task |
| No change-password / palestrantes list regression | Task 10 + per-front suite runs |

**2. Placeholder scan:** No TBD/TODO left in steps; stubs are explicit temporary components replaced by named later tasks.

**3. Type consistency:** `ProfileFormPreview` / `onFormPreview` / `formPreview` use the same four fields across fronts; `getMe` → `Palestrante` with `id` for `update(id, …)`; 404 message string identical.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-31-perfil-tabs.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
