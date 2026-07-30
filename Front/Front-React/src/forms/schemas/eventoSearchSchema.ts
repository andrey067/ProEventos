import { z } from "zod";

export const eventoSearchSchema = z.object({
  q: z.string().optional(),
});

export type EventoSearchFormValues = z.infer<typeof eventoSearchSchema>;

export function emptyEventoSearchFormValues(): EventoSearchFormValues {
  return { q: "" };
}
