"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Campus = { id: string; name: string; address: string | null; status: "ACTIVE" | "INACTIVE" };
type Period = { id: string; name: string; startDate: string; endDate: string; status: "ACTIVE" | "INACTIVE" };
type Subject = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };
type Course = {
  id: string;
  name: string;
  jornada: string;
  status: "ACTIVE" | "INACTIVE";
  campusId: string;
  academicPeriodId: string;
  campus: { name: string };
  academicPeriod: { name: string };
  _count: { students: number };
};

const JORNADAS = ["MANANA", "TARDE", "NOCHE", "UNICA"];

const TABS = [
  { key: "cursos", label: "Cursos" },
  { key: "sedes", label: "Sedes" },
  { key: "periodos", label: "Periodos" },
  { key: "materias", label: "Materias" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function StatusBadge({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await onToggle();
        setLoading(false);
      }}
      disabled={loading}
      className={`badge ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
    >
      {active ? "Activo" : "Inactivo"}
    </button>
  );
}

export function AcademicManager({
  initialCampuses,
  initialPeriods,
  initialSubjects,
  initialCourses,
}: {
  initialCampuses: Campus[];
  initialPeriods: Period[];
  initialSubjects: Subject[];
  initialCourses: Course[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("cursos");

  async function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`badge ${tab === t.key ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cursos" && (
        <CoursesSection
          courses={initialCourses}
          campuses={initialCampuses}
          periods={initialPeriods}
          onChange={refresh}
        />
      )}
      {tab === "sedes" && <CampusesSection campuses={initialCampuses} onChange={refresh} />}
      {tab === "periodos" && <PeriodsSection periods={initialPeriods} onChange={refresh} />}
      {tab === "materias" && <SubjectsSection subjects={initialSubjects} onChange={refresh} />}
    </div>
  );
}

function CampusesSection({ campuses, onChange }: { campuses: Campus[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/campuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address: address || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible crear la sede");
      return;
    }
    setName("");
    setAddress("");
    setOpen(false);
    onChange();
  }

  async function toggle(id: string) {
    await fetch(`/api/campuses/${id}/status`, { method: "PATCH" });
    onChange();
  }

  return (
    <div className="space-y-4">
      {open ? (
        <form onSubmit={handleCreate} className="card grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Dirección (opcional)</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Creando..." : "Crear sede"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + Nueva sede
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Dirección</th>
              <th className="px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campuses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{c.address ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={c.status === "ACTIVE"} onToggle={() => toggle(c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeriodsSection({ periods, onChange }: { periods: Period[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/academic-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible crear el periodo");
      return;
    }
    setName("");
    setStartDate("");
    setEndDate("");
    setOpen(false);
    onChange();
  }

  async function toggle(id: string) {
    await fetch(`/api/academic-periods/${id}/status`, { method: "PATCH" });
    onChange();
  }

  return (
    <div className="space-y-4">
      {open ? (
        <form onSubmit={handleCreate} className="card grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              placeholder="2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Inicio</label>
            <input
              type="date"
              className="input"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fin</label>
            <input
              type="date"
              className="input"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Creando..." : "Crear periodo"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + Nuevo periodo
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Inicio</th>
              <th className="px-4 py-2.5">Fin</th>
              <th className="px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(p.startDate).toLocaleDateString("es-CO")}
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(p.endDate).toLocaleDateString("es-CO")}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={p.status === "ACTIVE"} onToggle={() => toggle(p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectsSection({ subjects, onChange }: { subjects: Subject[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible crear la materia");
      return;
    }
    setName("");
    setOpen(false);
    onChange();
  }

  async function toggle(id: string) {
    await fetch(`/api/subjects/${id}/status`, { method: "PATCH" });
    onChange();
  }

  return (
    <div className="space-y-4">
      {open ? (
        <form onSubmit={handleCreate} className="card flex flex-wrap items-end gap-3 p-4">
          <div className="flex-1">
            <label className="label">Nombre</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Creando..." : "Crear materia"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </form>
      ) : (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + Nueva materia
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={s.status === "ACTIVE"} onToggle={() => toggle(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoursesSection({
  courses,
  campuses,
  periods,
  onChange,
}: {
  courses: Course[];
  campuses: Campus[];
  periods: Period[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    campusId: campuses[0]?.id ?? "",
    academicPeriodId: periods[0]?.id ?? "",
    jornada: "UNICA",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      campusId: course.campusId,
      academicPeriodId: course.academicPeriodId,
      jornada: course.jornada,
    });
    setOpen(true);
  }

  function startCreate() {
    setEditingId(null);
    setForm({
      name: "",
      campusId: campuses[0]?.id ?? "",
      academicPeriodId: periods[0]?.id ?? "",
      jornada: "UNICA",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(editingId ? `/api/courses/${editingId}` : "/api/courses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "No fue posible guardar el curso");
      return;
    }
    setOpen(false);
    setEditingId(null);
    onChange();
  }

  async function toggle(id: string) {
    await fetch(`/api/courses/${id}/status`, { method: "PATCH" });
    onChange();
  }

  if (campuses.length === 0 || periods.length === 0) {
    return (
      <div className="card p-4 text-sm text-amber-700">
        Antes de crear cursos necesitas al menos una sede activa y un periodo académico activo
        (pestañas &quot;Sedes&quot; y &quot;Periodos&quot;).
      </div>
    );
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
              placeholder="8-03"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Jornada</label>
            <select
              className="input"
              value={form.jornada}
              onChange={(e) => setForm({ ...form, jornada: e.target.value })}
            >
              {JORNADAS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sede</label>
            <select
              className="input"
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value })}
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Periodo</label>
            <select
              className="input"
              value={form.academicPeriodId}
              onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value })}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear curso"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="btn-primary" onClick={startCreate}>
          + Nuevo curso
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Curso</th>
              <th className="px-4 py-2.5">Sede</th>
              <th className="px-4 py-2.5">Periodo</th>
              <th className="px-4 py-2.5">Jornada</th>
              <th className="px-4 py-2.5 text-right">Estudiantes</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-2.5">{c.campus.name}</td>
                <td className="px-4 py-2.5">{c.academicPeriod.name}</td>
                <td className="px-4 py-2.5">{c.jornada}</td>
                <td className="px-4 py-2.5 text-right">{c._count.students}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={c.status === "ACTIVE"} onToggle={() => toggle(c.id)} />
                </td>
                <td className="px-4 py-2.5">
                  <button className="text-brand-600 hover:underline" onClick={() => startEdit(c)}>
                    Editar
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
