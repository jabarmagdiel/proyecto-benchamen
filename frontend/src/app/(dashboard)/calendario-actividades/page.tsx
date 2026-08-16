"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon, Clock, Search, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, AlertTriangle, XCircle, Eye, RefreshCw, CalendarCheck,
  Download, ExternalLink, List, LayoutGrid, CalendarDays
} from "lucide-react";
import { activitiesApi, companiesApi, usersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendarUtils";
import { useAuth } from "@/context/AuthContext";
import type { Activity, Company, User as UserType, ActivityType, ActivityStatus } from "@/types";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS } from "@/types";

/* ───── Constantes & Helpers ───── */
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const FULL_DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; icon: any }> = {
  pendiente: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", icon: Clock },
  en_proceso: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", dot: "bg-blue-400", icon: RefreshCw },
  en_revision: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30", dot: "bg-purple-400", icon: Eye },
  aprobada: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400", icon: CheckCircle2 },
  observada: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", icon: AlertTriangle },
  cancelada: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400", icon: XCircle },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarioActividadesPage() {
  const { user, profile } = useAuth();
  const isAdmin = user?.role === "administrador";
  const isClient = user?.role === "cliente";
  const isOperative = !isAdmin && !isClient;

  /* Estado de Carga */
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [operatives, setOperatives] = useState<UserType[]>([]);

  /* Vista seleccionada: 'month' | 'week' | 'list' */
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");

  /* Fecha y Navegación del Calendario */
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
  );

  /* Modal de Detalle de Actividad */
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [dayOverviewDate, setDayOverviewDate] = useState<string | null>(null);

  /* Filtros */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState<string>("");
  const [filterOperativeId, setFilterOperativeId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  /* Carga de Datos */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let actRes;
      if (isOperative) {
        actRes = await activitiesApi.myActivities();
      } else {
        const params: any = {};
        if (isClient && profile?.company_id) {
          params.company_id = profile.company_id;
        }
        actRes = await activitiesApi.list(params);
      }
      setActivities(actRes.data || []);

      const [compRes, usersRes] = await Promise.all([
        companiesApi.list().catch(() => ({ data: [] })),
        isAdmin ? usersApi.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setCompanies(compRes.data || []);
      if (isAdmin) {
        setOperatives((usersRes.data || []).filter((u: UserType) => u.role !== "cliente"));
      }
    } catch (error) {
      console.error("Error al cargar actividades del calendario:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isClient, isOperative, profile?.company_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Filtrar Actividades */
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Texto de búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = act.title?.toLowerCase().includes(q);
        const matchDesc = act.description?.toLowerCase().includes(q);
        const matchComp = act.company_name?.toLowerCase().includes(q) || act.project_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchComp) return false;
      }
      // Filtro de empresa
      if (filterCompanyId === "none") {
        if (act.company_name && act.company_name !== "Sin Empresa / Cliente Externo" && act.company_id) return false;
      } else if (filterCompanyId) {
        if (String(act.company_id) !== filterCompanyId && !act.company_name?.toLowerCase().includes(filterCompanyId.toLowerCase())) {
          return false;
        }
      }
      // Filtro de operador
      if (filterOperativeId && String(act.assigned_user_id) !== filterOperativeId) {
        return false;
      }
      // Filtro de estado
      if (filterStatus && act.status !== filterStatus) {
        return false;
      }
      // Filtro de tipo
      const actType = act.activity_type || (act as any).type;
      if (filterType && actType !== filterType) {
        return false;
      }
      return true;
    });
  }, [activities, searchTerm, filterCompanyId, filterOperativeId, filterStatus, filterType]);

  /* Mapeo de actividades por fecha (deadline / created_at) */
  const activitiesByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    filteredActivities.forEach((act) => {
      const rawDate = act.deadline || (act as any).due_date || act.created_at;
      if (!rawDate) return;
      const datePart = rawDate.split("T")[0];
      if (!map[datePart]) map[datePart] = [];
      map[datePart].push(act);
    });
    return map;
  }, [filteredActivities]);

  /* Métricas KPIs */
  const totalCount = filteredActivities.length;
  const inProgressCount = filteredActivities.filter(a => a.status === "en_proceso").length;
  const pendingCount = filteredActivities.filter(a => a.status === "pendiente").length;
  const reviewCount = filteredActivities.filter(a => a.status === "en_revision").length;
  const approvedCount = filteredActivities.filter(a => a.status === "aprobada").length;
  const overdueCount = filteredActivities.filter(a => {
    if (a.status === "aprobada" || a.status === "cancelada") return false;
    const dueDate = (a.deadline || (a as any).due_date)?.split("T")[0];
    return dueDate && dueDate < todayStr;
  }).length;

  /* Controles Navegación de Mes */
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };
  const goToToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDayStr(todayStr);
  };

  /* Días del Mes Actual */
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  /* Fechas de la semana seleccionada (Vista Semanal) */
  const weekDays = useMemo(() => {
    const refDate = new Date(selectedDayStr + "T00:00:00");
    const dayOfWeek = refDate.getDay();
    const sunday = new Date(refDate);
    sunday.setDate(refDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      days.push({
        dateStr: ds,
        dayNum: d.getDate(),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        dayName: DAY_NAMES[d.getDay()],
        isToday: ds === todayStr,
      });
    }
    return days;
  }, [selectedDayStr, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">

      {/* ── Header Principal con KPIs ── */}
      <div className="bg-[#0A101D]/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#20CDFE]/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#20CDFE]/30 to-[#1ED1B4]/20 border border-[#20CDFE]/40 flex items-center justify-center text-[#20CDFE] shadow-lg shadow-[#20CDFE]/10">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    Calendario de Actividades
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">
                    {isOperative
                      ? "Planificación y fechas de entrega de tus trabajos asignados."
                      : isClient
                      ? "Cronograma de entregables y actividades programadas para tu empresa."
                      : "Control global de trabajos, entregas y operaciones en tiempo real."}
                  </p>
                </div>
              </div>
            </div>

            {/* Alternador de Vistas */}
            <div className="flex items-center gap-1.5 bg-[#07060B]/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode("month")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "month"
                    ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-md shadow-[#20CDFE]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid size={14} />
                Mes Grande
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "week"
                    ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-md shadow-[#20CDFE]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarDays size={14} />
                Semana
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-md shadow-[#20CDFE]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List size={14} />
                Lista / Agenda
              </button>
            </div>
          </div>

          {/* Tarjetas de KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-[#07060B]/60 border border-slate-800 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-white">{totalCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Tareas</div>
            </div>
            <div className="bg-[#07060B]/60 border border-blue-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-blue-400">{inProgressCount}</div>
              <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mt-0.5">En Proceso</div>
            </div>
            <div className="bg-[#07060B]/60 border border-amber-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-amber-400">{pendingCount}</div>
              <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">Pendientes</div>
            </div>
            <div className="bg-[#07060B]/60 border border-purple-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-purple-400">{reviewCount}</div>
              <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-0.5">En Revisión</div>
            </div>
            <div className="bg-[#07060B]/60 border border-emerald-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-emerald-400">{approvedCount}</div>
              <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Completadas</div>
            </div>
            <div className="bg-[#07060B]/60 border border-rose-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-rose-400">{overdueCount}</div>
              <div className="text-[10px] text-rose-300 font-bold uppercase tracking-wider mt-0.5">Vencidas 🚨</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de Controles y Filtros ── */}
      <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        
        {/* Navegador de Fecha */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#07060B]/80 border border-slate-800 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-extrabold text-white text-sm px-3 min-w-[140px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3.5 py-2 rounded-xl bg-[#15233D] border border-[#20CDFE]/30 text-[#20CDFE] text-xs font-bold hover:bg-[#20CDFE]/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            Ir a Hoy
          </button>
        </div>

        {/* Buscador y Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-4xl justify-end">
          {/* Búsqueda por texto */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, empresa..."
              className="w-full pl-9 pr-3 py-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-xs text-[#20CDFE] placeholder-slate-500 focus:outline-none focus:border-[#20CDFE]"
            />
          </div>
          {/* Filtro Empresa */}
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="px-3 py-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#20CDFE]"
          >
            <option value="">Todas las Empresas</option>
            <option value="none">👤 Sin Empresa / Cliente Externo</option>
            {companies.map((c) => (
              <option key={c.id} value={String(c.id)}>
                🏢 {c.name}
              </option>
            ))}
          </select>

          {/* Filtro Operador (Solo Admin) */}
          {isAdmin && operatives.length > 0 && (
            <select
              value={filterOperativeId}
              onChange={(e) => setFilterOperativeId(e.target.value)}
              className="px-3 py-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#20CDFE]"
            >
              <option value="">Todos los Operadores</option>
              {operatives.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.role})
                </option>
              ))}
            </select>
          )}

          {/* Filtro Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#20CDFE]"
          >
            <option value="">Todos los Estados</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="en_proceso">⚙️ En Proceso</option>
            <option value="en_revision">👁️ En Revisión</option>
            <option value="aprobada">✅ Aprobada</option>
            <option value="observada">⚠️ Observada</option>
            <option value="cancelada">❌ Cancelada</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#20CDFE]"
          >
            <option value="">Todos los Tipos</option>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          {/* Recargar */}
          <button
            onClick={loadData}
            title="Recargar datos"
            className="p-2 bg-[#07060B]/80 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ════════════ VISTA 1: CALENDARIO MENSUAL GRANDE (FULL-WIDTH GRID) ════════════ */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "month" && (
        <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden">
          
          {/* Encabezado Nombres de Días */}
          <div className="grid grid-cols-7 gap-2 mb-3 border-b border-slate-800/80 pb-3">
            {DAY_NAMES.map((d, idx) => (
              <div key={d} className="text-center font-extrabold text-xs uppercase tracking-wider text-slate-400">
                <span className="hidden md:inline">{FULL_DAY_NAMES[idx]}</span>
                <span className="md:hidden">{d}</span>
              </div>
            ))}
          </div>

          {/* Grid Principal de Días */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Celda vacías del inicio de mes */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[120px] md:min-h-[145px] bg-[#07060B]/20 rounded-2xl border border-slate-800/30 opacity-40 pointer-events-none"
                />
              ))}

              {/* Celdas de días del mes */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = toDateStr(currentYear, currentMonth, dayNum);
                const dayActivities = activitiesByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDayStr;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDayStr(dateStr)}
                    className={`min-h-[120px] md:min-h-[145px] rounded-2xl p-2 md:p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-[#15233D]/90 border-[#20CDFE] shadow-lg shadow-[#20CDFE]/10"
                        : isToday
                        ? "bg-[#0F192E] border-[#20CDFE]/50"
                        : "bg-[#07060B]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#0A101D]"
                    }`}
                  >
                    {/* Header del Día */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                          isToday
                            ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-md shadow-[#20CDFE]/30"
                            : isSelected
                            ? "text-[#20CDFE] font-black"
                            : "text-slate-300 font-bold"
                        }`}
                      >
                        {dayNum}
                      </span>

                      {dayActivities.length > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          {dayActivities.length}
                        </span>
                      )}
                    </div>

                    {/* Chips de Actividades dentro de la celda */}
                    <div className="space-y-1.5 flex-1 overflow-hidden">
                      {dayActivities.slice(0, 3).map((act) => {
                        const conf = STATUS_CONFIG[act.status] || STATUS_CONFIG.pendiente;
                        const dueDate = (act.deadline || (act as any).due_date)?.split("T")[0];
                        const isOverdue = act.status !== "aprobada" && act.status !== "cancelada" && dueDate && dueDate < todayStr;

                        return (
                          <div
                            key={act.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(act);
                            }}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold transition-all hover:scale-[1.02] flex items-center justify-between gap-1 truncate ${
                              conf.bg
                            } ${conf.text} ${conf.border} ${
                              isOverdue ? "ring-1 ring-rose-500/80 animate-pulse" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                              <span className="truncate">{act.title}</span>
                            </div>
                            {isOverdue && <span className="text-rose-400 shrink-0 text-[9px]">🚨</span>}
                          </div>
                        );
                      })}

                      {dayActivities.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDayOverviewDate(dateStr);
                          }}
                          className="w-full text-center py-0.5 text-[10px] font-extrabold text-[#20CDFE] hover:underline"
                        >
                          + {dayActivities.length - 3} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ════════════ VISTA 2: VISTA SEMANAL ════════════ */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "week" && (
        <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wd) => {
              const dayActs = activitiesByDate[wd.dateStr] || [];
              return (
                <div
                  key={wd.dateStr}
                  className={`bg-[#07060B]/70 border rounded-2xl p-3 flex flex-col min-h-[300px] ${
                    wd.isToday ? "border-[#20CDFE]/60 bg-[#0F192E]/50" : "border-slate-800/80"
                  }`}
                >
                  <div className="border-b border-slate-800/80 pb-2 mb-3 text-center">
                    <span className="text-xs font-bold text-slate-400 block">{wd.dayName}</span>
                    <span
                      className={`text-lg font-black inline-block mt-0.5 ${
                        wd.isToday ? "text-[#20CDFE]" : "text-white"
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayActs.length === 0 ? (
                      <div className="text-[11px] text-slate-600 text-center py-6">Sin actividades</div>
                    ) : (
                      dayActs.map((act) => {
                        const conf = STATUS_CONFIG[act.status] || STATUS_CONFIG.pendiente;
                        const actType = act.activity_type || (act as any).type;
                        return (
                          <div
                            key={act.id}
                            onClick={() => setSelectedActivity(act)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            <p className="font-extrabold truncate">{act.title}</p>
                            {act.company_name && (
                              <p className="text-[10px] opacity-80 mt-0.5 truncate">{act.company_name}</p>
                            )}
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-current/10 text-[9px]">
                              <span>{ACTIVITY_TYPE_LABELS[actType as ActivityType] || actType}</span>
                              <span className="font-bold">{ACTIVITY_STATUS_LABELS[act.status as ActivityStatus] || act.status}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ════════════ VISTA 3: LISTA / AGENDA CRONOLÓGICA ════════════ */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <List size={20} className="text-[#20CDFE]" />
            Cronograma Completo de Entregables ({filteredActivities.length})
          </h3>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No se encontraron actividades con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((act) => {
                const conf = STATUS_CONFIG[act.status] || STATUS_CONFIG.pendiente;
                const dueDate = (act.deadline || (act as any).due_date)?.split("T")[0] || act.created_at?.split("T")[0];
                const isOverdue = act.status !== "aprobada" && act.status !== "cancelada" && dueDate && dueDate < todayStr;
                const actType = act.activity_type || (act as any).type;

                return (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActivity(act)}
                    className={`bg-[#07060B]/70 border rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-lg cursor-pointer transition-all hover:border-[#20CDFE]/40 hover:scale-[1.01] ${
                      isOverdue ? "border-rose-500/40" : "border-slate-800/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#15233D] text-[#20CDFE] border border-[#20CDFE]/30">
                          {ACTIVITY_TYPE_LABELS[actType as ActivityType] || actType}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                          {ACTIVITY_STATUS_LABELS[act.status as ActivityStatus] || act.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-base mt-1">{act.title}</h4>
                      {act.description && (
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{act.description}</p>
                      )}
                    </div>

                    <div className="border-t border-slate-800/60 pt-3 mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={12} className={isOverdue ? "text-rose-400" : "text-[#20CDFE]"} />
                        <span>Entrega: <strong className={isOverdue ? "text-rose-400 font-black" : "text-white font-semibold"}>{dueDate ? formatDate(dueDate) : "—"}</strong></span>
                      </div>

                      {act.assigned_user && (
                        <span className="text-slate-300 font-medium">{act.assigned_user.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modal de Detalle de Actividad ── */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A101D] border border-[#20CDFE]/40 rounded-3xl shadow-2xl shadow-[#20CDFE]/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800/60 flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#15233D] text-[#20CDFE] border border-[#20CDFE]/30">
                  {ACTIVITY_TYPE_LABELS[(selectedActivity.activity_type || (selectedActivity as any).type) as ActivityType] || selectedActivity.activity_type}
                </span>
                <h3 className="font-black text-white text-xl mt-2">{selectedActivity.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedActivity.project_name || "Proyecto"} · {selectedActivity.company_name || "Empresa"}
                </p>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {selectedActivity.description && (
                <div className="bg-[#07060B]/60 p-3.5 rounded-2xl border border-slate-800/60 text-slate-300 leading-relaxed">
                  {selectedActivity.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#15233D]/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado</span>
                  <span className="text-white font-extrabold text-sm mt-0.5 block capitalize">
                    {ACTIVITY_STATUS_LABELS[selectedActivity.status as ActivityStatus] || selectedActivity.status}
                  </span>
                </div>
                <div className="bg-[#15233D]/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha Límite</span>
                  <span className="text-[#20CDFE] font-extrabold text-sm mt-0.5 block">
                    {(selectedActivity.deadline || (selectedActivity as any).due_date) ? formatDate((selectedActivity.deadline || (selectedActivity as any).due_date)!) : "Sin definir"}
                  </span>
                </div>
              </div>

              {selectedActivity.assigned_user && (
                <div className="flex items-center gap-3 bg-[#15233D]/40 p-3 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-[#20CDFE]/20 text-[#20CDFE] font-bold flex items-center justify-center text-xs">
                    {selectedActivity.assigned_user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Responsable Asignado</span>
                    <span className="text-white font-bold">{selectedActivity.assigned_user.name}</span>
                  </div>
                </div>
              )}

              {/* Botones de Integración de Calendarios */}
              <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-slate-400">Añadir este entregable a tu calendario personal:</p>
                <div className="flex gap-2">
                  <a
                    href={getGoogleCalendarUrl({
                      title: selectedActivity.title,
                      description: selectedActivity.description || "",
                      date: ((selectedActivity.deadline || (selectedActivity as any).due_date || selectedActivity.created_at) as string).split("T")[0],
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={13} /> Google Calendar
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      downloadIcsFile({
                        title: selectedActivity.title,
                        description: selectedActivity.description || "",
                        date: ((selectedActivity.deadline || (selectedActivity as any).due_date || selectedActivity.created_at) as string).split("T")[0],
                      })
                    }
                    className="flex-1 py-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download size={13} /> Descargar .ics
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href={`/actividades/${selectedActivity.id}`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] text-center font-extrabold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> Ver Trabajo Completo & Evidencias
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Popover de resumen del día ── */}
      {dayOverviewDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-white text-base">
                Actividades del {formatDate(dayOverviewDate)}
              </h4>
              <button onClick={() => setDayOverviewDate(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(activitiesByDate[dayOverviewDate] || []).map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    setDayOverviewDate(null);
                    setSelectedActivity(act);
                  }}
                  className="p-3 bg-[#07060B] border border-slate-800 rounded-xl cursor-pointer hover:border-[#20CDFE]/40"
                >
                  <p className="font-bold text-white text-xs">{act.title}</p>
                  <span className="text-[10px] text-slate-400 capitalize">{act.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
