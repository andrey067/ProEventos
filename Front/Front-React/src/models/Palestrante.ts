import type { RedeSocial } from "./RedeSocial";

export interface Palestrante {
  id: number;
  nome: string;
  miniCurriculo: string;
  imagemURL: string;
  telefone: string;
  email: string;
  redesSociais?: RedeSocial[];
}

export const palestranteModelKey = "Palestrante" as const;
