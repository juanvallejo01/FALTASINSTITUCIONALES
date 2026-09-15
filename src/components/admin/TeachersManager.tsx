"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Teacher = {
  id: string;
  internalCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  campusId: string;
  campusName: string;
  courseCount: number;
};

type Campus = { id: string; name: string };

const emptyCreateForm = {
  firstName: "",
  lastName: "",
  internalCode: "",
  email: "",
  campusId: "",
  phone: "",
};

export function TeachersManager({
  initialTeachers,
  campuses,
}: {
  initialTeachers: Teacher[];
  campuses: Campus[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ ...emptyCreateForm, campusId: campuses[0]?.id ?? "" });
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", campusId: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  function refresh() {
    router.refresh();
  }

  function startCreate() {
    setMode("create");
    setCreated(null);
    setError(null);
    setCreateForm({ ...emptyCreateForm, campusId: campuses[0]?.id ?? "" });
  }

  function startEdit(t: Teacher) {
    setMode("edit");
    setEditingId(t.id);
    setError(null);
    setEditForm({ firstName: t.firstName, lastName: t.lastName, campusId: t.campusId, phone: t.phone ?? "" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible crear el docente");
      return;
    }
    setCreated({ email: createForm.email, tempPassword: json.data.tempPassword });
    refresh();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/teachers/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible guardar los cambios");
      return;
    }
    setMode("closed");
    setEditingId(null);
    refresh();
  }

  async function handleDelete(t: Teacher) {
    const confirmed = window.confirm(
      `¿Eliminar a ${t.firstName} ${t.lastName}? No podrá volver a iniciar sesión, pero su historial de asistencia registrada se conserva.`,
    );
    if (!confirmed) return;
    const res = await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      window.alert(json.message ?? "No fue posible eliminar el docente");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {mode === "closed" && (
        <button className="btn-primary" onClick={startCreate}>
          + Nuevo docente
        </button>
      )}

      {mode === "create" && (
        <div className="card p-4">
          {created ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-emerald-700">Docente creado correctamente.</p>
              <p>
                Correo: <span className="font-mono">{created.email}</span>
                <br />
                Contraseña temporal: <span className="font-mono">{created.tempPassword}</span>
              </p>
              <p className="text-xs text-slate-500">
                Comparte esta contraseña de forma segura con el docente. No se mostrará de nuevo.
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={startCreate}>
                  Crear otro
                </button>
                <button className="btn-secondary" onClick={() => setMode("closed")}>
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  required
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input
                  className="input"
                  required
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Código interno</label>
                <input
                  className="input"
                  required
                  value={createForm.internalCode}
                  onChange={(e) => setCreateForm({ ...createForm, internalCode: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Correo</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Sede</label>
                <select
                  className="input"
                  value={createForm.campusId}
                  onChange={(e) => setCreateForm({ ...createForm, campusId: e.target.value })}
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Teléfono (opcional)</label>
                <input
                  className="input"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
              {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Creando..." : "Crear docente"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setMode("closed")}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {mode === "edit" && (
        <form onSubmit={handleEdit} className="card grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              className="input"
              required
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sede</label>
            <select
              className="input"
              value={editForm.campusId}
              onChange={(e) => setEditForm({ ...editForm, campusId: e.target.value })}
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input
              className="input"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode("closed")}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Código</th>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Correo</th>
              <th className="px-4 py-2.5">Sede</th>
              <th className="px-4 py-2.5 text-right">Cursos asignados</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialTeachers.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5 text-slate-500">{t.internalCode}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {t.lastName} {t.firstName}
                </td>
                <td className="px-4 py-2.5">{t.email}</td>
                <td className="px-4 py-2.5">{t.campusName}</td>
                <td className="px-4 py-2.5 text-right">{t.courseCount}</td>
                <td className="space-x-3 px-4 py-2.5 text-right">
                  <button className="text-brand-600 hover:underline" onClick={() => startEdit(t)}>
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(t)}>
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
