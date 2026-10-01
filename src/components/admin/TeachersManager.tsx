"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { useDialog } from "@/components/ui/useDialog";
import { Icon } from "@/components/ui/Icon";
import { RowActions } from "./RowActions";

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
  const { confirm, alert, dialog } = useDialog();
  const [copied, setCopied] = useState(false);
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
    setCopied(false);
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
    const confirmed = await confirm({
      title: `¿Eliminar a ${t.firstName} ${t.lastName}?`,
      message: "No podrá volver a iniciar sesión, pero su historial de asistencia registrada se conserva.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!confirmed) return;
    const res = await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
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
        Nuevo docente
      </button>

      {mode === "create" && (
        <Sheet title={created ? "Docente creado" : "Nuevo docente"} onClose={() => setMode("closed")}>
          {created ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Icon name="check" className="h-5 w-5" strokeWidth={2.6} />
                <p className="font-semibold">La cuenta está lista para usarse.</p>
              </div>
              <dl className="list-group">
                <div className="list-row justify-between">
                  <dt className="text-slate-500">Correo</dt>
                  <dd className="truncate font-mono text-[14px] text-slate-900">{created.email}</dd>
                </div>
                <div className="list-row justify-between">
                  <dt className="text-slate-500">Contraseña temporal</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono text-[14px] text-slate-900">{created.tempPassword}</span>
                    <button
                      type="button"
                      className="btn-plain min-h-[32px] px-2 text-[13px]"
                      onClick={() => {
                        void navigator.clipboard?.writeText(created.tempPassword);
                        setCopied(true);
                      }}
                    >
                      {copied ? "Copiada" : "Copiar"}
                    </button>
                  </dd>
                </div>
              </dl>
              <p className="text-[13px] text-slate-500">
                Compártela de forma segura con el docente. No se volverá a mostrar.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button className="btn-plain" onClick={startCreate}>
                  Crear otro
                </button>
                <button className="btn-primary" onClick={() => setMode("closed")}>
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
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
              {error && (
                <p role="alert" className="text-[14px] text-red-600 sm:col-span-2">
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-plain" onClick={() => setMode("closed")}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Creando..." : "Crear docente"}
                </button>
              </div>
            </form>
          )}
        </Sheet>
      )}

      {mode === "edit" && (
        <Sheet title="Editar docente" onClose={() => setMode("closed")}>
          <form onSubmit={handleEdit} className="grid gap-4 sm:grid-cols-2">
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
            {error && (
              <p role="alert" className="text-[14px] text-red-600 sm:col-span-2">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-plain" onClick={() => setMode("closed")}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="hidden px-3 py-2.5 sm:px-4 lg:table-cell">Código</th>
              <th className="px-3 py-2.5 sm:px-4">Nombre</th>
              <th className="hidden px-3 py-2.5 sm:px-4 md:table-cell">Correo</th>
              <th className="hidden px-3 py-2.5 sm:px-4 md:table-cell">Sede</th>
              <th className="hidden px-3 py-2.5 sm:px-4 text-right sm:table-cell">Cursos</th>
              <th className="px-3 py-2.5 sm:px-4">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialTeachers.map((t) => (
              <tr key={t.id}>
                <td className="hidden px-3 py-2.5 sm:px-4 text-slate-500 lg:table-cell">{t.internalCode}</td>
                <td className="px-3 py-2.5 sm:px-4">
                  <p className="font-semibold text-slate-900">
                    {t.lastName} {t.firstName}
                  </p>
                  <p className="truncate text-[13px] text-slate-500 md:hidden">{t.email}</p>
                </td>
                <td className="hidden px-3 py-2.5 sm:px-4 md:table-cell">{t.email}</td>
                <td className="hidden px-3 py-2.5 sm:px-4 md:table-cell">{t.campusName}</td>
                <td className="hidden px-3 py-2.5 sm:px-4 text-right tabular-nums sm:table-cell">{t.courseCount}</td>
                <td className="whitespace-nowrap px-2 py-1 text-right">
                  <RowActions onEdit={() => startEdit(t)} onDelete={() => handleDelete(t)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
