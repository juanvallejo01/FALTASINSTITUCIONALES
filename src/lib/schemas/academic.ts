import { z } from "zod";

export const jornadaEnum = z.enum(["MANANA", "TARDE", "NOCHE", "UNICA"]);

export const createCampusSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  address: z.string().trim().max(200).optional().nullable(),
});

export const createAcademicPeriodSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
});

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  campusId: z.string().min(1, "Debe seleccionar una sede"),
  academicPeriodId: z.string().min(1, "Debe seleccionar un periodo"),
  jornada: jornadaEnum,
});

export const updateCourseSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  campusId: z.string().min(1).optional(),
  academicPeriodId: z.string().min(1).optional(),
  jornada: jornadaEnum.optional(),
});
