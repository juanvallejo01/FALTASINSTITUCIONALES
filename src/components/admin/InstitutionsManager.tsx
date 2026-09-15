"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Institution = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  counts: { students: number; teachers: number; courses: number };
};

export function InstitutionsManager({ initialInstitutions }: { initialInstitutions: Institution[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    router.refresh();
  }

  function startCreate() {
    setEditingId(null);
    setForm({ name: "", code: "", address: "" });
    setError(null);
    setOpen(true);
  }

  function startEdit(inst: Institution) {
    setEditingId(inst.id);
    setForm({ name: inst.name, code: inst.code, address: inst.address ?? "" });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editingId ? `/api/institutions/${editingId}` : "/api/institutions";
    const body = editingId
      ? { name: form.name, address: form.address || null }
      : { name: form.name, code: form.code, address: form.address || null };
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible guardar la institución");
      return;
    }
    setOpen(false);
    setEditingId(null);
    refresh();
  }

  async function toggleStatus(id: string) {
    await fetch(`/api/institutions/${id}/status`, { method: "PATCH" });
    refresh();
  }

  async function handleDelete(inst: Institution) {
    const confirmed = window.confirm(
      `¿Eliminar "${inst.name}"? Sus usuarios no podrán volver a iniciar sesión. El historial académico y de asistencia se conserva y esta acción queda registrada en auditoría.`,
    );
    if (!confirmed) return;
    const res = await fetch(`/api/institutions/${inst.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      window.alert(json.message ?? "No fue posible eliminar la institución");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {open ? (
        <form onSubmit={handleSubmit} className="card grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Código interno</label>
            <input
              className="input"
              required
              disabled={!!editingId}
              placeholder="INST-006"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            {editingId && (
              <p className="mt-1 text-xs text-slate-400">El código no se puede modificar una vez creado.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dirección (opcional)</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear institución"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="btn-primary" onClick={startCreate}>
          + Nueva institución
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Código</th>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5 text-right">Estudiantes</th>
              <th className="px-4 py-2.5 text-right">Docentes</th>
              <th className="px-4 py-2.5 text-right">Cursos</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialInstitutions.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2.5 text-slate-500">{i.code}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{i.name}</td>
                <td className="px-4 py-2.5 text-right">{i.counts.students}</td>
                <td className="px-4 py-2.5 text-right">{i.counts.teachers}</td>
                <td className="px-4 py-2.5 text-right">{i.counts.courses}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggleStatus(i.id)}
                    className={`badge ${i.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {i.status === "ACTIVE" ? "Activa" : "Inactiva"}
                  </button>
                </td>
                <td className="space-x-3 px-4 py-2.5 text-right">
                  <button className="text-brand-600 hover:underline" onClick={() => startEdit(i)}>
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(i)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
