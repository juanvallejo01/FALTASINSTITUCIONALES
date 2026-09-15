import { z } from "zod";

export const contactTypeEnum = z.enum(["LLAMADA", "MENSAJE", "PRESENCIAL", "OTRO"]);
export const contactResultEnum = z.enum([
  "ACUDIENTE_CONTACTADO",
  "NO_CONTESTO",
  "NUMERO_INVALIDO",
  "SOLICITA_DEVOLUCION_LLAMADA",
  "AUSENCIA_JUSTIFICADA",
  "OTRO",
]);

export const registerContactSchema = z.object({
  type: contactTypeEnum,
  result: contactResultEnum,
  observation: z.string().trim().max(1000).optional().nullable(),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
});

export const followUpStatusEnum = z.enum([
  "PENDIENTE",
  "EN_GESTION",
  "CONTACTADO",
  "NO_CONTACTADO",
  "JUSTIFICADO",
  "CERRADO",
]);

export const updateCaseStatusSchema = z.object({
  status: followUpStatusEnum,
});
