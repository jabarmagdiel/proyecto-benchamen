"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Building2, FolderKanban, AlertTriangle, TrendingUp,
  ClipboardList, Clock, Eye, CheckCircle2, XCircle, ChevronRight,
  CalendarCheck, Bell, ExternalLink, Download, ArrowRight, Sparkles, FolderClosed,
  User
} from "lucide-react";
import Link from "next/link";
import { 
  dashboardApi, 
  companiesApi, 
  projectsApi, 
  notificationsApi, 
  activitiesApi, 
  evidencesApi 
} from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { 
  DashboardFull, 
  Company, 
  Project, 
  NotificationItem, 
  Activity, 
  Evidence 
} from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#94a3b8",   // Slate-400
  asignada: "#6366f1",    // Indigo-500
  en_proceso: "#8b5cf6",  // Violet-500
  en_revision: "#3b82f6", // Blue-500
  observada: "#f59e0b",   // Amber-500
  aprobada: "#10b981",    // Emerald-500
  cancelada: "#f43f5e",   // Rose-500
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendientes",
  asignada: "Asignadas",
  en_proceso: "En Proceso",
  en_revision: "En Revisión",
  observada: "Observadas",
  aprobada: "Aprobadas",
  cancelada: "Canceladas",
};

const STATUS_ICONS: Record<string, any> = {
  pendiente: ClipboardList,
  asignada: Clock,
  en_proceso: Clock,
  en_revision: Eye,
  observada: AlertTriangle,
  aprobada: CheckCircle2,
  cancelada: XCircle,
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  pendiente: "border-[#20CDFE]/10 bg-[#15233D] text-slate-600",
  asignada: "border-indigo-200 bg-indigo-50 text-[#20CDFE]",
  en_proceso: "border-violet-200 bg-[#20CDFE]/20 text-[#20CDFE]",
  en_revision: "border-blue-200 bg-blue-50 text-blue-600",
  observada: "border-amber-200 bg-amber-50 text-amber-600",
  aprobada: "border-emerald-200 bg-emerald-50 text-emerald-600",
  cancelada: "border-rose-200 bg-rose-50 text-rose-600",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardFull | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Notificaciones recientes
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);

  // Estados específicos para Clientes
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingClientProjects, setLoadingClientProjects] = useState(false);
  const [deliverablesModalProject, setDeliverablesModalProject] = useState<Project | null>(null);
  const [projectDeliverables, setProjectDeliverables] = useState<{ activity: Activity; evidences: Evidence[] }[]>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);

  // Obtener fecha formateada en español
  const getGreetingAndDate = () => {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "¡Hola";
    if (hour < 12) greeting = "Buenos días";
    else if (hour < 19) greeting = "Buenas tardes";
    else greeting = "Buenas noches";

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return {
      greeting: `${greeting}, ${user?.name}!`,
      fullDate: `${dayName}, ${dateNum} de ${monthName} de ${year}`
    };
  };

  const { greeting, fullDate } = getGreetingAndDate();

  // Cargar lista de filtros iniciales (Solo Admin y Operativo)
  const loadFilters = async () => {
    if (user?.role === "cliente") return;
    try {
      const compRes = await companiesApi.list();
      setCompanies(compRes.data);
      const projRes = await projectsApi.list();
      setProjects(projRes.data);
    } catch (err) {
      console.error("Error al cargar filtros del dashboard", err);
    }
  };

  // Cargar notificaciones recientes
  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list(3);
      setRecentNotifications(res.data);
    } catch (err) {
      console.error("Error al cargar notificaciones", err);
    }
  };

  // Cargar estadísticas filtradas
  const loadStats = async (compId?: string, projId?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (compId) params.company_id = Number(compId);
      if (projId) params.project_id = Number(projId);

      const res = await dashboardApi.stats(params);
      setData(res.data);
    } catch (err) {
      console.error("Error al cargar estadísticas", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar proyectos para el Rol de Cliente
  const loadClientProjects = async () => {
    if (user?.role !== "cliente") return;
    setLoadingClientProjects(true);
    try {
      const res = await projectsApi.list();
      setClientProjects(res.data);
    } catch (err) {
      console.error("Error al cargar proyectos de cliente", err);
    } finally {
      setLoadingClientProjects(false);
    }
  };

  useEffect(() => {
    loadFilters();
    loadNotifications();
    loadStats();
    loadClientProjects();
  }, [user]);

  // Manejar cambio de filtros
  const handleCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    setSelectedProjectId(""); // Limpiar proyecto al cambiar empresa
    
    // Cargar proyectos filtrados por empresa si existe, de lo contrario todos
    const params = compId ? { company_id: Number(compId) } : {};
    projectsApi.list(params)
      .then(res => setProjects(res.data))
      .catch(err => console.error(err));

    loadStats(compId, "");
  };

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    loadStats(selectedCompanyId, projId);
  };

  const handleClearFilters = () => {
    setSelectedCompanyId("");
    setSelectedProjectId("");
    // Recargar todos los proyectos
    projectsApi.list()
      .then(res => setProjects(res.data))
      .catch(err => console.error(err));
    loadStats("", "");
  };

  // Marcar notificación como leída
  const handleReadNotification = async (id: number) => {
    try {
      await notificationsApi.read(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar Entregables Finales en Modal para Cliente
  const handleOpenDeliverables = async (proj: Project) => {
    setDeliverablesModalProject(proj);
    setLoadingDeliverables(true);
    setProjectDeliverables([]);
    try {
      // 1. Obtener todas las actividades aprobadas de este proyecto
      const actRes = await activitiesApi.list({ project_id: proj.id, status: "aprobada" });
      const approvedActivities = actRes.data;

      // 2. Para cada actividad, obtener sus evidencias de forma paralela
      const deliverablesList = await Promise.all(
        approvedActivities.map(async (act: Activity) => {
          const evRes = await evidencesApi.list(act.id);
          return {
            activity: act,
            evidences: evRes.data
          };
        })
      );


      // 3. Filtrar solo las que tengan evidencias registradas
      setProjectDeliverables(deliverablesList.filter(d => d.evidences.length > 0));
    } catch (err) {
      console.error("Error al obtener entregables finales", err);
    } finally {
      setLoadingDeliverables(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;
  const activity_by_status = data?.activity_by_status || [];
  const activity_by_user = data?.activity_by_user || [];
  const late_activities = data?.late_activities || [];

  // Filtrar estados con cantidad mayor a 0 para el Donut chart
  const statusChartData = activity_by_status
    .filter(s => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      statusKey: s.status,
    }));

  const totalActivities = activity_by_status.reduce((acc, curr) => acc + curr.count, 0);

  // Custom tooltips para los gráficos
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A101D]/95 backdrop-blur-md border border-[#20CDFE]/10 p-3 rounded-xl shadow-xl text-white text-xs font-semibold">
          <p className="capitalize">
            {payload[0].name}: <span className="font-extrabold text-violet-400 ml-1">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* ─── Banner de bienvenida Premium ─── */}
      <div className="bg-gradient-to-r from-[#20CDFE]/20 via-[#2E455C]/40 to-[#07060B] border border-[#20CDFE]/30 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-900/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0A101D]/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-[#20CDFE]/200/10 rounded-full blur-3xl translate-y-12 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#0A101D]/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1.5 border border-[#20CDFE]/10">
              <Sparkles size={11} className="text-amber-300" />
              {user?.role === "administrador" ? "Panel Administrador" : user?.role === "cliente" ? "Portal de Clientes" : "Panel Operativo"}
            </span>
            <span className="text-white/40 text-[10px]">•</span>
            <span className="text-indigo-200 text-xs font-medium">{fullDate}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{greeting}</h2>
          <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
            {user?.role === "administrador"
              ? "Revisa el progreso de los proyectos, la carga de trabajo de tu equipo y aprueba las evidencias entregadas."
              : user?.role === "cliente"
              ? "Aquí tienes una vista simplificada de tus proyectos contratados, entregables finales listos para descargar y agenda de citas."
              : "Aquí tienes el estado actual de tus actividades asignadas y próximos plazos de entrega."}
          </p>
        </div>

        {stats && (
          <div className="relative z-10 shrink-0 bg-[#0A101D]/10 backdrop-blur-md border border-[#20CDFE]/10 rounded-2xl p-4 flex gap-4 text-center">
            <div className="px-2">
              <p className="text-2xl font-black">{stats.total_projects}</p>
              <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider mt-0.5">Proyectos</p>
            </div>
            <div className="w-px bg-[#0A101D]/10" />
            <div className="px-2">
              <p className="text-2xl font-black text-emerald-300">{stats.approved_activities}</p>
              <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider mt-0.5">Aprobadas</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── FILTROS DEL DASHBOARD (Solo Admin y Operativo) ─── */}
      {user?.role !== "cliente" && (
        <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white text-sm font-bold">
            <TrendingUp size={16} className="text-[#20CDFE]" />
            Filtros del Panel:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === "administrador" && (
              <select
                value={selectedCompanyId}
                onChange={e => handleCompanyChange(e.target.value)}
                className="px-3 py-2 border border-[#20CDFE]/10 rounded-xl bg-[#0A101D] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                <option value="">Todas las empresas</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <select
              value={selectedProjectId}
              onChange={e => handleProjectChange(e.target.value)}
              className="px-3 py-2 border border-[#20CDFE]/10 rounded-xl bg-[#0A101D] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Todos los proyectos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {(selectedCompanyId || selectedProjectId) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── CONTENIDO ROL CLIENTE (Portal simplificado) ─── */}
      {user?.role === "cliente" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado de Proyectos Contratados */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderKanban size={18} className="text-[#20CDFE]" />
              Nuestros Proyectos contratados
            </h3>
            
            {loadingClientProjects ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : clientProjects.length === 0 ? (
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-8 text-center text-slate-400 text-sm">
                No hay proyectos registrados para tu empresa en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientProjects.map((proj) => {
                  const progress = proj.progress || 0;
                  return (
                    <div key={proj.id} className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            ID Proyecto: #{proj.id}
                          </span>
                          <StatusBadge status={proj.status as any} />
                        </div>
                        <h4 className="font-bold text-white text-base mb-1 truncate">{proj.name}</h4>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-4">{proj.description || "Sin descripción disponible."}</p>
                      </div>

                      <div className="space-y-4">
                        {/* Progreso */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                            <span>Progreso General</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="gradient-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Botón ver entregables */}
                        <button
                          onClick={() => handleOpenDeliverables(proj)}
                          className="w-full flex items-center justify-center gap-1.5 bg-[#20CDFE]/20 hover:bg-[#20CDFE] text-white hover:text-white py-2 rounded-xl text-xs font-bold transition-all duration-300 border border-[#20CDFE]/30"
                        >
                          <Sparkles size={13} />
                          Ver Producto Final (Entregables)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menú de accesos y notificaciones en lateral */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Launchpad rápido */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-[#20CDFE]" />
                Accesos Rápidos
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  href="/agenda"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2 text-white">
                    <CalendarCheck size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                    Solicitar cita / Reunión
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/perfil"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2 text-white">
                    <User size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                    Editar mi perfil de empresa
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Feed de Notificaciones */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={15} className="text-[#20CDFE]" />
                Notificaciones Recientes
              </h3>
              {recentNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No tienes notificaciones pendientes.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map(n => (
                    <div key={n.id} className="p-3 bg-[#15233D]/60 rounded-xl border border-[#20CDFE]/10 relative flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0 mt-1.5 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs leading-snug">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{n.message}</p>
                        <button 
                          onClick={() => handleReadNotification(n.id)}
                          className="text-[9px] font-bold text-[#20CDFE] hover:text-white mt-2 block"
                        >
                          Marcar como leído
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO VISTA ADMIN Y OPERATIVO (Dashboard Métricas) ─── */}
      {user?.role !== "cliente" && stats && (
        <>
          {/* KPI Cards Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={user?.role === "administrador" ? "Total Clientes" : "Mis Clientes"} value={stats.total_companies} icon={Building2} color="violet" />
            <StatCard title={user?.role === "administrador" ? "Total Proyectos" : "Mis Proyectos"} value={stats.total_projects} icon={FolderKanban} color="blue" />
            <StatCard title="Proyectos Activos" value={stats.active_projects} icon={TrendingUp} color="green" />
            <StatCard title="Actividades Demoradas" value={stats.late_activities} icon={AlertTriangle} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico Donut: Distribución de Actividades */}
            <div className="lg:col-span-2 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <h2 className="font-extrabold text-white text-base mb-1">Distribución de Actividades</h2>
                <p className="text-slate-400 text-xs font-medium mb-6">Desglose porcentual y numérico por estado actual</p>
              </div>
              {statusChartData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  No hay actividades registradas con los filtros aplicados.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* Gráfico de dona */}
                  <div className="relative w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey] || "#cbd5e1"} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-white">{totalActivities}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tareas</span>
                    </div>
                  </div>

                  {/* Leyenda a dos columnas */}
                  <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    {activity_by_status.map((item) => {
                      const color = STATUS_COLORS[item.status] || "#cbd5e1";
                      const percent = totalActivities > 0 ? Math.round((item.count / totalActivities) * 100) : 0;
                      return (
                        <div key={item.status} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#20CDFE]/10 hover:bg-[#15233D] transition-colors">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white leading-none truncate capitalize">{STATUS_LABELS[item.status] || item.status}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-none">{item.count} ({percent}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Panel de Tareas Desglosado con Barras de Avance */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <h2 className="font-extrabold text-white text-base mb-1">Estado de Tareas</h2>
                <p className="text-slate-400 text-xs font-medium mb-4">Desglose de avance e hitos vigentes</p>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
                {activity_by_status.map((s) => {
                  const Icon = STATUS_ICONS[s.status] || ClipboardList;
                  const borderStyles = STATUS_BORDER_COLORS[s.status] || "border-[#20CDFE]/10 bg-[#15233D] text-slate-600";
                  const percent = totalActivities > 0 ? Math.round((s.count / totalActivities) * 100) : 0;

                  return (
                    <div key={s.status} className="flex items-center justify-between p-2 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/10 hover:shadow-sm transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${borderStyles}`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white capitalize">{STATUS_LABELS[s.status] || s.status}</p>
                          <div className="w-24 sm:w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="h-full rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status], width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white">{s.count}</span>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{percent}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico de Barras: Rendimiento */}
            <div className="lg:col-span-2 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="mb-6">
                <h2 className="font-extrabold text-white text-base mb-1">
                  {user?.role === "administrador" ? "Carga por Responsable" : "Mis Actividades por Proyecto"}
                </h2>
                <p className="text-slate-400 text-xs font-medium">
                  {user?.role === "administrador" 
                    ? "Carga asignada a los 10 principales usuarios del equipo" 
                    : "Proyectos donde tienes asignadas actividades en este momento"}
                </p>
              </div>
              {activity_by_user.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
                  No hay datos disponibles para mostrar el rendimiento en este momento.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={activity_by_user} margin={{ left: -25, bottom: 5 }}>
                    <XAxis dataKey="user_name" tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124, 58, 237, 0.03)" }} />
                    <Bar dataKey="count" fill="url(#violetGradient)" radius={[8, 8, 0, 0]} name="Actividades" maxBarSize={32}>
                      <defs>
                        <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Actividades Atrasadas */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <h3 className="font-extrabold text-white text-base mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Entregas Demoradas ({late_activities.length})
                </h3>
                <p className="text-slate-400 text-xs font-medium mb-4">Actividades fuera del plazo límite sin aprobar</p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-3">
                {late_activities.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    🎉 ¡No tienes entregas demoradas! Excelente trabajo.
                  </div>
                ) : (
                  late_activities.map((act) => (
                    <Link
                      key={act.id}
                      href={`/actividades/${act.id}`}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-rose-50 hover:bg-rose-50/30 transition-all duration-300 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-rose-600 transition-colors truncate">{act.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{act.project_name} · {act.company_name}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="bg-rose-500/10 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            +{act.days_late}d retraso
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">{formatDate(act.deadline)}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 mt-1 group-hover:text-rose-500 transition-colors shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Fila Inferior: Accesos Rápidos y Notificaciones Recientes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Launchpad Rápido de Acciones */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-[#20CDFE]" />
                Launchpad de Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {user?.role === "administrador" && (
                  <>
                    <Link
                      href="/actividades"
                      className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                    >
                      <span className="flex items-center gap-2 text-white">
                        <ClipboardList size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                        Crear nueva actividad / tarea
                      </span>
                      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      href="/proyectos"
                      className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                    >
                      <span className="flex items-center gap-2 text-white">
                        <FolderKanban size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                        Registrar un nuevo proyecto
                      </span>
                      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                )}

                <Link
                  href="/agenda"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2 text-white">
                    <CalendarCheck size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                    {user?.role === "administrador" ? "Administrar mi agenda disponible" : "Agendar reunión / Cita"}
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/perfil"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#20CDFE]/10 hover:border-[#20CDFE]/50 hover:bg-[#20CDFE]/10 text-white font-semibold text-xs transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2 text-white">
                    <User size={16} className="text-[#20CDFE] group-hover:scale-110 transition-transform" />
                    Actualizar mi perfil personal
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Panel de Notificaciones Recientes (Últimas 3) */}
            <div className="lg:col-span-2 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={15} className="text-[#20CDFE]" />
                Mensajes y Notificaciones Recientes
              </h3>
              {recentNotifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No tienes notificaciones pendientes.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentNotifications.map((n) => (
                    <div key={n.id} className="p-3.5 bg-[#15233D]/50 rounded-xl border border-[#20CDFE]/10/30 flex flex-col justify-between gap-3 hover:bg-[#15233D] transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                          <span className="text-[9px] text-slate-400 font-semibold">{formatDate(n.created_at)}</span>
                        </div>
                        <h4 className="font-bold text-white text-xs leading-snug truncate">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-3 leading-normal">{n.message}</p>
                      </div>
                      <button
                        onClick={() => handleReadNotification(n.id)}
                        className="text-[9px] font-extrabold text-[#20CDFE] hover:text-violet-800 border-t border-[#20CDFE]/10 pt-2 text-left"
                      >
                        Marcar como leída
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── MODAL ENTREGABLES FINALES (Solo para Clientes) ─── */}
      {deliverablesModalProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#20CDFE]/10 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Producto Final / Entregables</h3>
                <p className="text-xs text-slate-400 mt-0.5">Proyecto: <span className="font-semibold text-slate-600">{deliverablesModalProject.name}</span></p>
              </div>
              <button 
                onClick={() => setDeliverablesModalProject(null)} 
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDeliverables ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
                </div>
              ) : projectDeliverables.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FolderClosed size={40} className="mx-auto mb-3 opacity-25" />
                  <p className="font-semibold text-sm">No hay entregables aprobados para este proyecto.</p>
                  <p className="text-xs mt-1">Los archivos aparecerán aquí una vez que las actividades sean completadas y aprobadas por el administrador.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {projectDeliverables.map((item) => (
                    <div key={item.activity.id} className="p-4 rounded-xl border border-[#20CDFE]/10 bg-[#15233D]/20 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#20CDFE]/10/50 pb-2">
                        <span className="font-bold text-white text-sm">{item.activity.title}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Aprobado</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.evidences.map((ev) => {
                          const isLink = ev.evidence_type === "link_drive" || ev.evidence_type === "link_externo";
                          const targetUrl = isLink ? ev.drive_url : ev.file_url;
                          const name = ev.file_name || "Archivo de evidencia";

                          return (
                            <div key={ev.id} className="p-3 bg-[#0A101D] border border-[#20CDFE]/10 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="min-w-0">
                                <p className="font-bold text-white text-xs truncate" title={name}>{name}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 capitalize">Tipo: {ev.evidence_type.replace("_", " ")}</p>
                                {ev.note && <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">"{ev.note}"</p>}
                              </div>

                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center p-2 bg-[#20CDFE]/20 hover:bg-[#20CDFE] text-[#20CDFE] hover:text-white rounded-xl transition-colors shrink-0"
                                title="Descargar o Abrir"
                              >
                                {isLink ? <ExternalLink size={13} /> : <Download size={13} />}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#20CDFE]/10 bg-[#15233D]/50 shrink-0 flex justify-end">
              <button 
                onClick={() => setDeliverablesModalProject(null)}
                className="px-5 py-2.5 border border-[#20CDFE]/10 bg-[#0A101D] rounded-xl text-sm font-semibold text-slate-600 hover:bg-[#15233D] transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
