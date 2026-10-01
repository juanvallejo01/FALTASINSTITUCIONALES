"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function LogoutButton({ variant = "text" }: { variant?: "text" | "row" | "icon" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const label = loading ? "Saliendo..." : "Cerrar sesión";

  if (variant === "icon") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
      >
        <Icon name="logout" />
      </button>
    );
  }

  if (variant === "row") {
    return (
      <button onClick={handleLogout} disabled={loading} className="list-row text-red-600">
        <Icon name="logout" />
        <span className="font-medium">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-medium text-slate-500 hover:text-slate-800"
    >
      {label}
    </button>
  );
}
