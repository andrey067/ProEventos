import { z } from "zod";
import { parseLoteDate, toDateInputValue } from "@/utils/date";

export const loteSchema = z
  .object({
    id: z.number(),
    nome: z.string().trim().min(1, "Nome do lote é obrigatório"),
    preco: z.coerce.number().gt(0, "Preço deve ser maior que zero"),
    quantidade: z.coerce.number().int().gt(0, "Quantidade deve ser maior que zero"),
    dataIncio: z.string(),
    dataFim: z.string(),
    eventoId: z.number(),
  })
  .refine(
    (lote) => {
      if (!lote.dataIncio || !lote.dataFim) return true;
      const start = parseLoteDate(lote.dataIncio);
      const end = parseLoteDate(lote.dataFim);
      if (!start || !end) return true;
      return start <= end;
    },
    { message: "Data inicial não pode ser posterior à data final", path: ["dataFim"] },
  );

export const redeSocialSchema = z.object({
  id: z.number(),
  nome: z.string().trim().min(1, "Nome da rede é obrigatório"),
  url: z.string().trim().min(1, "URL é obrigatória"),
  eventoId: z.number().nullable().optional(),
});

export const eventoSchema = z.object({
  id: z.number(),
  tema: z
    .string()
    .trim()
    .min(4, "Tema deve ter ao menos 4 caracteres")
    .max(50, "Tema deve ter no máximo 50 caracteres"),
  local: z.string().trim().min(1, "Local é obrigatório"),
  dataEvento: z.string().trim().min(1, "Data do evento é obrigatória"),
  qtdPessoas: z.coerce
    .number()
    .min(1, "Quantidade mínima é 1")
    .max(120000, "Quantidade máxima é 120000"),
  imagemURL: z.string(),
  telefone: z.string().trim().min(1, "Telefone é obrigatório"),
  email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  lotes: z.array(loteSchema),
  redesSociais: z.array(redeSocialSchema),
});

export type LoteFormValues = z.infer<typeof loteSchema>;
export type RedeSocialFormValues = z.infer<typeof redeSocialSchema>;
export type EventoFormValues = z.infer<typeof eventoSchema>;

export function emptyLote(eventoId = 0): LoteFormValues {
  const today = toDateInputValue(new Date());
  return {
    id: 0,
    nome: "1º Lote",
    preco: 1,
    dataIncio: today,
    dataFim: today,
    quantidade: 1,
    eventoId,
  };
}

export function emptyRede(eventoId = 0): RedeSocialFormValues {
  return {
    id: 0,
    nome: "",
    url: "",
    eventoId,
  };
}

export function emptyEventoFormValues(): EventoFormValues {
  return {
    id: 0,
    local: "",
    dataEvento: "",
    tema: "",
    qtdPessoas: 1,
    imagemURL: "",
    telefone: "",
    email: "",
    lotes: [],
    redesSociais: [],
  };
}
