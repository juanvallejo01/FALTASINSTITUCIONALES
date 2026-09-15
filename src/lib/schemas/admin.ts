import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  internalCode: z.string().trim().min(1, "El código interno es obligatorio").max(50),
  courseId: z.string().min(1, "Debe seleccionar un curso"),
  guardianFirstName: z.string().trim().min(1).max(100),
  guardianLastName: z.string().trim().min(1).max(100),
  guardianPhone: z.string().trim().min(7).max(20),
  guardianRelationship: z.string().trim().min(1).max(50),
});

export const createTeacherSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  internalCode: z.string().trim().min(1, "El código interno es obligatorio").max(50),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  campusId: z.string().min(1, "Debe seleccionar una sede"),
  phone: z.string().trim().max(20).optional().nullable(),
});

export const createInstitutionSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El código es obligatorio")
    .max(30)
    .regex(/^[A-Z0-9-]+$/, "Solo letras, números y guiones"),
  address: z.string().trim().max(200).optional().nullable(),
});

export const updateInstitutionSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  address: z.string().trim().max(200).optional().nullable(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  courseId: z.string().min(1).optional(),
  guardianFirstName: z.string().trim().min(1).max(100).optional(),
  guardianLastName: z.string().trim().min(1).max(100).optional(),
  guardianPhone: z.string().trim().min(7).max(20).optional(),
  guardianRelationship: z.string().trim().min(1).max(50).optional(),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  campusId: z.string().min(1).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
});
