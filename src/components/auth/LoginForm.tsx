"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DemoAccount } from "@/lib/demo-accounts";
import { Icon, type IconName } from "@/components/ui/Icon";

const ROLE_ICON: Record<string, IconName> = {
  "Super Admin": "shield",
  "Gestor de Seguimiento": "folder",
  "Admin institucional": "building",
  Coordinador: "checklist",
  Docente: "book",
};

type DemoLogin = { accounts: readonly DemoAccount[]; password: string } | null;

export function LoginForm({
  nextPath,
  demo = null,
}: {
  nextPath: string | null;
  demo?: DemoLogin;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void login(email, password);
  }

  function loginAsDemo(account: DemoAccount) {
    if (!demo) return;
    setEmail(account.email);
    setPassword(demo.password);
    void login(account.email, demo.password);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card space-y-4 p-5" noValidate>
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
          <div className="-mb-2 mt-0.5 text-right">
            <Link
            href="/forgot-password"
            className="-mr-2 inline-flex min-h-[44px] items-center px-2 text-[13px] font-medium text-brand-600 hover:underline"
          >
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

      {demo && (
        <section className="mt-8" aria-labelledby="demo-accounts-title">
          <h2 id="demo-accounts-title" className="section-title">
            Entrar con una cuenta de prueba
          </h2>
          <ul className="list-group">
            {demo.accounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsDemo(account)}
                  className="list-row disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">
                    <Icon name={ROLE_ICON[account.role] ?? "user"} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{account.role}</span>
                    <span className="block truncate text-[13px] text-slate-500">{account.email}</span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-1 text-[12px] text-slate-400">
            Contraseña de todas las cuentas: <code className="font-mono text-slate-500">{demo.password}</code>
          </p>
        </section>
      )}
    </>
  );
}
