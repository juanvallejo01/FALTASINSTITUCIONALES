"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useDialog } from "@/components/ui/useDialog";
import { Icon } from "@/components/ui/Icon";
import { RowActions } from "./RowActions";

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
  const { confirm, alert, dialog } = useDialog();
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

  async function toggleStatus(inst: Institution) {
    if (inst.status === "ACTIVE") {
      const ok = await confirm({
        title: `¿Desactivar "${inst.name}"?`,
        message:
          "Sus usuarios no podrán iniciar sesión mientras esté inactiva. Puedes reactivarla cuando quieras.",
        confirmLabel: "Desactivar",
        destructive: true,
      });
      if (!ok) return;
    }
    const res = await fetch(`/api/institutions/${inst.id}/status`, { method: "PATCH" });
    if (!res.ok) await alert("No se pudo cambiar el estado", "Intenta nuevamente.");
    refresh();
  }

  async function handleDelete(inst: Institution) {
    const confirmed = await confirm({
      title: `¿Eliminar "${inst.name}"?`,
      message:
        "Sus usuarios no podrán volver a iniciar sesión. El historial académico y de asistencia se conserva y la acción queda en auditoría.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!confirmed) return;
    const res = await fetch(`/api/institutions/${inst.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      await alert("No se pudo eliminar", json.message ?? "Intenta nuevamente.");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {dialog}
      <button className="btn-primary" onClick={startCreate}>
        <Icon name="plus" className="h-[18px] w-[18px]" strokeWidth={2.4} />
        Nueva institución
      </button>

      {open && (
        <Sheet title={editingId ? "Editar institución" : "Nueva institución"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
            {error && (
              <p role="alert" className="text-[14px] text-red-600 sm:col-span-2">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-plain" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear institución"}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2.5">Institución</th>
              <th className="hidden px-4 py-2.5 text-right md:table-cell">Estudiantes</th>
              <th className="hidden px-4 py-2.5 text-right md:table-cell">Docentes</th>
              <th className="hidden px-4 py-2.5 text-right md:table-cell">Cursos</th>
              <th className="px-4 py-2.5">Activa</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialInstitutions.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-slate-900">{i.name}</p>
                  <p className="text-[13px] text-slate-500">
                    {i.code}
                    <span className="md:hidden">
                      {" "}
                      · {i.counts.students} est. · {i.counts.teachers} doc.
                    </span>
                  </p>
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums md:table-cell">
                  {i.counts.students}
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums md:table-cell">
                  {i.counts.teachers}
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums md:table-cell">
                  {i.counts.courses}
                </td>
                <td className="px-4 py-2.5">
                  <Switch
                    checked={i.status === "ACTIVE"}
                    onChange={() => toggleStatus(i)}
                    label={i.status === "ACTIVE" ? `Desactivar ${i.name}` : `Activar ${i.name}`}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right">
                  <RowActions onEdit={() => startEdit(i)} onDelete={() => handleDelete(i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
