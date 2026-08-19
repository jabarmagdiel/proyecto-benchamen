"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, Play, Send, Clock, Eye, Filter, LayoutList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { companiesApi, activitiesApi } from "@/lib/api";
import type { Activity, ActivityStatus, Company } from "@/types";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue, STATUS_COLORS } from "@/lib/utils";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendarUtils";
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showHistory, setShowHistory] = useState(false);

  const isToday = (dateInput?: string | Date | null) => {
    if (!dateInput) return false;
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };
  
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
      const [r, compRes] = await Promise.all([
        activitiesApi.myActivities(params),
        companiesApi.list().catch(() => ({ data: [] })),
      ]);
      setActivities(r.data);
      setCompanies(compRes.data || []);
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

  const filteredActivities = activities.filter(a => {
    if (filterStatus === "atrasada") {
      if (!isOverdue(a.deadline, a.status)) return false;
    }
    if (filterCompanyId === "none") {
      if (a.company_name && a.company_name !== "Sin Empresa / Cliente Externo" && a.company_id) return false;
    } else if (filterCompanyId) {
      if (String(a.company_id) !== filterCompanyId && !a.company_name?.toLowerCase().includes(filterCompanyId.toLowerCase())) {
        return false;
      }
    }
    // Auto-ocultar completadas y canceladas de días anteriores si showHistory es false
    if (!showHistory && filterStatus !== "atrasada") {
      if (a.status === "aprobada") {
        return isToday(a.approved_at || a.updated_at);
      }
      if (a.status === "cancelada") {
        return isToday(a.updated_at);
      }
    }
    return true;
  });

  const groupedByStatus = filteredActivities.reduce((acc, a) => {
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
        <h2 className="text-xl font-bold text-white">Mis actividades</h2>
        <p className="text-slate-400 text-sm mt-0.5">Hola {user?.name} · {filteredActivities.length} actividad{filteredActivities.length !== 1 ? "es" : ""} asignada{filteredActivities.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filtro y Vista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 text-white font-medium">
            <option value="">Todos los estados</option>
            <option value="atrasada">⚠️ Tareas Atrasadas</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterCompanyId} onChange={e => setFilterCompanyId(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 text-white">
            <option value="">Todas las empresas</option>
            <option value="none">👤 Sin Empresa / Cliente Externo</option>
            {companies.map(c => <option key={c.id} value={String(c.id)}>🏢 {c.name}</option>)}
          </select>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
              showHistory
                ? "bg-purple-900/40 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10"
                : "bg-[#0A101D]/80 text-slate-400 border-slate-800/50 hover:text-white"
            }`}
            title={showHistory ? "Mostrando todas tus actividades completadas y canceladas" : "Ocultando completadas y canceladas de días anteriores"}
          >
            <Clock size={15} className={showHistory ? "text-purple-400" : "text-slate-400"} />
            <span>{showHistory ? "Histórico Completo" : "Solo Actividades de Hoy"}</span>
          </button>
        </div>
        
        <div className="flex items-center bg-[#1C2C4D] p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "list" ? "bg-[#0A101D]/80 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            <LayoutList size={16} /> Lista
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-[#0A101D]/80 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            <CalendarIcon size={16} /> Calendario
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
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
                        <div key={a.id} className={`bg-[#0A101D]/80 rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3 ${overdue ? "border-red-200 bg-red-50/20" : "border-slate-800/50"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Link href={`/actividades/${a.id}`} className="font-semibold text-white hover:text-[#20CDFE] transition-colors line-clamp-2 block">
                                {a.title}
                              </Link>
                              <p className="text-slate-400 text-xs mt-1">{a.project_name} · {a.company_name}</p>
                            </div>
                            <PriorityBadge priority={a.priority} />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="bg-[#1C2C4D] px-2 py-0.5 rounded-md">{ACTIVITY_TYPE_LABELS[a.activity_type]}</span>
                            {overdue && <span className="text-red-600 font-medium">⚠️ Atrasada</span>}
                          </div>

                          {a.description && (
                            <div className="bg-[#15233D]/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 space-y-1">
                              <span className="text-[#20CDFE] font-extrabold text-[11px] uppercase tracking-wider block">📝 Concepto del Trabajo:</span>
                              <p className="line-clamp-3 leading-relaxed text-slate-300">{a.description}</p>
                            </div>
                          )}

                          {a.deadline && (
                            <div className="flex items-center justify-between gap-1.5 text-xs pt-1 border-t border-slate-800/40">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className={overdue ? "text-red-500" : "text-slate-400"} />
                                <span className={overdue ? "text-red-600 font-medium" : "text-slate-400"}>
                                  Vence: {formatDate(a.deadline)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={getGoogleCalendarUrl({
                                    title: `[Benchamen] ${a.title}`,
                                    description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                                    date: a.deadline,
                                    startTime: "09:00",
                                    endTime: "18:00"
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#4285F4]/20 text-[#4285F4] hover:bg-[#4285F4]/30 border border-[#4285F4]/30 flex items-center gap-1 transition-colors"
                                  title="Añadir fecha de entrega a Google Calendar"
                                >
                                  📅 Google Calendar
                                </a>
                                <button
                                  onClick={() => downloadIcsFile({
                                    title: `[Benchamen] ${a.title}`,
                                    description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                                    date: a.deadline!,
                                    startTime: "09:00",
                                    endTime: "18:00"
                                  })}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors"
                                  title="Descargar iCal (.ics)"
                                >
                                  📥 iCal
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-auto pt-2 border-t border-[#2E455C]/20">
                            <Link href={`/actividades/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-[#20CDFE] bg-[#1C2C4D] hover:bg-[#20CDFE]/20 px-3 py-2 rounded-lg transition-colors font-medium">
                              <Eye size={13} /> Ver detalle
                            </Link>
                            {a.status === "bloqueada" ? (
                              <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-stone-500 bg-stone-100 px-3 py-2 rounded-lg font-medium cursor-not-allowed" title="Depende de una actividad anterior">
                                <Lock size={13} /> Bloqueada
                              </div>
                            ) : (
                              <>
                                {["pendiente", "asignada"].includes(a.status) && (
                                  <button onClick={() => handleStart(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg transition-colors font-medium">
                                    <Play size={13} /> Iniciar
                                  </button>
                                )}
                                {["en_proceso", "observada"].includes(a.status) && (
                                  <button onClick={() => handleSendReview(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors font-medium">
                                    <Send size={13} /> Enviar a Revisión
                                  </button>
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
          <div className="bg-[#0A101D]/80 rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <h3 className="font-bold text-lg text-white">{MONTHS[calMonth]} {calYear}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    let m = calMonth - 1; let y = calYear;
                    if (m < 0) { m = 11; y--; }
                    setCalMonth(m); setCalYear(y);
                  }}
                  className="p-2 hover:bg-[#1C2C4D] rounded-lg text-slate-300"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => { setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); }}
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-[#1C2C4D] rounded-lg"
                >
                  Hoy
                </button>
                <button
                  onClick={() => {
                    let m = calMonth + 1; let y = calYear;
                    if (m > 11) { m = 0; y++; }
                    setCalMonth(m); setCalYear(y);
                  }}
                  className="p-2 hover:bg-[#1C2C4D] rounded-lg text-slate-300"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-slate-800/50">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-slate-400">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-[120px]">
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-slate-800/50 bg-[#0F192E]" />
              ))}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                
                // Formateamos la fecha para comparar con activity.deadline
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                
                const dayActivities = activities.filter(a => {
                  const start = a.start_date ? a.start_date.split('T')[0] : (a.deadline ? a.deadline.split('T')[0] : null);
                  const end = a.deadline ? a.deadline.split('T')[0] : (a.start_date ? a.start_date.split('T')[0] : null);
                  if (!start || !end) return false;
                  return dateStr >= start && dateStr <= end;
                });
                
                return (
                  <div key={day} className="border-b border-r border-slate-800/50 p-2 overflow-y-auto">
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayActivities.map(a => {
                        const start = a.start_date ? a.start_date.split('T')[0] : (a.deadline ? a.deadline.split('T')[0] : "");
                        const end = a.deadline ? a.deadline.split('T')[0] : (a.start_date ? a.start_date.split('T')[0] : "");
                        const isStart = dateStr === start;
                        const isEnd = dateStr === end;
                        return (
                          <Link 
                            key={a.id} 
                            href={`/actividades/${a.id}`}
                            className={`block text-[10px] px-1.5 py-1 font-medium truncate transition-colors ${
                              isStart && isEnd ? "rounded-md bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B]" :
                              isStart ? "rounded-l-md bg-gradient-to-r from-[#20CDFE] to-[#20CDFE]/80 text-[#07060B]" :
                              isEnd ? "rounded-r-md bg-gradient-to-r from-[#20CDFE]/60 to-[#1ED1B4] text-[#07060B]" :
                              "bg-[#20CDFE]/40 text-transparent"
                            } hover:opacity-80`}
                            title={`${a.title} (${start} al ${end})`}
                          >
                            {isStart ? a.title : (isEnd ? "Fin: " + a.title : "\u00A0")}
                          </Link>
                        );
                      })}
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
