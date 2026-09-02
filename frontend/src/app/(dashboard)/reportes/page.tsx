"use client";

import { useEffect, useState } from "react";
import {
  BarChart2, Download, FileSpreadsheet, FileText, Filter,
  Calendar, Users, Building2, FolderKanban, CheckCircle2,
  Clock, AlertTriangle, TrendingUp, DollarSign, RefreshCw, Printer, Search
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { reportsApi, companiesApi, projectsApi, usersApi } from "@/lib/api";
import type { Company, Project, User } from "@/types";
import { ACTIVITY_STATUS_LABELS } from "@/types";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#64748b",   // Slate-500
  asignada: "#6366f1",    // Indigo-500
  en_proceso: "#3b82f6",  // Blue-500
  en_revision: "#a855f7", // Purple-500
  observada: "#f59e0b",   // Amber-500
  aprobada: "#10b981",    // Emerald-500
  cancelada: "#f43f5e",   // Rose-500
};

export default function ReportesPage() {
  // Datos principales
  const [data, setData] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filtros dinámicos
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string>("all");

  const [tableSearch, setTableSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar listas de opciones al montar
  useEffect(() => {
    Promise.all([
      companiesApi.list(),
      projectsApi.list(),
      usersApi.list(),
    ]).then(([cRes, pRes, uRes]) => {
      setCompanies(cRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
    }).catch(console.error);
  }, []);

  // Cargar estadísticas reportadas dinámicamente cuando cambien los filtros
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedUser) params.user_id = selectedUser;
      if (selectedCompany) params.company_id = selectedCompany;
      if (selectedProject) params.project_id = selectedProject;
      if (selectedStatus) params.status = selectedStatus;

      const res = await reportsApi.getAnalytics(params);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFrom, dateTo, selectedUser, selectedCompany, selectedProject, selectedStatus]);

  // Presets rápidos de fechas
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();

    if (preset === "this_month") {
      setDateFrom(format(startOfMonth(today), "yyyy-MM-dd"));
      setDateTo(format(endOfMonth(today), "yyyy-MM-dd"));
    } else if (preset === "last_month") {
      const lastM = subMonths(today, 1);
      setDateFrom(format(startOfMonth(lastM), "yyyy-MM-dd"));
      setDateTo(format(endOfMonth(lastM), "yyyy-MM-dd"));
    } else if (preset === "last_30") {
      setDateFrom(format(subDays(today, 30), "yyyy-MM-dd"));
      setDateTo(format(today, "yyyy-MM-dd"));
    } else if (preset === "this_year") {
      setDateFrom(format(startOfYear(today), "yyyy-MM-dd"));
      setDateTo(format(today, "yyyy-MM-dd"));
    } else if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    }
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedUser("");
    setSelectedCompany("");
    setSelectedProject("");
    setSelectedStatus("");
    setActivePreset("all");
    setTableSearch("");
  };

  // Exportar Excel & PDF pasando todos los filtros activos
  const getFilterParams = () => {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (selectedUser) params.user_id = selectedUser;
    if (selectedCompany) params.company_id = selectedCompany;
    if (selectedProject) params.project_id = selectedProject;
    if (selectedStatus) params.status = selectedStatus;
    return params;
  };

  const handleExportExcel = () => reportsApi.exportExcel(getFilterParams());
  const handleExportPdf = () => reportsApi.exportPdf(getFilterParams());
  const handlePrint = () => window.print();

  // Helper formateo de horas
  const formatSecondsToHours = (secs: number) => {
    if (!secs) return "0h 0m";
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const kpis = data?.kpis || {};
  const statusChartData = data?.activity_by_status || [];
  const typeChartData = data?.activity_by_type || [];
  const userPerformanceData = data?.user_performance || [];
  const activitiesList = (data?.activities || []).filter((a: any) => 
    !tableSearch || a.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
    a.assigned_user.toLowerCase().includes(tableSearch.toLowerCase()) ||
    a.project_name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="text-[#20CDFE]" size={26} />
            Reportes & Analíticas Dinámicas
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualiza métricas en tiempo real, productividad de equipo, tiempos e indicadores financieros.
          </p>
        </div>

        {/* Botones de Acción / Exportación */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#15233D] hover:bg-[#1C2C4D] text-slate-300 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 transition-colors cursor-pointer"
            title="Imprimir o guardar como PDF del navegador"
          >
            <Printer size={16} /> <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <FileText size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Barra de Filtros Dinámicos de Consulta */}
      <div className="bg-[#0A101D]/70 backdrop-blur-2xl rounded-2xl border border-slate-800/60 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Filter size={16} className="text-[#20CDFE]" />
            Filtros Dinámicos de Reporte
          </div>

          {/* Presets Rápidos de Fechas */}
          <div className="flex flex-wrap gap-1.5 bg-[#15233D] p-1 rounded-xl border border-slate-800/50">
            {[
              { id: "all", label: "Todo" },
              { id: "this_month", label: "Este Mes" },
              { id: "last_month", label: "Mes Pasado" },
              { id: "last_30", label: "Últimos 30 días" },
              { id: "this_year", label: "Este Año" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activePreset === p.id
                    ? "bg-[#20CDFE] text-[#07060B] font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controles de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Fecha Desde */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setActivePreset("custom"); }}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setActivePreset("custom"); }}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            />
          </div>

          {/* Filtrar por Persona / Usuario */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Persona / Operador</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            >
              <option value="">Todos los usuarios</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filtrar por Empresa */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Empresa / Cliente</label>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setSelectedProject(""); }}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            >
              <option value="">Todas las empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtrar por Proyecto */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Proyecto</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            >
              <option value="">Todos los proyectos</option>
              {projects
                .filter((p) => !selectedCompany || p.company?.id.toString() === selectedCompany)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Filtrar por Estado */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estado Actividad</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limpiar Filtros */}
        <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 text-xs">
          <p className="text-slate-400">
            Filtros activos actualizan KPIs, gráficos y datos exportables en tiempo real.
          </p>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[#20CDFE] hover:text-[#1ED1B4] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Limpiar todos los filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Tarjetas KPI dinámicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Actividades Totales */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold">Total Actividades</p>
                <p className="text-3xl font-black text-white mt-1">{kpis.total_activities || 0}</p>
                <p className="text-[11px] text-slate-500 mt-1">En el período seleccionado</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between justify-center text-indigo-400">
                <FolderKanban size={24} />
              </div>
            </div>

            {/* Aprobadas / Completadas */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold">Tasa de Cumplimiento</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{kpis.completion_rate || 0}%</p>
                <p className="text-[11px] text-emerald-500/90 font-medium mt-1">
                  {kpis.completed_activities || 0} completadas con éxito
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
            </div>

            {/* Tiempo Registrado */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold">Tiempo Registrado</p>
                <p className="text-2xl font-black text-[#20CDFE] mt-1">
                  {formatSecondsToHours(kpis.total_time_seconds || 0)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Horas dedicadas por el equipo</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/20 flex items-center justify-center text-[#20CDFE]">
                <Clock size={24} />
              </div>
            </div>

            {/* Tareas Atrasadas */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold">Entregas Atrasadas</p>
                <p className="text-3xl font-black text-rose-500 mt-1">{kpis.late_activities || 0}</p>
                <p className="text-[11px] text-rose-400/80 font-medium mt-1">Revisión requerida</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Tarjeta de Resumen Financiero en el Período */}
          <div className="bg-gradient-to-r from-[#0F192E] to-[#0A101D] p-5 rounded-2xl border border-[#20CDFE]/20 shadow-md">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <DollarSign size={18} className="text-[#1ED1B4]" />
                Balance Financiero del Período Filtrado
              </h3>
              <span className="text-xs text-slate-400">Ingresos vs Egresos del rango</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-semibold">Ingresos Totales</p>
                <p className="text-2xl font-black text-white mt-1">
                  ${(kpis.total_income || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20">
                <p className="text-xs text-rose-400 font-semibold">Egresos Totales</p>
                <p className="text-2xl font-black text-white mt-1">
                  ${(kpis.total_expenses || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#20CDFE]/10 border border-[#20CDFE]/30">
                <p className="text-xs text-[#20CDFE] font-semibold">Utilidad Neta del Período</p>
                <p className={`text-2xl font-black mt-1 ${kpis.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ${(kpis.net_profit || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Gráficos Estadísticos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Estado de Actividades */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-[#20CDFE]" />
                Distribución por Estado
              </h3>
              {statusChartData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-500 text-xs">Sin actividades en este filtro</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {statusChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0A101D", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                    <Legend formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico 2: Carga por Tipo de Actividad */}
            <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-[#1ED1B4]" />
                Actividades por Tipo de Servicio
              </h3>
              {typeChartData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-500 text-xs">Sin actividades en este filtro</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={typeChartData} margin={{ left: -10, right: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0A101D", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="count" fill="#20CDFE" radius={[8, 8, 0, 0]} name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabla de Rendimiento por Persona / Operador */}
          <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Users size={18} className="text-[#20CDFE]" />
                  Rendimiento y Eficiencia por Persona
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Desglose de tareas completadas, tiempo invertido y nivel de efectividad.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#15233D] text-slate-400 uppercase tracking-wider border-b border-slate-800/60 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Operador / Persona</th>
                    <th className="py-3 px-4 text-center">Total Asignadas</th>
                    <th className="py-3 px-4 text-center">Completadas</th>
                    <th className="py-3 px-4 text-center">Atrasadas</th>
                    <th className="py-3 px-4 text-center">Tiempo Registrado</th>
                    <th className="py-3 px-4 text-right">Eficiencia (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {userPerformanceData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No hay datos registrados para las personas con estos filtros.
                      </td>
                    </tr>
                  ) : (
                    userPerformanceData.map((u: any) => (
                      <tr key={u.user_id} className="hover:bg-[#15233D]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-[#20CDFE] flex items-center justify-center font-black">
                            {u.user_name.charAt(0).toUpperCase()}
                          </div>
                          {u.user_name}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">{u.total}</td>
                        <td className="py-3 px-4 text-center text-emerald-400 font-bold">{u.completed}</td>
                        <td className="py-3 px-4 text-center text-rose-400 font-bold">{u.late}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-400">
                          {formatSecondsToHours(u.time_seconds)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <div className="flex items-center justify-end gap-2">
                            <span className={u.efficiency >= 80 ? "text-emerald-400" : u.efficiency >= 50 ? "text-amber-400" : "text-slate-400"}>
                              {u.efficiency}%
                            </span>
                            <div className="w-16 bg-[#15233D] h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  u.efficiency >= 80 ? "bg-emerald-400" : u.efficiency >= 50 ? "bg-amber-400" : "bg-rose-400"
                                }`}
                                style={{ width: `${Math.min(u.efficiency, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Detalle de Actividades Filtradas */}
          <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Detalle de Actividades del Reporte</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mostrando {activitiesList.length} actividades filtradas
                </p>
              </div>

              {/* Buscador interno de la tabla */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en el reporte..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-[#15233D] border border-slate-800/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#15233D] text-slate-400 uppercase tracking-wider border-b border-slate-800/60 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Actividad</th>
                    <th className="py-3 px-4">Proyecto</th>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4">Fecha Límite</th>
                    <th className="py-3 px-4">Tiempo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {activitiesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        No hay actividades registradas que coincidan con el filtro actual.
                      </td>
                    </tr>
                  ) : (
                    activitiesList.map((a: any) => (
                      <tr key={a.id} className="hover:bg-[#15233D]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate">{a.title}</td>
                        <td className="py-3 px-4 font-medium text-slate-300 max-w-[150px] truncate">{a.project_name}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">{a.company_name}</td>
                        <td className="py-3 px-4 text-slate-400">{a.activity_type}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{a.assigned_user}</td>
                        <td className="py-3 px-4 text-slate-400">{a.deadline || "-"}</td>
                        <td className="py-3 px-4 text-slate-400">{formatSecondsToHours(a.time_spent_seconds)}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: STATUS_COLORS[a.status] || "#64748b" }}
                          >
                            {a.status_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
