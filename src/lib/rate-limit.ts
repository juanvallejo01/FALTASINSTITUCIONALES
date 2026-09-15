import "server-only";

/**
 * Rate limiter en memoria de proceso. Suficiente para un monolito de una
 * sola instancia (MVP); si el sistema se despliega con múltiples instancias
 * detrás de un balanceador, esto debe migrarse a un store compartido
 * (ver README, sección "Pendientes").
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 8;

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  const now = Date.now();
  if (!entry || entry.resetAt < now) {
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function registerAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
