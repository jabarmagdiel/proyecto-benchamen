"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, TrendingUp, CreditCard, ShieldCheck, Clock, XCircle,
  Building2, Calendar, FileText, CheckCircle2, Filter, Search, ArrowUpRight,
  Sparkles, Wallet, QrCode
} from "lucide-react";
import { packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { PackageRequest } from "@/types";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente_verificacion: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  pago_verificado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rechazado: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function FinanzasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";

  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  /* Modal de Verificación */
  const [verifyModalReq, setVerifyModalReq] = useState<PackageRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await packageRequestsApi.list();
      setRequests(res.data || []);
    } catch (e) {
      console.error("Error al cargar finanzas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  /* Cálculos Financieros */
  const paymentRequests = requests.filter(r => r.request_type === "subscription_payment");

  const verifiedPayments = paymentRequests.filter(r => r.payment_status === "pago_verificado");
  const pendingPayments = paymentRequests.filter(r => r.payment_status === "pendiente_verificacion");
  const rejectedPayments = paymentRequests.filter(r => r.payment_status === "rechazado");

  const totalVerifiedRevenue = verifiedPayments.reduce((acc, r) => {
    const price = Number(r.package?.base_price || 0);
    return acc + price;
  }, 0);

  const totalPendingRevenue = pendingPayments.reduce((acc, r) => {
    const price = Number(r.package?.base_price || 0);
    return acc + price;
  }, 0);

  /* Filtrado para la tabla */
  const filteredLedger = paymentRequests.filter((r) => {
    const matchesStatus =
      statusFilter === "todos" ? true : r.payment_status === statusFilter;

    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (r.company?.name || "").toLowerCase().includes(query) ||
      (r.client_user?.name || "").toLowerCase().includes(query) ||
      (r.package?.name || "").toLowerCase().includes(query) ||
      (r.payment_reference || "").toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

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
              Módulo de Finanzas & Registro de Pagos
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Control centralizado de ingresos, verificación de pagos QR Banco Fortaleza y suscripciones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-[#15233D] border border-slate-800 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2">
              <QrCode size={16} className="text-[#20CDFE]" /> Cuenta: Banco Fortaleza (BENJAMIN CABA EGUEZ)
            </span>
          </div>
        </div>

        {/* METRICAS Y KPIS FINANCIEROS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1 */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">INGRESOS VERIFICADOS</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-3">
              {totalVerifiedRevenue.toFixed(2)} <span className="text-xs font-bold text-emerald-400">Bs.</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} className="text-emerald-400" /> {verifiedPayments.length} transacción(es) confirmada(s)
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PAGOS POR VERIFICAR</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-3">
              {totalPendingRevenue.toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingPayments.length} pago(s) en espera de aprobación
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SUSCRIPCIONES ACTIVAS</span>
              <div className="p-2.5 rounded-xl bg-[#20CDFE]/10 text-[#20CDFE] border border-[#20CDFE]/20">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-3">
              {verifiedPayments.length} <span className="text-xs font-bold text-[#20CDFE]">Planes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Cobro recurrente mensual activo
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MÉTODO PRINCIPAL</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <QrCode size={20} />
              </div>
            </div>
            <div className="text-xl font-bold text-white mt-3 truncate">
              QR Banco Fortaleza
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Transferencia Simple QR integrada
            </div>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl shadow-lg">
          {/* Filtros por Estado */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "todos", label: `Todos (${paymentRequests.length})` },
              { id: "pendiente_verificacion", label: `⏳ Pendientes (${pendingPayments.length})` },
              { id: "pago_verificado", label: `✅ Verificados (${verifiedPayments.length})` },
              { id: "rechazado", label: `❌ Rechazados (${rejectedPayments.length})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  statusFilter === st.id
                    ? "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/40 shadow-md"
                    : "bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por empresa, cliente o nro de ref..."
              className="w-full pl-10 pr-4 py-2 bg-[#15233D]/60 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#20CDFE]"
            />
          </div>
        </div>

        {/* TABLA DE REGISTROS DE PAGO */}
        <div className="bg-[#0A101D]/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30 text-[#20CDFE]" />
              <p className="font-bold text-white text-base">No hay registros financieros para este filtro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Empresa / Cliente</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Paquete / Servicio</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Monto Mensual</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Método & Comprobante</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Fecha</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Estado</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredLedger.map((r) => (
                    <tr key={r.id} className="hover:bg-[#15233D]/40 transition-colors">
                      {/* Empresa / Cliente */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{r.company?.name || "Empresa"}</div>
                        <div className="text-xs text-[#20CDFE] font-medium mt-0.5">{r.client_user?.name || "Cliente"}</div>
                      </td>

                      {/* Paquete */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200">{r.package?.name || "Paquete Personalizado"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID Paquete: #{r.package_id}</div>
                      </td>

                      {/* Monto */}
                      <td className="px-5 py-4 font-black text-emerald-400 text-sm">
                        {r.package?.price_type === "custom_text" ? (
                          <span className="text-xs text-amber-300">{r.package.price_text}</span>
                        ) : (
                          `${Number(r.package?.base_price || 0).toFixed(2)} Bs.`
                        )}
                      </td>

                      {/* Método y Comprobante */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <CreditCard size={14} className="text-[#20CDFE]" />
                          <span>{r.payment_method || "QR Banco Fortaleza"}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Ref: <strong className="text-slate-200">{r.payment_reference || "Sin ref"}</strong>
                        </div>
                        {r.notes && (
                          <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">{r.notes}</div>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {formatDate(r.created_at)}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${PAYMENT_STATUS_COLORS[r.payment_status] || "bg-slate-800 text-slate-300"}`}>
                          {r.payment_status === "pendiente_verificacion" && "⏳ Pendiente"}
                          {r.payment_status === "pago_verificado" && "✅ Verificado"}
                          {r.payment_status === "rechazado" && "❌ Rechazado"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4">
                        {isAdmin && r.payment_status === "pendiente_verificacion" ? (
                          <button
                            onClick={() => setVerifyModalReq(r)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold hover:opacity-90 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <ShieldCheck size={14} /> Verificar Pago
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">Procesado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL VERIFICAR PAGO (Admin) */}
      {verifyModalReq && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in text-center">
            <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-white">Verificación de Pago Recibido</h3>

            <div className="bg-[#15233D]/60 border border-slate-800 rounded-xl p-4 text-left space-y-1.5 text-xs text-slate-300">
              <div>Empresa: <strong className="text-[#20CDFE]">{verifyModalReq.company?.name}</strong></div>
              <div>Cliente: <strong className="text-white">{verifyModalReq.client_user?.name}</strong></div>
              <div>Paquete: <strong className="text-amber-300">{verifyModalReq.package?.name}</strong></div>
              <div>Monto: <strong className="text-emerald-400 font-bold">{Number(verifyModalReq.package?.base_price || 0).toFixed(2)} Bs.</strong></div>
              <div>Método: <strong className="text-white">{verifyModalReq.payment_method || "QR Banco Fortaleza"}</strong></div>
              <div>Comprobante/Ref: <strong className="font-mono text-white">{verifyModalReq.payment_reference || "N/A"}</strong></div>
              {verifyModalReq.notes && <div>Notas: <span className="italic text-slate-400">{verifyModalReq.notes}</span></div>}
            </div>

            <p className="text-xs text-slate-400">
              Al aprobar, la suscripción mensual se activará automáticamente y se habilitarán los cupos del cliente.
            </p>

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
    </>
  );
}
