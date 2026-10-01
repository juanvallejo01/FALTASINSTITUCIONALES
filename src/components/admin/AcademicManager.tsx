"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { Icon } from "@/components/ui/Icon";
import { JORNADA } from "@/lib/labels";

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
  name,
}: {
  active: boolean;
  onToggle: () => Promise<void> | void;
  name: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Switch
      checked={active}
      disabled={loading}
      label={active ? `Desactivar ${name}` : `Activar ${name}`}
      onChange={async () => {
        setLoading(true);
        await onToggle();
        setLoading(false);
      }}
    />
  );
}

/** Fechas @db.Date guardadas a medianoche UTC: se muestran en UTC para no correr el día. */
function formatPlainDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FormFooter({
  saving,
  label,
  savingLabel,
  onCancel,
}: {
  saving: boolean;
  label: string;
  savingLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-full sm:flex-row sm:justify-end">
      <button type="button" className="btn-plain" onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? savingLabel : label}
      </button>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-[14px] text-red-600 sm:col-span-full">
      {error}
    </p>
  );
}

function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn-primary" onClick={onClick}>
      <Icon name="plus" className="h-[18px] w-[18px]" strokeWidth={2.4} />
      {label}
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
      <div className="segmented" role="tablist" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className="segmented-item"
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
      <NewButton label="Nueva sede" onClick={() => setOpen(true)} />
      {open && (
        <Sheet title="Nueva sede" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Dirección (opcional)</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <FormError error={error} />
            <FormFooter
              saving={saving}
              label="Crear sede"
              savingLabel="Creando..."
              onCancel={() => setOpen(false)}
            />
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Nombre</th>
              <th className="hidden px-3 py-2.5 sm:px-4 sm:table-cell">Dirección</th>
              <th className="w-20 px-3 py-2.5 sm:px-4">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campuses.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2.5 sm:px-4">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  {c.address && <p className="text-[13px] text-slate-500 sm:hidden">{c.address}</p>}
                </td>
                <td className="hidden px-3 py-2.5 sm:px-4 text-slate-500 sm:table-cell">{c.address ?? "—"}</td>
                <td className="px-3 py-2.5 sm:px-4">
                  <StatusBadge name={c.name} active={c.status === "ACTIVE"} onToggle={() => toggle(c.id)} />
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
      <NewButton label="Nuevo periodo" onClick={() => setOpen(true)} />
      {open && (
        <Sheet title="Nuevo periodo académico" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
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
            <FormError error={error} />
            <FormFooter
              saving={saving}
              label="Crear periodo"
              savingLabel="Creando..."
              onCancel={() => setOpen(false)}
            />
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Periodo</th>
              <th className="px-3 py-2.5 sm:px-4">Fechas</th>
              <th className="w-20 px-3 py-2.5 sm:px-4">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5 sm:px-4 font-semibold text-slate-900">{p.name}</td>
                <td className="px-3 py-2.5 sm:px-4 text-[14px] text-slate-500">
                  {formatPlainDate(p.startDate)} – {formatPlainDate(p.endDate)}
                </td>
                <td className="px-3 py-2.5 sm:px-4">
                  <StatusBadge name={p.name} active={p.status === "ACTIVE"} onToggle={() => toggle(p.id)} />
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
      <NewButton label="Nueva materia" onClick={() => setOpen(true)} />
      {open && (
        <Sheet title="Nueva materia" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="grid gap-4">
            <div>
              <label className="label">Nombre</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <FormError error={error} />
            <FormFooter
              saving={saving}
              label="Crear materia"
              savingLabel="Creando..."
              onCancel={() => setOpen(false)}
            />
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Materia</th>
              <th className="w-20 px-3 py-2.5 sm:px-4">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2.5 sm:px-4 font-semibold text-slate-900">{s.name}</td>
                <td className="px-3 py-2.5 sm:px-4">
                  <StatusBadge name={s.name} active={s.status === "ACTIVE"} onToggle={() => toggle(s.id)} />
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
      <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-[15px] text-amber-800">
        <Icon name="alert" className="h-5 w-5 shrink-0" />
        <p>
          Antes de crear cursos necesitas al menos una sede y un periodo académico. Créalos en las pestañas
          &quot;Sedes&quot; y &quot;Periodos&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NewButton label="Nuevo curso" onClick={startCreate} />
      {open && (
        <Sheet title={editingId ? "Editar curso" : "Nuevo curso"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
                    {JORNADA[j] ?? j}
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
            <FormError error={error} />
            <FormFooter
              saving={saving}
              label={editingId ? "Guardar cambios" : "Crear curso"}
              savingLabel="Guardando..."
              onCancel={() => setOpen(false)}
            />
          </form>
        </Sheet>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Curso</th>
              <th className="hidden px-3 py-2.5 sm:px-4 md:table-cell">Sede</th>
              <th className="hidden px-3 py-2.5 sm:px-4 md:table-cell">Periodo</th>
              <th className="hidden px-3 py-2.5 sm:px-4 md:table-cell">Jornada</th>
              <th className="hidden px-3 py-2.5 sm:px-4 text-right sm:table-cell">Estudiantes</th>
              <th className="w-20 px-3 py-2.5 sm:px-4">Activo</th>
              <th className="px-3 py-2.5 sm:px-4">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2.5 sm:px-4">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-[13px] text-slate-500 md:hidden">
                    {c.campus.name} · {JORNADA[c.jornada] ?? c.jornada} · {c._count.students} est.
                  </p>
                </td>
                <td className="hidden px-3 py-2.5 sm:px-4 md:table-cell">{c.campus.name}</td>
                <td className="hidden px-3 py-2.5 sm:px-4 md:table-cell">{c.academicPeriod.name}</td>
                <td className="hidden px-3 py-2.5 sm:px-4 md:table-cell">{JORNADA[c.jornada] ?? c.jornada}</td>
                <td className="hidden px-3 py-2.5 sm:px-4 text-right tabular-nums sm:table-cell">
                  {c._count.students}
                </td>
                <td className="px-3 py-2.5 sm:px-4">
                  <StatusBadge name={c.name} active={c.status === "ACTIVE"} onToggle={() => toggle(c.id)} />
                </td>
                <td className="px-2 py-1 text-right">
                  <button className="btn-plain px-2.5 text-[14px]" onClick={() => startEdit(c)}>
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
