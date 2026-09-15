import { describe, expect, it } from "vitest";
import {
  computeAlertLevel,
  computeAttendanceStats,
  DEFAULT_ALERT_CONFIG,
} from "@/lib/alerts";

function d(day: number) {
  return new Date(Date.UTC(2026, 8, day));
}

describe("computeAttendanceStats", () => {
  it("devuelve 100% y cero ausencias cuando no hay registros", () => {
    const stats = computeAttendanceStats([]);
    expect(stats).toEqual({
      absenceCount: 0,
      consecutiveAbsences: 0,
      attendancePercentage: 100,
      lastAbsenceDate: null,
    });
  });

  it("cuenta ausencias totales y guarda la fecha de la última", () => {
    const stats = computeAttendanceStats([
      { status: "PRESENTE", date: d(1) },
      { status: "AUSENTE", date: d(2) },
      { status: "PRESENTE", date: d(3) },
      { status: "AUSENTE", date: d(4) },
    ]);
    expect(stats.absenceCount).toBe(2);
    expect(stats.lastAbsenceDate).toEqual(d(4));
  });

  it("cuenta solo las ausencias consecutivas más recientes", () => {
    const stats = computeAttendanceStats([
      { status: "AUSENTE", date: d(1) },
      { status: "PRESENTE", date: d(2) },
      { status: "AUSENTE", date: d(3) },
      { status: "AUSENTE", date: d(4) },
      { status: "AUSENTE", date: d(5) },
    ]);
    expect(stats.consecutiveAbsences).toBe(3);
    expect(stats.absenceCount).toBe(4);
  });

  it("las ausencias consecutivas son 0 si el registro más reciente es presente", () => {
    const stats = computeAttendanceStats([
      { status: "AUSENTE", date: d(1) },
      { status: "AUSENTE", date: d(2) },
      { status: "PRESENTE", date: d(3) },
    ]);
    expect(stats.consecutiveAbsences).toBe(0);
  });

  it("TARDE y JUSTIFICADO cuentan como asistencia efectiva para el porcentaje", () => {
    const stats = computeAttendanceStats([
      { status: "TARDE", date: d(1) },
      { status: "JUSTIFICADO", date: d(2) },
      { status: "AUSENTE", date: d(3) },
      { status: "PRESENTE", date: d(4) },
    ]);
    expect(stats.attendancePercentage).toBe(75);
  });
});

describe("computeAlertLevel", () => {
  const config = DEFAULT_ALERT_CONFIG; // seguimiento=3, alerta=5, consecutivas=3, minPct=80

  it("NORMAL cuando la asistencia está dentro de los límites", () => {
    const level = computeAlertLevel(config, {
      absenceCount: 1,
      consecutiveAbsences: 1,
      attendancePercentage: 95,
      lastAbsenceDate: null,
    });
    expect(level).toBe("NORMAL");
  });

  it("SEGUIMIENTO al alcanzar el umbral de ausencias acumuladas", () => {
    const level = computeAlertLevel(config, {
      absenceCount: 3,
      consecutiveAbsences: 1,
      attendancePercentage: 90,
      lastAbsenceDate: null,
    });
    expect(level).toBe("SEGUIMIENTO");
  });

  it("SEGUIMIENTO cuando el porcentaje de asistencia cae por debajo del mínimo aunque las ausencias sean pocas", () => {
    const level = computeAlertLevel(config, {
      absenceCount: 1,
      consecutiveAbsences: 1,
      attendancePercentage: 70,
      lastAbsenceDate: null,
    });
    expect(level).toBe("SEGUIMIENTO");
  });

  it("ALERTA al alcanzar el umbral de ausencias totales", () => {
    const level = computeAlertLevel(config, {
      absenceCount: 5,
      consecutiveAbsences: 1,
      attendancePercentage: 85,
      lastAbsenceDate: null,
    });
    expect(level).toBe("ALERTA");
  });

  it("ALERTA por ausencias consecutivas aunque el total acumulado sea bajo", () => {
    const level = computeAlertLevel(config, {
      absenceCount: 3,
      consecutiveAbsences: 3,
      attendancePercentage: 88,
      lastAbsenceDate: null,
    });
    expect(level).toBe("ALERTA");
  });

  it("respeta umbrales configurados distintos a los valores por defecto", () => {
    const customConfig = {
      seguimientoThreshold: 1,
      alertaThreshold: 2,
      consecutiveThreshold: 10,
      minAttendancePercent: 50,
      periodDays: 30,
    };
    expect(
      computeAlertLevel(customConfig, {
        absenceCount: 1,
        consecutiveAbsences: 1,
        attendancePercentage: 90,
        lastAbsenceDate: null,
      }),
    ).toBe("SEGUIMIENTO");
    expect(
      computeAlertLevel(customConfig, {
        absenceCount: 2,
        consecutiveAbsences: 1,
        attendancePercentage: 90,
        lastAbsenceDate: null,
      }),
    ).toBe("ALERTA");
  });
});
