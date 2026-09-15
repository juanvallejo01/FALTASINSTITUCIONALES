"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  internalCode: string;
  firstName: string;
  lastName: string;
  courseId: string;
  courseName: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelationship: string | null;
};

type Course = { id: string; name: string };

const emptyCreateForm = {
  firstName: "",
  lastName: "",
  internalCode: "",
  courseId: "",
  guardianFirstName: "",
  guardianLastName: "",
  guardianPhone: "",
  guardianRelationship: "Madre",
};

export function StudentsManager({
  initialStudents,
  courses,
}: {
  initialStudents: Student[];
  courses: Course[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ ...emptyCreateForm, courseId: courses[0]?.id ?? "" });
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    courseId: "",
    guardianFirstName: "",
    guardianLastName: "",
    guardianPhone: "",
    guardianRelationship: "Madre",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    router.refresh();
  }

  function startCreate() {
    setMode("create");
    setError(null);
    setCreateForm({ ...emptyCreateForm, courseId: courses[0]?.id ?? "" });
  }

  function startEdit(s: Student) {
    setMode("edit");
    setEditingId(s.id);
    setError(null);
    const [gLast, ...gFirstParts] = (s.guardianName ?? " ").split(" ").reverse();
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      courseId: s.courseId,
      guardianFirstName: gFirstParts.reverse().join(" "),
      guardianLastName: gLast ?? "",
      guardianPhone: s.guardianPhone ?? "",
      guardianRelationship: s.guardianRelationship ?? "Madre",
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible crear el estudiante");
      return;
    }
    setMode("closed");
    refresh();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/students/${editingId}`, {
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

  async function handleDelete(s: Student) {
    const confirmed = window.confirm(
      `¿Eliminar a ${s.firstName} ${s.lastName}? Su historial de asistencia, alertas y seguimiento se conservan intactos.`,
    );
    if (!confirmed) return;
    const res = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      window.alert(json.message ?? "No fue posible eliminar el estudiante");
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {mode === "closed" && (
        <button className="btn-primary" onClick={startCreate}>
          + Nuevo estudiante
        </button>
      )}

      {(mode === "create" || mode === "edit") && (
        <form
          onSubmit={mode === "create" ? handleCreate : handleEdit}
          className="card grid gap-3 p-4 sm:grid-cols-2"
        >
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              value={mode === "create" ? createForm.firstName : editForm.firstName}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, firstName: e.target.value })
                  : setEditForm({ ...editForm, firstName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              className="input"
              required
              value={mode === "create" ? createForm.lastName : editForm.lastName}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, lastName: e.target.value })
                  : setEditForm({ ...editForm, lastName: e.target.value })
              }
            />
          </div>
          {mode === "create" && (
            <div>
              <label className="label">Código interno</label>
              <input
                className="input"
                required
                value={createForm.internalCode}
                onChange={(e) => setCreateForm({ ...createForm, internalCode: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">Curso</label>
            <select
              className="input"
              value={mode === "create" ? createForm.courseId : editForm.courseId}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, courseId: e.target.value })
                  : setEditForm({ ...editForm, courseId: e.target.value })
              }
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nombre acudiente</label>
            <input
              className="input"
              required
              value={mode === "create" ? createForm.guardianFirstName : editForm.guardianFirstName}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, guardianFirstName: e.target.value })
                  : setEditForm({ ...editForm, guardianFirstName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Apellido acudiente</label>
            <input
              className="input"
              required
              value={mode === "create" ? createForm.guardianLastName : editForm.guardianLastName}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, guardianLastName: e.target.value })
                  : setEditForm({ ...editForm, guardianLastName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Teléfono acudiente</label>
            <input
              className="input"
              required
              value={mode === "create" ? createForm.guardianPhone : editForm.guardianPhone}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, guardianPhone: e.target.value })
                  : setEditForm({ ...editForm, guardianPhone: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Parentesco</label>
            <select
              className="input"
              value={mode === "create" ? createForm.guardianRelationship : editForm.guardianRelationship}
              onChange={(e) =>
                mode === "create"
                  ? setCreateForm({ ...createForm, guardianRelationship: e.target.value })
                  : setEditForm({ ...editForm, guardianRelationship: e.target.value })
              }
            >
              <option>Madre</option>
              <option>Padre</option>
              <option>Tutor/a</option>
            </select>
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando..." : mode === "create" ? "Crear estudiante" : "Guardar cambios"}
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
              <th className="px-4 py-2.5">Curso</th>
              <th className="px-4 py-2.5">Acudiente</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialStudents.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5 text-slate-500">{s.internalCode}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {s.lastName} {s.firstName}
                </td>
                <td className="px-4 py-2.5">{s.courseName}</td>
                <td className="px-4 py-2.5">{s.guardianName ?? "—"}</td>
                <td className="space-x-3 px-4 py-2.5 text-right">
                  <button className="text-brand-600 hover:underline" onClick={() => startEdit(s)}>
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(s)}>
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
