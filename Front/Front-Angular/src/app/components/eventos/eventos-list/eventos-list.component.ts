import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { createEventoSearchForm } from '../../../forms';
import { Evento } from '../../../models';
import { EventoService } from '../../../services/evento.service';
import { formatDateBr } from '../../../shared/date';
import { PAGE_SIZES, PageSize, paginate } from '../../../shared/pagination';

@Component({
  selector: 'app-eventos-list',
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.scss',
})
export class EventosListComponent implements OnInit {
  private readonly eventoService = inject(EventoService);
  private readonly fb = inject(FormBuilder);

  readonly pageSizes = PAGE_SIZES;
  readonly formatDateBr = formatDateBr;

  eventos: Evento[] = [];
  searchForm: FormGroup = createEventoSearchForm(this.fb);
  loading = true;
  error: string | null = null;
  pendingDelete: Evento | null = null;
  page = 1;
  pageSize: PageSize = 10;
  showImages = true;
  brokenImages = new Set<number>();

  get tema(): string {
    return this.searchForm.get('tema')?.value ?? '';
  }

  get pagedEventos(): Evento[] {
    return paginate(this.eventos, this.page, this.pageSize).items;
  }

  get totalPages(): number {
    return paginate(this.eventos, this.page, this.pageSize).totalPages;
  }

  get columnCount(): number {
    return this.showImages ? 6 : 5;
  }

  get deleteMessage(): string {
    return this.pendingDelete
      ? `Deseja deletar o evento "${this.pendingDelete.tema}"?`
      : '';
  }

  ngOnInit(): void {
    this.load();
  }

  load(searchTema?: string): void {
    this.loading = true;
    this.error = null;
    this.page = 1;
    this.brokenImages.clear();

    const request = searchTema?.trim()
      ? this.eventoService.getByTema(searchTema.trim())
      : this.eventoService.getAll();

    request.subscribe({
      next: (data) => {
        this.eventos = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar os eventos.';
        this.loading = false;
      },
    });
  }

  search(): void {
    this.load(this.tema);
  }

  clearSearch(): void {
    this.searchForm.reset({ tema: '' });
    this.load();
  }

  toggleShowImages(): void {
    this.showImages = !this.showImages;
  }

  onPageSizeChange(size: number): void {
    const allowed = PAGE_SIZES.find((s) => s === size);
    this.pageSize = allowed ?? 10;
    this.page = 1;
  }

  prevPage(): void {
    if (this.page > 1) this.page -= 1;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page += 1;
  }

  onImageError(eventoId: number): void {
    this.brokenImages.add(eventoId);
  }

  hasImage(evento: Evento): boolean {
    return !!evento.imagemURL?.trim() && !this.brokenImages.has(evento.id);
  }

  askDelete(evento: Evento): void {
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
      next: () => this.load(this.tema),
      error: () => alert('Erro ao deletar evento.'),
    });
  }
}
