"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, Play, Send, Clock, Eye, Filter, LayoutList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { activitiesApi } from "@/lib/api";
import type { Activity, ActivityStatus } from "@/types";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MisActividadesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const r = await activitiesApi.myActivities(params);
      setActivities(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStart = async (id: number) => {
    try { await activitiesApi.start(id); showToast("Actividad iniciada ▶️"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleSendReview = async (id: number) => {
    try { await activitiesApi.sendReview(id); showToast("Enviado a revisión 📤"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const groupedByStatus = activities.reduce((acc, a) => {
    if (!acc[a.status]) acc[a.status] = [];
    acc[a.status].push(a);
    return acc;
  }, {} as Record<ActivityStatus, Activity[]>);

  const statusOrder: ActivityStatus[] = ["asignada", "bloqueada", "en_proceso", "en_revision", "observada", "aprobada", "cancelada", "pendiente"];

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mis actividades</h2>
        <p className="text-slate-500 text-sm mt-0.5">Hola {user?.name} · {activities.length} actividad{activities.length !== 1 ? "es" : ""} asignada{activities.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filtro y Vista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
            <option value="">Todos los estados</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <LayoutList size={16} /> Lista
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <CalendarIcon size={16} /> Calendario
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-lg">¡Todo listo!</p>
          <p className="text-sm mt-1">No tienes actividades asignadas en este momento.</p>
        </div>
      ) : (
        viewMode === "list" ? (
          <div className="space-y-8">
            {statusOrder.map((status) => {
              const group = groupedByStatus[status];
              if (!group || group.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-4">
                    <StatusBadge status={status} />
                    <span className="text-slate-400 text-sm">({group.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.map((a) => {
                      const overdue = isOverdue(a.deadline, a.status);
                      return (
                        <div key={a.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3 ${overdue ? "border-red-200 bg-red-50/20" : "border-slate-100"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Link href={`/actividades/${a.id}`} className="font-semibold text-slate-800 hover:text-violet-600 transition-colors line-clamp-2 block">
                                {a.title}
                              </Link>
                              <p className="text-slate-400 text-xs mt-1">{a.project_name} · {a.company_name}</p>
                            </div>
                            <PriorityBadge priority={a.priority} />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{ACTIVITY_TYPE_LABELS[a.activity_type]}</span>
                            {overdue && <span className="text-red-600 font-medium">⚠️ Atrasada</span>}
                          </div>

                          {a.deadline && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock size={12} className={overdue ? "text-red-500" : "text-slate-400"} />
                              <span className={overdue ? "text-red-600 font-medium" : "text-slate-500"}>
                                Vence: {formatDate(a.deadline)}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
                            <Link href={`/actividades/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-violet-600 bg-slate-100 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors font-medium">
                              <Eye size={13} /> Ver detalle
                            </Link>
                            {a.status === "bloqueada" ? (
                              <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-stone-500 bg-stone-100 px-3 py-2 rounded-lg font-medium cursor-not-allowed" title="Depende de una actividad anterior">
                                <Lock size={13} /> Bloqueada
                              </div>
                            ) : (
                              <>
                                {a.status === "asignada" && (
                                  <button onClick={() => handleStart(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg transition-colors font-medium">
                                    <Play size={13} /> Iniciar
                                  </button>
                                )}
                                {a.status === "en_proceso" && (
                                  <button onClick={() => handleSendReview(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors font-medium">
                                    <Send size={13} /> Enviar
                                  </button>
                                )}
                                {a.status === "observada" && (
                                  <Link href={`/actividades/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg transition-colors font-medium">
                                    Ver observación →
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{MONTHS[calMonth]} {calYear}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    let m = calMonth - 1; let y = calYear;
                    if (m < 0) { m = 11; y--; }
                    setCalMonth(m); setCalYear(y);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => { setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); }}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hoy
                </button>
                <button
                  onClick={() => {
                    let m = calMonth + 1; let y = calYear;
                    if (m > 11) { m = 0; y++; }
                    setCalMonth(m); setCalYear(y);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-[120px]">
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/50" />
              ))}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                
                // Formateamos la fecha para comparar con activity.deadline
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                
                const dayActivities = activities.filter(a => a.deadline === dateStr);
                
                return (
                  <div key={day} className="border-b border-r border-slate-100 p-2 overflow-y-auto">
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>
                      {day}
                    </div>
                    <div className="space-y-1.5">
                      {dayActivities.map(a => (
                        <Link 
                          key={a.id} 
                          href={`/actividades/${a.id}`}
                          className="block text-xs p-1.5 rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 truncate"
                          title={a.title}
                        >
                          {a.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
