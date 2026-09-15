"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, ShieldCheck, Lock, Briefcase, RefreshCw,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  ExternalLink, Sparkles
} from "lucide-react";
import { operativeAvailabilityApi } from "@/lib/api";
import type { OperativeAvailabilitySummary } from "@/types";
import { formatDate } from "@/lib/utils";

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TeamAvailabilityWidget() {
  const todayStr = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [teamMatrix, setTeamMatrix] = useState<OperativeAvailabilitySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTeamMatrix = useCallback(async (dateParam: string) => {
    setLoading(true);
    try {
      const res = await operativeAvailabilityApi.team(dateParam);
      setTeamMatrix(res.data || []);
    } catch (err) {
      console.error("Error cargando disponibilidad del personal en el dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMatrix(selectedDate);
  }, [selectedDate, loadTeamMatrix]);

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  const isToday = selectedDate === todayStr;

  // Estadísticas rápidas del día
  const totalWorkers = teamMatrix.length;
  const freeWorkers = teamMatrix.filter((w) => w.overall_status === "libre").length;
  const busyWorkers = teamMatrix.filter((w) => w.overall_status === "ocupado").length;
  const workingWorkers = teamMatrix.filter((w) => w.overall_status === "en_trabajo").length;

  return (
    <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-5 md:p-6 shadow-2xl space-y-5">
      
      {/* ─── Encabezado del Widget ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#20CDFE]/20 to-[#1ED1B4]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] shadow-lg shadow-[#20CDFE]/10">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                Disponibilidad del Personal para {formatDate(selectedDate)}
              </h3>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-[#20CDFE]/20 text-[#20CDFE] text-[10px] font-black uppercase border border-[#20CDFE]/30">
                  Hoy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Total: <strong className="text-slate-200">{totalWorkers} trabajadores</strong> ({freeWorkers} libres, {workingWorkers} con actividades, {busyWorkers} ocupados)
            </p>
          </div>
        </div>

        {/* Controles de Navegación de Fecha */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-[#15233D]/70 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => changeDay(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <CalendarIcon size={13} className="text-[#20CDFE]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer focus:ring-0 [color-scheme:dark]"
              />
            </div>

            <button
              onClick={() => changeDay(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-2 rounded-xl bg-[#15233D] border border-[#20CDFE]/30 text-[#20CDFE] text-xs font-bold hover:bg-[#20CDFE]/20 transition-all flex items-center gap-1 shadow-sm"
            >
              <Sparkles size={12} />
              Ir a Hoy
            </button>
          )}

          <button
            onClick={() => loadTeamMatrix(selectedDate)}
            className="p-2 bg-[#15233D] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors"
            title="Recargar disponibilidad"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/agenda"
            className="px-3 py-2 rounded-xl bg-[#20CDFE]/10 hover:bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            title="Abrir agenda completa"
          >
            <span>Ver Agenda</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* ─── Leyenda de Estados ─── */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold bg-[#15233D]/40 border border-slate-800/60 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
          <span>🟢 LIBRE (Disponible)</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span>🔴 OCUPADO (Bloqueo Freelance)</span>
        </div>
        <div className="flex items-center gap-2 text-[#20CDFE]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#20CDFE] shadow-sm shadow-[#20CDFE]/50" />
          <span>🟡 EN TRABAJO (Con Actividades)</span>
        </div>
      </div>

      {/* ─── Grid de Tarjetas de Disponibilidad ─── */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
        </div>
      ) : teamMatrix.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          <Users size={36} className="mx-auto mb-2 opacity-25" />
          <p>No se encontraron trabajadores en el equipo para esta fecha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMatrix.map((worker) => {
            const isLibre = worker.overall_status === "libre";
            const isOcupado = worker.overall_status === "ocupado";
            const isEnTrabajo = worker.overall_status === "en_trabajo";

            return (
              <div
                key={worker.user_id}
                className={`border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-lg ${
                  isLibre
                    ? "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10 hover:bg-emerald-950/20"
                    : isOcupado
                    ? "border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10 hover:bg-amber-950/20"
                    : "border-[#20CDFE]/30 hover:border-[#20CDFE]/60 bg-[#20CDFE]/5 hover:bg-[#20CDFE]/10"
                }`}
              >
                <div>
                  {/* Encabezado del Trabajador */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                        {worker.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-sm leading-snug truncate">
                          {worker.user_name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate capitalize">
                          {worker.user_position || (worker.user_role === "administrador" ? "Administrador" : "Operativo")}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Estado */}
                    <div className="shrink-0">
                      {isLibre && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                          <ShieldCheck size={12} /> LIBRE
                        </span>
                      )}
                      {isOcupado && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                          <Lock size={12} /> OCUPADO
                        </span>
                      )}
                      {isEnTrabajo && (
                        <span className="px-2.5 py-1 rounded-full bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                          <Briefcase size={12} /> EN TRABAJO ({worker.assigned_activities_count})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalle de Bloqueos Ocupados */}
                  {isOcupado && worker.busy_blocks.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        HORARIOS OCUPADOS:
                      </span>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {worker.busy_blocks.map((b) => (
                          <div
                            key={b.id}
                            className="text-xs text-slate-300 bg-[#0A101D]/80 px-2.5 py-1.5 rounded-xl border border-slate-800/60 flex items-center justify-between gap-2 shadow-sm"
                          >
                            <span className="font-bold text-amber-300 shrink-0">
                              {b.is_full_day ? "Día Completo" : `${b.start_time} - ${b.end_time}`}
                            </span>
                            {b.reason && (
                              <span className="text-[11px] text-slate-400 italic truncate max-w-[150px]">
                                {b.reason}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detalle de Actividades Asignadas */}
                  {isEnTrabajo && worker.assigned_activities_titles.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#20CDFE]">
                        ACTIVIDADES ASIGNADAS HOY:
                      </span>
                      <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {worker.assigned_activities_titles.map((title, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-300 bg-[#0A101D]/80 px-2.5 py-1.5 rounded-xl border border-slate-800/60 truncate flex items-center gap-2 shadow-sm"
                            title={title}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#20CDFE] shrink-0" />
                            <span className="truncate">{title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Estado Libre */}
                  {isLibre && (
                    <div className="border-t border-slate-800/80 pt-2.5 mt-2 text-xs text-emerald-400/80 italic font-medium">
                      Sin bloqueos freelance ni actividades asignadas en esta fecha.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
