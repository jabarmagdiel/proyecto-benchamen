"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, ShieldCheck, Lock, Briefcase, RefreshCw,
  ExternalLink
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
  const [teamMatrix, setTeamMatrix] = useState<OperativeAvailabilitySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTeamMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operativeAvailabilityApi.team(todayStr);
      setTeamMatrix(res.data || []);
    } catch (err) {
      console.error("Error cargando disponibilidad del personal:", err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadTeamMatrix();
  }, [loadTeamMatrix]);

  const freeWorkers = teamMatrix.filter((w) => w.overall_status === "libre").length;
  const busyWorkers = teamMatrix.filter((w) => w.overall_status === "ocupado").length;
  const workingWorkers = teamMatrix.filter((w) => w.overall_status === "en_trabajo").length;

  return (
    <div className="bg-[#0A101D]/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Header Compacto */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE]">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              Disponibilidad del Personal (Hoy)
              <span className="text-xs font-normal text-slate-400">· {formatDate(todayStr)}</span>
            </h3>
          </div>
        </div>

        {/* Resumen de estados y enlace */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-3 font-semibold text-[11px] bg-[#15233D]/50 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {freeWorkers} Libres
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-[#20CDFE]">
              <span className="w-2 h-2 rounded-full bg-[#20CDFE]" /> {workingWorkers} En Trabajo
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> {busyWorkers} Ocupados
            </span>
          </div>

          <button
            onClick={loadTeamMatrix}
            className="p-1.5 bg-[#15233D] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors"
            title="Recargar disponibilidad de hoy"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/agenda"
            className="flex items-center gap-1 text-[11px] font-bold text-[#20CDFE] hover:text-[#1ED1B4] px-2.5 py-1.5 rounded-lg bg-[#20CDFE]/10 hover:bg-[#20CDFE]/20 transition-colors"
            title="Abrir agenda completa"
          >
            <span>Ver Agenda</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Grid Compacto de Trabajadores */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
        </div>
      ) : teamMatrix.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          No hay trabajadores registrados en el equipo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {teamMatrix.map((worker) => {
            const isLibre = worker.overall_status === "libre";
            const isOcupado = worker.overall_status === "ocupado";
            const isEnTrabajo = worker.overall_status === "en_trabajo";

            return (
              <div
                key={worker.user_id}
                className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                  isLibre
                    ? "border-emerald-500/20 bg-emerald-950/10"
                    : isOcupado
                    ? "border-amber-500/20 bg-amber-950/10"
                    : "border-[#20CDFE]/20 bg-[#20CDFE]/5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-black text-xs flex items-center justify-center shrink-0">
                        {worker.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs leading-tight truncate">
                          {worker.user_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {worker.user_position || (worker.user_role === "administrador" ? "Administrador" : "Operativo")}
                        </p>
                      </div>
                    </div>

                    {isLibre && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black shrink-0">
                        LIBRE
                      </span>
                    )}
                    {isOcupado && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black shrink-0">
                        OCUPADO
                      </span>
                    )}
                    {isEnTrabajo && (
                      <span className="px-2 py-0.5 rounded-md bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30 text-[9px] font-black shrink-0">
                        TRABAJO ({worker.assigned_activities_count})
                      </span>
                    )}
                  </div>

                  {/* Estado / Horarios / Actividades */}
                  {isLibre && (
                    <p className="text-[10px] text-emerald-400/80 italic pt-1 border-t border-slate-800/50">
                      Disponible todo el día
                    </p>
                  )}

                  {isOcupado && worker.busy_blocks.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-800/50 text-[10px]">
                      {worker.busy_blocks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-slate-300 bg-[#0A101D]/70 px-2 py-1 rounded-lg border border-slate-800/50">
                          <span className="font-bold text-amber-300">
                            {b.is_full_day ? "Día Completo" : `${b.start_time} - ${b.end_time}`}
                          </span>
                          {b.reason && <span className="text-slate-400 truncate max-w-[110px] italic">{b.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {isEnTrabajo && worker.assigned_activities_titles.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-800/50 text-[10px]">
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5">
                        {worker.assigned_activities_titles.map((title, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-300 bg-[#0A101D]/70 px-2 py-1 rounded-lg border border-slate-800/50 truncate" title={title}>
                            <span className="w-1 h-1 rounded-full bg-[#20CDFE] shrink-0" />
                            <span className="truncate">{title}</span>
                          </div>
                        ))}
                      </div>
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
