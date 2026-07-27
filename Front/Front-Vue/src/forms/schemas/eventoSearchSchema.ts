import { z } from "zod";

export const eventoSearchSchema = z.object({
  tema: z.string().optional(),
});

export type EventoSearchFormValues = z.infer<typeof eventoSearchSchema>;

export function defaultEventoSearchValues(): EventoSearchFormValues {
  return { tema: "" };
}
