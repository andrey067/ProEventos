import { Lote } from './lote';
import { Palestrante } from './palestrante';
import { RedeSocial } from './rede-social';

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
