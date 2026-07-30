export interface Lote {
  id: number;
  nome: string;
  preco: number;
  dataIncio: string;
  dataFim: string;
  quantidade: number;
  eventoId: number;
}

export const loteModelKey = "Lote" as const;
