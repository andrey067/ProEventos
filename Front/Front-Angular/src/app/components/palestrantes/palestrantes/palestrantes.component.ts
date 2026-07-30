import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { PAGE_SIZES, PageResult, PageSize, Palestrante } from '../../../models';
import { AuthTokenService } from '../../../services/auth-token.service';
import { PalestranteService } from '../../../services/palestrante.service';

@Component({
  selector: 'app-palestrantes',
  imports: [
    ConfirmDialogComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    LoadingSpinnerComponent,
  ],
  templateUrl: './palestrantes.component.html',
  styleUrl: './palestrantes.component.scss',
})
export class PalestrantesComponent implements OnInit {
  private readonly palestranteService = inject(PalestranteService);
  private readonly authToken = inject(AuthTokenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSizes = PAGE_SIZES;
  readonly searchNome = new FormControl('', { nonNullable: true });

  palestrantes: Palestrante[] = [];
  loading = true;
  error: string | null = null;
  success: string | null = null;
  pendingDelete: Palestrante | null = null;

  page = 1;
  pageSize: PageSize = 10;
  totalPages = 0;
  brokenImages = new Set<number>();

  private readonly fetch$ = new Subject<{ resetPage?: boolean }>();
  private searchDebounceSub?: Subscription;

  get canWrite(): boolean {
    return this.authToken.canWrite();
  }

  get isAuthenticated(): boolean {
    return this.authToken.isAuthenticated();
  }

  get deleteMessage(): string {
    return this.pendingDelete
      ? `Deseja deletar "${this.pendingDelete.nome}"?`
      : '';
  }

  ngOnInit(): void {
    this.readQueryParams();
    this.wireFetchPipeline();
    this.wireDebouncedSearch();
    this.destroyRef.onDestroy(() => this.searchDebounceSub?.unsubscribe());
    this.load();
  }

  load(opts?: { resetPage?: boolean }): void {
    this.fetch$.next(opts ?? {});
  }

  search(): void {
    this.cancelPendingDebounce();
    this.load({ resetPage: true });
  }

  clearSearch(): void {
    this.cancelPendingDebounce();
    this.searchNome.reset('', { emitEvent: false });
    this.wireDebouncedSearch();
    this.load({ resetPage: true });
  }

  onPageSizeChange(size: number): void {
    const numeric = Number(size);
    const allowed = PAGE_SIZES.find((s) => s === numeric);
    this.pageSize = allowed ?? 10;
    this.page = 1;
    this.load({ resetPage: false });
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.load({ resetPage: false });
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.load({ resetPage: false });
    }
  }

  hasImage(palestrante: Palestrante): boolean {
    return !!palestrante.imagemURL?.trim() && !this.brokenImages.has(palestrante.id);
  }

  onThumbError(id: number): void {
    this.brokenImages.add(id);
  }

  askDelete(palestrante: Palestrante): void {
    if (!this.canWrite) return;
    this.pendingDelete = palestrante;
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    const palestrante = this.pendingDelete;
    this.pendingDelete = null;
    if (!palestrante) return;

    this.palestranteService.delete(palestrante.id).subscribe({
      next: () => {
        this.success = `Palestrante "${palestrante.nome}" excluído.`;
        this.load({ resetPage: true });
      },
      error: () => {
        this.error = 'Erro ao deletar palestrante.';
      },
    });
  }

  private wireFetchPipeline(): void {
    this.fetch$
      .pipe(
        tap((opts) => {
          const showFullSpinner = this.palestrantes.length === 0;
          if (showFullSpinner) this.loading = true;
          this.error = null;
          if (opts?.resetPage) this.page = 1;
          this.brokenImages.clear();
        }),
        switchMap(() =>
          this.palestranteService
            .getAll({
              page: this.page,
              pageSize: this.pageSize,
              q: this.searchNome.value.trim() || undefined,
            })
            .pipe(
              catchError(() => {
                this.error = 'Não foi possível carregar palestrantes.';
                this.loading = false;
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data: PageResult<Palestrante> | null) => {
        if (!data) return;
        this.palestrantes = data.items;
        this.page = data.page;
        this.pageSize = (PAGE_SIZES.find((s) => s === Number(data.pageSize)) ??
          this.pageSize) as PageSize;
        this.totalPages = data.totalPages;
        this.loading = false;
        this.syncQueryParams();
      });
  }

  private wireDebouncedSearch(): void {
    this.searchDebounceSub?.unsubscribe();
    this.searchDebounceSub = this.searchNome.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.load({ resetPage: true }));
  }

  private cancelPendingDebounce(): void {
    this.searchDebounceSub?.unsubscribe();
    this.searchDebounceSub = undefined;
    this.wireDebouncedSearch();
  }

  private readQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const page = Number(params.get('page'));
    const pageSize = Number(params.get('pageSize'));
    const q = params.get('q') ?? params.get('nome');
    if (Number.isFinite(page) && page >= 1) this.page = Math.floor(page);
    this.pageSize = (PAGE_SIZES.find((s) => s === pageSize) ?? 10) as PageSize;
    if (q) this.searchNome.setValue(q, { emitEvent: false });
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page,
        pageSize: this.pageSize,
        q: this.searchNome.value.trim() || null,
        nome: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
