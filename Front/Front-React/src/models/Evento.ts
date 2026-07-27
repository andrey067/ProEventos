import type { Lote } from "./Lote";
import type { Palestrante } from "./Palestrante";
import type { RedeSocial } from "./RedeSocial";

export interface Evento {
  id: number;
  local: string;
  dataEvento: string;
  tema: string;
  qtdPessoas: number;
  imagemURL: string;
  telefone: string;
  email: string;
  lotes?: Lote[];
  redesSociais?: RedeSocial[];
  palestrantes?: Palestrante[];
}
