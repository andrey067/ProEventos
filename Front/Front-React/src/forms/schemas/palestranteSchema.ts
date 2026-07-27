import { z } from "zod";

export const palestranteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  miniCurriculo: z.string(),
  telefone: z.string(),
  email: z.string(),
  imagemURL: z.string(),
});

export type PalestranteFormValues = z.infer<typeof palestranteSchema>;

export function emptyPalestranteFormValues(): PalestranteFormValues {
  return {
    nome: "",
    miniCurriculo: "",
    imagemURL: "",
    telefone: "",
    email: "",
  };
}
