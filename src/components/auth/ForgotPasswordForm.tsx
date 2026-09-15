"use client";

import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDemoLink(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "No fue posible procesar la solicitud");
        return;
      }
      setMessage(json.data.message);
      setDemoLink(json.data.demoResetLink);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
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
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@demo.local"
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && (
        <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <p>{message}</p>
          {demoLink && (
            <p>
              <span className="font-medium">Modo DEMO</span> (sin envío de correo real): usa este
              enlace para continuar —{" "}
              <a href={demoLink} className="underline">
                {demoLink}
              </a>
            </p>
          )}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Enviando..." : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}
