import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";

export type ApiSuccess<T> = { success: true; data: T; message: null };
export type ApiFailure = { success: false; data: null; message: string };

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message: null }, { status });
}

export function fail(message: string, status = 400): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, data: null, message }, { status });
}

/** Traduce errores conocidos a una respuesta HTTP consistente y nunca filtra detalles internos. */
export function handleApiError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return fail(first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos", 422);
  }
  // eslint-disable-next-line no-console
  console.error("Unhandled API error:", error);
  return fail("Error interno del servidor", 500);
}
