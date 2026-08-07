"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, RefreshCw, Calendar, CheckCircle2, XCircle,
  Clock, AlertTriangle, Plus, Trash2, RotateCcw, ChevronDown,
  Building2, Package as PkgIcon, TrendingUp, X, BadgeCheck,
  Timer, Info, ChevronRight, Layers
} from "lucide-react";
import { subscriptionsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CompanyPackage } from "@/types";

/* ── Helpers ── */
const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  activo:    { pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400", label: "Activa" },
  expirado:  { pill: "bg-amber-500/20 text-amber-300 border-amber-500/30",       dot: "bg-amber-400",   label: "Expirada" },
  cancelado: { pill: "bg-rose-500/20 text-rose-300 border-rose-500/30",           dot: "bg-rose-400",    label: "Cancelada" },
};

function getDaysRemaining(endDate?: string | null): number {
  if (!endDate) return 0;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

export default function SuscripcionesPage() {
  const [subs, setSubs] = useState<CompanyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  /* Filtros */
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterSearch, setFilterSearch] = useState<string>("");

  /* Modal detalle / cuotas */
  const [detailSub, setDetailSub] = useState<CompanyPackage | null>(null);
  const [addQuotaItem, setAddQuotaItem] = useState<string>("");
  const [addQuotaQty, setAddQuotaQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.list();
      setSubs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Acciones ── */
  const handleRenew = async (cpId: number) => {
    if (!confirm("¿Renovar esta suscripción por 30 días?")) return;
    setSubmitting(true);
    try {
      await subscriptionsApi.renew(cpId, 30);
      showToast("✅ Suscripción renovada por 30 días más");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al renovar", "error");
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (cpId: number) => {
    if (!confirm("¿Cancelar esta suscripción? El cliente perderá acceso a sus cupos.")) return;
    setSubmitting(true);
    try {
      await subscriptionsApi.cancel(cpId);
      showToast("Suscripción cancelada");
      load();
      if (detailSub?.id === cpId) setDetailSub(null);
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al cancelar", "error");
    } finally { setSubmitting(false); }
  };

  const handleAddQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSub || !addQuotaItem) return;
    setSubmitting(true);
    try {
      await subscriptionsApi.addQuota(detailSub.id, addQuotaItem, addQuotaQty);
      showToast(`✅ +${addQuotaQty} cupos de "${addQuotaItem}" agregados`);
      load();
      setAddQuotaItem("");
      setAddQuotaQty(1);
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al agregar cupos", "error");
    } finally { setSubmitting(false); }
  };

  /* ── KPIs ── */
  const active    = subs.filter((s) => s.status === "activo");
  const expired   = subs.filter((s) => s.status === "expirado");
  const cancelled = subs.filter((s) => s.status === "cancelado");
  const soonExpiring = active.filter((s) => getDaysRemaining(s.end_date) <= 7 && getDaysRemaining(s.end_date) >= 0);
  const totalMRC  = active.reduce((sum, s) => sum + Number(s.final_price || s.package?.base_price || 0), 0);

  /* ── Filtrado ── */
  const filtered = subs.filter((s) => {
    const matchStatus = filterStatus === "todos" || s.status === filterStatus;
    const term = filterSearch.toLowerCase();
    const matchSearch = !term || (
      s.company?.name?.toLowerCase().includes(term) ||
      s.package?.name?.toLowerCase().includes(term)
    );
    return matchStatus && matchSearch;
  });

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold max-w-sm
          ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in pb-16">

        {/* ── Header ── */}
        <div className="bg-[#0A101D]/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#20CDFE]/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={24} className="text-[#20CDFE]" />
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Control de Suscripciones</h2>
              </div>
              <p className="text-slate-400 text-sm">
                Gestiona el estado de todos los planes activos, renueva, cancela y administra cupos por empresa.
              </p>
            </div>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0A101D]/60 text-slate-400 hover:text-[#20CDFE] hover:border-[#20CDFE]/40 text-xs font-bold transition-all shrink-0">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualizar
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Activas", value: active.length, icon: BadgeCheck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Por Vencer (≤7 días)", value: soonExpiring.length, icon: Timer, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Expiradas", value: expired.length, icon: Clock, color: "text-slate-400", bg: "bg-slate-800/40 border-slate-700/30" },
            { label: "Ingreso Mensual (MRC)", value: `${totalMRC.toFixed(0)} Bs.`, icon: TrendingUp, color: "text-[#20CDFE]", bg: "bg-[#20CDFE]/10 border-[#20CDFE]/20" },
          ].map((k, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${k.bg} flex flex-col gap-2`}>
              <k.icon size={20} className={k.color} />
              <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-xs text-slate-400 font-medium">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por empresa o paquete..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#0A101D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]"
          />
          <div className="flex gap-2">
            {["todos", "activo", "expirado", "cancelado"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${
                  filterStatus === s
                    ? "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/40"
                    : "bg-[#0A101D]/60 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {s === "todos" ? "Todas" : STATUS_STYLES[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabla de Suscripciones ── */}
        <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Layers size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-white">No hay suscripciones que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Empresa</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Plan</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Vigencia</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Días Rest.</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Cupos</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((sub) => {
                    const st = STATUS_STYLES[sub.status] || STATUS_STYLES.expirado;
                    const days = getDaysRemaining(sub.end_date);
                    const quantityItems = sub.items?.filter((i) => i.item_type === "por_cantidad") || [];

                    return (
                      <tr key={sub.id} className="hover:bg-[#15233D]/30 transition-colors">
                        {/* Empresa */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#20CDFE]/10 border border-[#20CDFE]/20 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-[#20CDFE]" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{sub.company?.name || "—"}</p>
                              <p className="text-[11px] text-slate-500">ID #{sub.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-200">{sub.package?.name || "—"}</div>
                          <div className="text-xs text-emerald-400 font-medium mt-0.5">
                            {sub.final_price ? `${Number(sub.final_price).toFixed(2)} Bs.` : "—"}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        {/* Vigencia */}
                        <td className="px-5 py-4 text-xs text-slate-400">
                          <div>{sub.start_date ? formatDate(sub.start_date) : "—"}</div>
                          <div className="text-slate-500">→ {sub.end_date ? formatDate(sub.end_date) : "Sin fecha"}</div>
                        </td>

                        {/* Días restantes */}
                        <td className="px-5 py-4">
                          {sub.status === "activo" ? (
                            <span className={`font-black text-sm ${days <= 3 ? "text-rose-400" : days <= 7 ? "text-amber-400" : "text-emerald-400"}`}>
                              {days} días
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Cupos */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {quantityItems.length === 0 ? (
                              <span className="text-xs text-slate-600">Sin cupos</span>
                            ) : quantityItems.map((item) => (
                              <span key={item.id} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                item.quantity_remaining === 0
                                  ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                  : "bg-[#15233D] text-slate-300 border-slate-700"
                              }`}>
                                {item.quantity_remaining}/{item.quantity_initial} {item.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setDetailSub(sub);
                                setAddQuotaItem(quantityItems[0]?.name || "");
                                setAddQuotaQty(1);
                              }}
                              className="p-1.5 text-[#20CDFE] bg-[#20CDFE]/10 hover:bg-[#20CDFE]/20 rounded-lg transition-colors border border-[#20CDFE]/20"
                              title="Ver detalle / agregar cupos"
                            >
                              <Info size={14} />
                            </button>

                            <button
                              onClick={() => handleRenew(sub.id)}
                              disabled={submitting}
                              className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20 disabled:opacity-50"
                              title="Renovar 30 días"
                            >
                              <RotateCcw size={14} />
                            </button>

                            {sub.status === "activo" && (
                              <button
                                onClick={() => handleCancel(sub.id)}
                                disabled={submitting}
                                className="p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20 disabled:opacity-50"
                                title="Cancelar suscripción"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Detalle y Agregar Cupos ── */}
      {detailSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A101D] border border-[#20CDFE]/30 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 sticky top-0 bg-[#0A101D] z-10">
              <div>
                <h3 className="font-black text-white text-lg">Detalle de Suscripción</h3>
                <p className="text-sm text-[#20CDFE] font-semibold mt-0.5">{detailSub.company?.name} — {detailSub.package?.name}</p>
              </div>
              <button onClick={() => setDetailSub(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info general */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Estado", value: STATUS_STYLES[detailSub.status]?.label || detailSub.status },
                  { label: "Precio", value: `${Number(detailSub.final_price || 0).toFixed(2)} Bs.` },
                  { label: "Inicio", value: detailSub.start_date ? formatDate(detailSub.start_date) : "—" },
                  { label: "Vencimiento", value: detailSub.end_date ? formatDate(detailSub.end_date) : "—" },
                ].map((d, i) => (
                  <div key={i} className="bg-[#15233D]/60 rounded-xl p-3 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{d.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* Estado cupos */}
              {detailSub.items && detailSub.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cupos del Plan</h4>
                  <div className="space-y-3">
                    {detailSub.items.map((item) => (
                      <div key={item.id} className="bg-[#07060B]/60 border border-slate-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{item.name}</span>
                          {item.item_type === "por_cantidad" ? (
                            <span className={`text-xs font-black ${item.quantity_remaining === 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {item.quantity_remaining} / {item.quantity_initial}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold">Incluido</span>
                          )}
                        </div>
                        {item.item_type === "por_cantidad" && (
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.quantity_remaining === 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, (item.quantity_remaining / Math.max(item.quantity_initial, 1)) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario agregar cupos */}
              {detailSub.items?.some((i) => i.item_type === "por_cantidad") && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agregar Cupos Adicionales</h4>
                  <form onSubmit={handleAddQuota} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Ítem</label>
                      <select
                        value={addQuotaItem}
                        onChange={(e) => setAddQuotaItem(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30"
                      >
                        {detailSub.items?.filter((i) => i.item_type === "por_cantidad").map((item) => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Cantidad a agregar</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={addQuotaQty}
                        onChange={(e) => setAddQuotaQty(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !addQuotaItem}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] text-sm font-extrabold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#20CDFE]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={15} />
                      {submitting ? "Agregando..." : `Agregar ${addQuotaQty} cupos`}
                    </button>
                  </form>
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="flex gap-3 pt-2 border-t border-slate-800/50">
                <button
                  onClick={() => handleRenew(detailSub.id)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Renovar 30 días
                </button>
                {detailSub.status === "activo" && (
                  <button
                    onClick={() => handleCancel(detailSub.id)}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={13} /> Cancelar suscripción
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
