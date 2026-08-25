"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, ShieldCheck, Clock, XCircle,
  Building2, Calendar, FileText, CheckCircle2, Filter, Search, ArrowUpRight,
  ArrowDownRight, Sparkles, Wallet, QrCode, Eye, ExternalLink, Image as ImageIcon,
  Plus, ArrowRight, BarChart2, AlertCircle, PieChart as PieIcon
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from "recharts";
import { financesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { FinancialSummary, FinancialTransaction, PackageRequest } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  proyecto: "#10B981",
  suscripcion: "#20CDFE",
  servicio: "#8B5CF6",
  infraestructura: "#EF4444",
  salarios: "#F59E0B",
  software: "#6366F1",
  marketing: "#EC4899",
  servicios: "#14B8A6",
  equipamiento: "#F97316",
  impuestos: "#64748B",
  otro: "#94A3B8",
};

export default function FinanzasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";

  const [activeTab, setActiveTab] = useState<"resumen" | "ingresos" | "egresos" | "qr">("resumen");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<FinancialTransaction[]>([]);
  const [packageRequests, setPackageRequests] = useState<PackageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  /* Modal de Verificación QR */
  const [verifyModalReq, setVerifyModalReq] = useState<PackageRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [sumRes, transRes, reqRes] = await Promise.all([
        financesApi.summary(),
        financesApi.list({ limit: 15 }),
        packageRequestsApi.list(),
      ]);
      setSummary(sumRes.data);
      setRecentTransactions(transRes.data || []);
      setPackageRequests(reqRes.data || []);
    } catch (e) {
      console.error("Error al cargar finanzas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleVerifyPayment = async (status: "pago_verificado" | "rechazado") => {
    if (!verifyModalReq) return;
    setSubmitting(true);
    try {
      await packageRequestsApi.verifyPayment(verifyModalReq.id, { payment_status: status });
      showToast(status === "pago_verificado" ? "✅ Pago verificado y suscripción activada" : "❌ Pago rechazado");
      setVerifyModalReq(null);
      loadData();
    } catch (e) {
      showToast("Error al procesar la verificación del pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-xl font-extrabold text-white">Acceso Restringido</h2>
        <p className="text-slate-400 text-sm mt-1 max-w-md">
          El módulo de Finanzas, Ingresos y Egresos está disponible exclusivamente para el perfil de Administrador.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-5 py-2.5 bg-[#20CDFE] text-[#07060B] font-bold text-xs rounded-xl hover:opacity-90 transition-all"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const qrVerifiedPayments = packageRequests.filter(r => r.payment_status === "pago_verificado");
  const qrPendingPayments = packageRequests.filter(r => r.payment_status === "pendiente_verificacion");

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold animate-bounce ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Wallet className="text-[#20CDFE]" size={26} />
              Módulo de Finanzas Consolidadas
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Control centralizado de Ingresos, Egresos, Flujo de Caja y Verificación de Pagos QR Banco Fortaleza.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/finanzas/ingresos"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <ArrowUpRight size={16} /> + Registrar Ingreso
            </Link>

            <Link
              href="/finanzas/egresos"
              className="bg-gradient-to-r from-rose-500 to-red-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <ArrowDownRight size={16} /> + Registrar Egreso
            </Link>
          </div>
        </div>

        {/* METRICAS Y KPIS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* BALANCE NETO */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-[#20CDFE]/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">BALANCE NETO TOTAL</span>
              <div className="p-2.5 rounded-xl bg-[#20CDFE]/10 text-[#20CDFE] border border-[#20CDFE]/20">
                <Wallet size={20} />
              </div>
            </div>
            <div className={`text-2xl font-black mt-3 ${(summary?.balance_neto || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {summary?.balance_neto.toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Diferencia (Ingresos Globales - Egresos)
            </div>
          </div>

          {/* INGRESOS GLOBALES */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-emerald-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">INGRESOS GLOBALES</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-3">
              {summary?.total_ingresos_global.toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Manuales ({summary?.total_ingresos_manuales.toFixed(2)} Bs.) + QR ({summary?.total_ingresos_qr_verificados.toFixed(2)} Bs.)
            </div>
          </div>

          {/* EGRESOS TOTALES */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-rose-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">EGRESOS TOTALES</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-400 mt-3">
              {summary?.total_egresos_global.toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.egresos_count} transacción(es) de gasto
            </div>
          </div>

          {/* PAGOS QR PENDIENTES */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PAGOS QR POR VERIFICAR</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <QrCode size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-3">
              {qrPendingPayments.length} <span className="text-xs font-bold text-slate-400">Solicitudes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Transferencia QR Banco Fortaleza en espera
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${
              activeTab === "resumen"
                ? "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/40 shadow-md"
                : "bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <BarChart2 size={16} /> Resumen & Flujo de Caja
          </button>

          <Link
            href="/finanzas/ingresos"
            className="px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap flex items-center gap-2 bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-emerald-400 transition-all"
          >
            <ArrowUpRight size={16} className="text-emerald-400" /> Módulo de Ingresos
          </Link>

          <Link
            href="/finanzas/egresos"
            className="px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap flex items-center gap-2 bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-rose-400 transition-all"
          >
            <ArrowDownRight size={16} className="text-rose-400" /> Módulo de Egresos
          </Link>

          <button
            onClick={() => setActiveTab("qr")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${
              activeTab === "qr"
                ? "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/40 shadow-md"
                : "bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <QrCode size={16} /> Verificación QR ({qrPendingPayments.length})
          </button>
        </div>

        {/* VISTA CONTENIDO TAB 1: RESUMEN GENERAL & GRÁFICOS */}
        {activeTab === "resumen" && (
          <div className="space-y-8">
            {/* GRÁFICO DE FLUJO MENSUAL DE CAJA */}
            <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#20CDFE]" />
                Flujo de Caja Mensual (Ingresos vs Egresos)
              </h3>
              <p className="text-xs text-slate-400 mb-6">Comparativa gráfica de entradas y salidas financieras registradas por mes.</p>

              {summary?.monthly_flow && summary.monthly_flow.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthly_flow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="month_name" stroke="#64748B" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0A101D", borderColor: "#334155", borderRadius: "12px", color: "#FFF" }}
                      />
                      <Legend />
                      <Bar dataKey="total_ingresos" name="Ingresos (Bs.)" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total_egresos" name="Egresos (Bs.)" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aún no hay suficientes movimientos mensuales para proyectar el gráfico.
                </div>
              )}
            </div>

            {/* TABLA DE MOVIMIENTOS RECIENTES */}
            <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#20CDFE]" />
                    Últimos Movimientos Financieros
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Historial consolidado de las transacciones más recientes.</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/finanzas/ingresos" className="text-xs font-bold text-emerald-400 hover:underline">Ver todos Ingresos →</Link>
                  <span className="text-slate-600">|</span>
                  <Link href="/finanzas/egresos" className="text-xs font-bold text-rose-400 hover:underline">Ver todos Egresos →</Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#15233D] border-b border-slate-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Tipo</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Concepto / Título</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Categoría</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Monto</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Fecha</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Empresa / Proyecto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                          No hay transacciones recientes registradas.
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-[#15233D]/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${
                              t.type === "ingreso"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {t.type === "ingreso" ? "▲ INGRESO" : "▼ EGRESO"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-white text-xs">{t.title}</td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold capitalize">
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-black text-xs ${t.type === "ingreso" ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.type === "ingreso" ? "+" : "-"}{Number(t.amount).toFixed(2)} Bs.
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{formatDate(t.transaction_date)}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {t.company?.name || t.project?.name || "General"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISTA CONTENIDO TAB 2: VERIFICACIÓN PAGO QR BANCO FORTALEZA */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
                <QrCode size={18} className="text-[#20CDFE]" />
                Verificación de Pagos QR Banco Fortaleza
              </h3>
              <p className="text-xs text-slate-400 mb-6">Inspección de comprobantes enviados por clientes para activación automática de paquetes.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#15233D] border-b border-slate-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Empresa / Cliente</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Paquete</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Monto</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Ref</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Comprobante</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Estado</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold text-xs uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {packageRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500 text-xs">No hay solicitudes de pago QR registradas.</td>
                      </tr>
                    ) : (
                      packageRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-[#15233D]/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white text-xs">{r.company?.name || "Empresa"}</div>
                            <div className="text-[11px] text-[#20CDFE]">{r.client_user?.name}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 font-semibold">{r.package?.name || "Personalizado"}</td>
                          <td className="px-4 py-3 font-black text-emerald-400 text-xs">
                            {Number(r.package?.base_price || 0).toFixed(2)} Bs.
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.payment_reference || "-"}</td>
                          <td className="px-4 py-3">
                            {r.payment_receipt_url ? (
                              <button
                                onClick={() => setPreviewReceiptUrl(r.payment_receipt_url || null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#20CDFE]/10 border border-[#20CDFE]/30 text-[#20CDFE] text-xs font-bold hover:bg-[#20CDFE]/20"
                              >
                                <ImageIcon size={13} /> Adjunto
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Sin adjunto</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              r.payment_status === "pago_verificado"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : r.payment_status === "rechazado"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}>
                              {r.payment_status === "pago_verificado" && "✅ Verificado"}
                              {r.payment_status === "rechazado" && "❌ Rechazado"}
                              {r.payment_status === "pendiente_verificacion" && "⏳ Pendiente"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.payment_status === "pendiente_verificacion" && (
                              <button
                                onClick={() => setVerifyModalReq(r)}
                                className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                              >
                                Verificar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VERIFICAR PAGO (Admin) */}
      {verifyModalReq && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-white">Verificación de Pago QR</h3>
            <div className="bg-[#15233D]/60 border border-slate-800 rounded-xl p-4 text-left space-y-1 text-xs text-slate-300">
              <div>Empresa: <strong className="text-[#20CDFE]">{verifyModalReq.company?.name}</strong></div>
              <div>Paquete: <strong className="text-amber-300">{verifyModalReq.package?.name}</strong></div>
              <div>Monto: <strong className="text-emerald-400 font-bold">{Number(verifyModalReq.package?.base_price || 0).toFixed(2)} Bs.</strong></div>
              <div>Ref: <strong className="font-mono text-white">{verifyModalReq.payment_reference || "N/A"}</strong></div>
            </div>
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => handleVerifyPayment("rechazado")}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleVerifyPayment("pago_verificado")}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold hover:opacity-90 shadow-lg shadow-emerald-500/20"
              >
                Aprobar y Activar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR COMPLEMENTARIO DE COMPROBANTE */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-[#20CDFE]/40 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ImageIcon className="text-[#20CDFE]" size={18} /> Comprobante Adjunto
              </h4>
              <button onClick={() => setPreviewReceiptUrl(null)} className="p-2 text-slate-300 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-[#07060B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewReceiptUrl} alt="Comprobante" className="max-h-[70vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
