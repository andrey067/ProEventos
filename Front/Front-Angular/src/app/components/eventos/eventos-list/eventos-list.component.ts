import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { createEventoSearchForm } from '../../../forms';
import { Evento, Lote, PAGE_SIZES, PageResult, PageSize } from '../../../models';
import { AuthTokenService } from '../../../services/auth-token.service';
import { EventoService } from '../../../services/evento.service';
import { formatDateBr } from '../../../shared/date';

@Component({
  selector: 'app-eventos-list',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.scss',
})
export class EventosListComponent implements OnInit {
  private readonly eventoService = inject(EventoService);
  private readonly authToken = inject(AuthTokenService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSizes = PAGE_SIZES;
  readonly formatDateBr = formatDateBr;

  eventos: Evento[] = [];
  searchForm: FormGroup = createEventoSearchForm(this.fb);
  loading = true;
  error: string | null = null;
  success: string | null = null;
  pendingDelete: Evento | null = null;
  page = 1;
  pageSize: PageSize = 10;
  totalPages = 0;
  showImages = true;
  brokenImages = new Set<number>();

  private readonly fetch$ = new Subject<{ resetPage?: boolean }>();
  private searchDebounceSub?: Subscription;

  get canWrite(): boolean {
    return this.authToken.canWrite();
  }

  get isAuthenticated(): boolean {
    return this.authToken.isAuthenticated();
  }

  get q(): string {
    return this.searchForm.get('q')?.value ?? '';
  }

  get tema(): string {
    return this.q;
  }

  get pagedEventos(): Evento[] {
    return this.eventos;
  }

  get columnCount(): number {
    return 7;
  }

  get deleteMessage(): string {
    return this.pendingDelete
      ? `Deseja deletar o evento "${this.pendingDelete.tema}"?`
      : '';
  }

  ngOnInit(): void {
    this.readQueryParams();
    this.wireFetchPipeline();
    this.wireDebouncedSearch();
    this.destroyRef.onDestroy(() => this.searchDebounceSub?.unsubscribe());
    this.load();
  }

  firstLoteLabel(evento: Evento): string {
    const lotes = evento.lotes;
    if (!lotes?.length) return '—';
    const first: Lote = lotes[0];
    return first.nome?.trim() || '—';
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
    this.searchForm.reset({ q: '' }, { emitEvent: false });
    this.wireDebouncedSearch();
    this.load({ resetPage: true });
  }

  toggleShowImages(): void {
    this.showImages = !this.showImages;
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

  onImageError(eventoId: number): void {
    this.brokenImages.add(eventoId);
  }

  hasImage(evento: Evento): boolean {
    return !!evento.imagemURL?.trim() && !this.brokenImages.has(evento.id);
  }

  askDelete(evento: Evento): void {
    if (!this.canWrite) return;
    this.pendingDelete = evento;
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    const evento = this.pendingDelete;
    this.pendingDelete = null;
    if (!evento) return;

    this.eventoService.delete(evento.id).subscribe({
      next: () => {
        this.success = `Evento "${evento.tema}" excluído com sucesso.`;
        this.load({ resetPage: true });
      },
      error: () => alert('Erro ao deletar evento.'),
    });
  }

  private wireFetchPipeline(): void {
    this.fetch$
      .pipe(
        tap((opts) => {
          const showFullSpinner = this.eventos.length === 0;
          if (showFullSpinner) this.loading = true;
          this.error = null;
          if (opts?.resetPage) this.page = 1;
          this.brokenImages.clear();
        }),
        switchMap(() =>
          this.eventoService
            .getAll({
              page: this.page,
              pageSize: this.pageSize,
              q: this.q.trim() || undefined,
            })
            .pipe(
              catchError(() => {
                this.error = 'Não foi possível carregar os eventos.';
                this.loading = false;
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data: PageResult<Evento> | null) => {
        if (!data) return;
        this.eventos = data.items;
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
    this.searchDebounceSub = this.searchForm
      .get('q')!
      .valueChanges.pipe(debounceTime(350), distinctUntilChanged())
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
    const q = params.get('q') ?? params.get('tema');
    if (Number.isFinite(page) && page >= 1) this.page = Math.floor(page);
    this.pageSize = (PAGE_SIZES.find((s) => s === pageSize) ?? 10) as PageSize;
    if (q) this.searchForm.patchValue({ q }, { emitEvent: false });
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page,
        pageSize: this.pageSize,
        q: this.q.trim() || null,
        tema: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
