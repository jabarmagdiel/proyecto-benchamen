"use client";

import { useEffect, useState } from "react";
import { BarChart2, Download, FileSpreadsheet, FileText, Filter } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { dashboardApi, reportsApi, companiesApi } from "@/lib/api";
import type { DashboardFull, Company } from "@/types";
import { ACTIVITY_STATUS_LABELS } from "@/types";
import { CHART_COLORS } from "@/lib/utils";

export default function ReportesPage() {
  const [data, setData] = useState<DashboardFull | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), companiesApi.list()])
      .then(([d, c]) => { setData(d.data); setCompanies(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = data?.activity_by_status.map((s) => ({
    name: ACTIVITY_STATUS_LABELS[s.status as keyof typeof ACTIVITY_STATUS_LABELS] || s.status,
    value: s.count,
  })) || [];

  const userChartData = data?.activity_by_user || [];

  const handleExportExcel = () => {
    const params: any = {};
    if (filterCompany) params.company_id = filterCompany;
    if (filterStatus) params.status = filterStatus;
    reportsApi.exportExcel(params);
  };

  const handleExportPdf = () => {
    const params: any = {};
    if (filterCompany) params.company_id = filterCompany;
    if (filterStatus) params.status = filterStatus;
    reportsApi.exportPdf(params);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Reportes</h2>
          <p className="text-slate-400 text-sm mt-0.5">Análisis de actividades y rendimiento del equipo</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
            <FileText size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-slate-400" />
        <span className="text-sm text-slate-400 font-medium">Filtrar exportación:</span>
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="px-3 py-2 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">Todas las empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">Todos los estados</option>
          {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <p className="text-xs text-slate-400 ml-auto">Los filtros aplican al exportar</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart estado */}
          <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-violet-500" />
              Distribución por estado
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value">
                  {statusChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart por usuario */}
          <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-violet-500" />
              Carga de actividades por usuario
            </h3>
            {userChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userChartData} margin={{ left: -20 }}>
                  <XAxis dataKey="user_name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Actividades" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabla resumen por estado */}
          <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4">Resumen general</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statusChartData.map((s, i) => (
                <div key={s.name} className="text-center p-4 rounded-xl bg-[#2E455C]/20 border border-[#2E455C]/30">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
