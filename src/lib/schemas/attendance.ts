import { z } from "zod";

export const attendanceStatusEnum = z.enum(["PRESENTE", "AUSENTE", "TARDE", "JUSTIFICADO"]);

export const saveAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: attendanceStatusEnum,
        observation: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .min(1, "Debe incluir al menos un estudiante"),
});
