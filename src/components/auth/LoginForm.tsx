"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "No fue posible iniciar sesión");
        setLoading(false);
        return;
      }
      router.push(nextPath || json.data.redirectTo);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@demo.local"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {/* Deliberadamente DESPUÉS del input en el DOM: si va entre el label
            y el input queda en medio del orden de tabulación (email -> este
            link -> password), rompiendo Tab/Enter para completar el login
            con teclado. Bug real detectado probando el flujo con teclado. */}
        <div className="mt-1.5 text-right">
          <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
