import { z } from "zod";
import { parseDateBr, parseLoteDate, toDateInputValue } from "../../utils/date";

const dateInputPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateBrPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const loteFormSchema = z
  .object({
    id: z.number().optional(),
    nome: z.string().trim().min(1, "Nome do lote é obrigatório"),
    preco: z.coerce.number().gt(0, "Preço deve ser maior que zero"),
    quantidade: z.coerce.number().int().gt(0, "Quantidade deve ser maior que zero"),
    dataInicio: z.string().trim().min(1, "Data início é obrigatória"),
    dataFim: z.string().trim().min(1, "Data fim é obrigatória"),
    eventoId: z.number().optional(),
  })
  .refine(
    (lote) => {
      if (!lote.dataInicio || !lote.dataFim) return true;
      const start = parseLoteDate(lote.dataInicio);
      const end = parseLoteDate(lote.dataFim);
      if (!start || !end) return true;
      return start <= end;
    },
    { message: "Data inicial não pode ser posterior à data final", path: ["dataFim"] },
  );

export const redeSocialFormSchema = z.object({
  id: z.number().optional(),
  nome: z.string().optional(),
  URL: z.string().optional(),
  url: z.string().optional(),
  eventoId: z.number().optional(),
  palestranteId: z.number().optional(),
});

export const eventoSchema = z.object({
  id: z.number().optional(),
  tema: z
    .string()
    .trim()
    .min(3, "Tema deve ter ao menos 3 caracteres"),
  local: z.string().trim().min(3, "Local deve ter ao menos 3 caracteres"),
  dataEvento: z
    .string()
    .trim()
    .min(1, "Data do evento é obrigatória")
    .refine(
      (value) => {
        if (!value) return false;
        if (dateInputPattern.test(value)) return parseLoteDate(value) !== null;
        if (dateBrPattern.test(value)) return parseDateBr(value) !== null;
        return parseLoteDate(value) !== null;
      },
      { message: "Data inválida" },
    ),
  qtdPessoas: z.coerce.number().min(1, "Quantidade mínima é 1"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório"),
  email: z.string().trim().min(1, "E-mail obrigatório"),
  imagemURL: z.string().optional(),
  lotes: z.array(loteFormSchema),
  redesSociais: z.array(redeSocialFormSchema),
  palestrantesEventos: z.array(z.unknown()),
});

export type LoteFormValues = z.infer<typeof loteFormSchema>;
export type RedeSocialFormValues = z.infer<typeof redeSocialFormSchema>;
export type EventoFormValues = z.infer<typeof eventoSchema>;

export function emptyLote(eventoId = 0): LoteFormValues {
  const today = toDateInputValue(new Date());
  return {
    id: 0,
    nome: "1º Lote",
    preco: 1,
    quantidade: 1,
    dataInicio: today,
    dataFim: today,
    eventoId,
  };
}

export function defaultEventoFormValues(): EventoFormValues {
  return {
    id: 0,
    tema: "",
    local: "",
    dataEvento: "",
    qtdPessoas: 1,
    telefone: "",
    email: "",
    imagemURL: "",
    lotes: [],
    redesSociais: [],
    palestrantesEventos: [],
  };
}
