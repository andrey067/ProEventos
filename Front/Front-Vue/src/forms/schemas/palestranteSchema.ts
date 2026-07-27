import { z } from "zod";

export const palestranteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().optional(),
  telefone: z.string().optional(),
  miniCurriculo: z.string().optional(),
});

export type PalestranteFormValues = z.infer<typeof palestranteSchema>;

export function defaultPalestranteFormValues(): PalestranteFormValues {
  return {
    nome: "",
    email: "",
    telefone: "",
    miniCurriculo: "",
  };
}
