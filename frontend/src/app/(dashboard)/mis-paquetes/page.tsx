"use client";

import { useEffect, useState } from "react";
import {
  Package as PkgIcon, Send, CheckCircle2, Clock, XCircle,
  AlertTriangle, CreditCard, ShieldCheck, Calendar, Sparkles,
  Check, RefreshCw, ChevronRight, Layers, BadgeCheck, Timer,
  Code, Image as ImageIcon, Megaphone, Tag, X, RotateCcw,
  Upload, FileText, Eye
} from "lucide-react";
import { packagesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { ServicePackage, PackageRequest, CompanyPackage } from "@/types";

/* ── Helpers ── */
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente_verificacion: "⏳ Pendiente verificación",
  pago_verificado: "✅ Pago verificado",
  rechazado: "❌ Rechazado",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  aceptada: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  en_proceso: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  entregada: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  rechazada: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

export default function MisPaquetesPage() {
  const { user, profile } = useAuth();
  const companyId = profile?.company_id || user?.company_id;

  const [catalog, setCatalog] = useState<ServicePackage[]>([]);
  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [mySubscription, setMySubscription] = useState<CompanyPackage | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<CompanyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  /* Modal suscripción */
  const [subscribeModalPkg, setSubscribeModalPkg] = useState<ServicePackage | null>(null);
  const [payMethod, setPayMethod] = useState("QR");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await packageRequestsApi.uploadReceipt(formData);
      setReceiptUrl(res.data.url);
      showToast("✅ Comprobante de pago subido");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al subir comprobante", "error");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      // Catálogo: solo paquetes mensuales activos
      const pRes = await packagesApi.list({ offering_type: "package" });
      setCatalog(pRes.data.filter((p: ServicePackage) => p.is_active));

      // Mis solicitudes
      const rRes = await packageRequestsApi.list();
      setRequests(rRes.data);

      // Mis suscripciones
      if (companyId) {
        const subRes = await packagesApi.getCompanyPackages(companyId);
        const subs: CompanyPackage[] = subRes.data;
        setAllSubscriptions(subs);
        const active = subs.find((s) => s.status === "activo") || null;
        setMySubscription(active);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  /* ── Determinar estado de suscripción para cada paquete ── */
  const getPackageRequestState = (pkgId: number): PackageRequest | null => {
    // Solo bloquear si hay una solicitud activa (no rechazada / no con pago rechazado)
    return requests.find(
      (r) =>
        r.package_id === pkgId &&
        r.request_type === "subscription_payment" &&
        r.status !== "rechazada" &&
        r.payment_status !== "rechazado"
    ) || null;
  };

  /* ── Enviar pago de suscripción ── */
  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeModalPkg || !companyId) return;
    setSubmitting(true);
    try {
      await packageRequestsApi.create({
        company_id: companyId,
        package_id: subscribeModalPkg.id,
        request_type: "subscription_payment",
        payment_method: payMethod,
        payment_reference: payRef || undefined,
        payment_receipt_url: receiptUrl || undefined,
        notes: payNotes || undefined,
        quantity_requested: 1,
      });
      showToast("🎉 Solicitud enviada. El administrador verificará tu pago y activará la suscripción.");
      setSubscribeModalPkg(null);
      setPayRef("");
      setPayNotes("");
      setReceiptUrl("");
      setPayMethod("QR");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al registrar el pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Helpers de fecha ── */
  const getDaysRemaining = (endDate?: string): number => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const subscriptionPayments = requests.filter((r) => r.request_type === "subscription_payment");

  /* ─────────────────────────────────────────────── RENDER ─── */
  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold transition-all duration-300 max-w-sm
          ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20" : "bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-500/20"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Layers className="text-[#20CDFE]" size={26} />
              Mis Paquetes y Suscripciones
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Gestiona tu suscripción mensual activa y explora el catálogo de planes disponibles.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-[#0A101D]/60 text-slate-400 hover:text-[#20CDFE] hover:border-[#20CDFE]/40 text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>

        {/* ── Banner Suscripción Activa ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
          </div>
        ) : mySubscription ? (
          /* ── TIENE SUSCRIPCIÓN ACTIVA ── */
          <div className="bg-gradient-to-br from-[#0D1F37] via-[#0A101D] to-[#07060B] border border-[#20CDFE]/40 rounded-3xl p-7 shadow-2xl shadow-[#20CDFE]/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#20CDFE]/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                      <BadgeCheck size={13} /> Suscripción Activa
                    </span>
                    {(() => {
                      const days = getDaysRemaining(mySubscription.end_date);
                      return days <= 7 ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                          <Timer size={11} /> Vence en {days} días
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <h3 className="text-2xl font-black text-white">{mySubscription.package?.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-lg">{mySubscription.package?.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-[#20CDFE]" />
                      Inicio: <span className="text-white font-medium ml-1">{mySubscription.start_date ? formatDate(mySubscription.start_date) : "—"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-amber-400" />
                      Vence: <span className="text-white font-medium ml-1">{mySubscription.end_date ? formatDate(mySubscription.end_date) : "—"}</span>
                    </span>
                  </div>
                </div>

                {/* Cupos */}
                {mySubscription.items && mySubscription.items.length > 0 && (
                  <div className="flex flex-wrap gap-3 shrink-0">
                    {mySubscription.items.map((item) => (
                      <div key={item.id} className="bg-[#0A101D]/90 border border-slate-800 rounded-2xl px-4 py-3 text-center min-w-[90px]">
                        {item.item_type === "por_cantidad" ? (
                          <>
                            <div className="text-2xl font-black text-[#20CDFE]">{item.quantity_remaining}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.name}</div>
                            <div className="text-[9px] text-slate-600">de {item.quantity_initial} total</div>
                          </>
                        ) : (
                          <>
                            <div className="text-emerald-400"><Check size={22} className="mx-auto" /></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.name}</div>
                            <div className="text-[9px] text-emerald-600">Incluido</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── SIN SUSCRIPCIÓN ACTIVA ── */
          <div className="bg-gradient-to-br from-[#1A1008] to-[#0A101D] border border-amber-500/30 rounded-3xl p-7 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Sin Suscripción Activa</h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    No tienes un plan mensual activo. Selecciona uno del catálogo y registra tu pago para activarlo.
                  </p>
                </div>
              </div>
              <a href="#catalogo" className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] text-xs font-extrabold hover:opacity-90 transition-all whitespace-nowrap shadow-lg shadow-[#20CDFE]/20">
                <ChevronRight size={15} /> Ver Catálogo
              </a>
            </div>
          </div>
        )}

        {/* ── Suscripciones anteriores/expiradas ── */}
        {allSubscriptions.filter((s) => s.status !== "activo").length > 0 && (
          <div className="bg-[#0A101D]/40 border border-slate-800/50 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Clock size={14} /> Historial de Suscripciones
            </h4>
            <div className="flex flex-wrap gap-3">
              {allSubscriptions
                .filter((s) => s.status !== "activo")
                .map((s) => (
                  <div key={s.id} className="bg-[#0A101D]/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-300">{s.package?.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {s.start_date ? formatDate(s.start_date) : "—"} → {s.end_date ? formatDate(s.end_date) : "—"}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === "expirado" ? "bg-slate-700 text-slate-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Catálogo de Paquetes ── */}
        <div id="catalogo">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PkgIcon size={20} className="text-[#20CDFE]" />
              Catálogo de Planes Mensuales
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Elige un plan y regístralo. El administrador verificará tu pago para activarlo.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
            </div>
          ) : catalog.length === 0 ? (
            <div className="text-center py-16 bg-[#0A101D]/40 rounded-2xl border border-slate-800/50">
              <PkgIcon size={40} className="mx-auto mb-3 opacity-20 text-[#20CDFE]" />
              <p className="font-bold text-slate-400">No hay planes disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map((pkg) => {
                const activeRequest = getPackageRequestState(pkg.id);
                const isThisActive = mySubscription?.package_id === pkg.id;
                const rejectedRequest = requests.find(
                  (r) => r.package_id === pkg.id &&
                    r.request_type === "subscription_payment" &&
                    (r.status === "rechazada" || r.payment_status === "rechazado")
                );

                return (
                  <div
                    key={pkg.id}
                    className={`bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-xl relative overflow-hidden group
                      ${isThisActive
                        ? "border-emerald-500/50 shadow-emerald-500/10"
                        : "border-slate-800/80 hover:border-[#20CDFE]/50 hover:shadow-[#20CDFE]/10 hover:shadow-2xl"
                      }`}
                  >
                    {isThisActive && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                        <BadgeCheck size={11} /> Activo
                      </div>
                    )}

                    <div>
                      {/* Badge categoría */}
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 border bg-[#15233D] text-[#20CDFE] border-[#20CDFE]/30">
                        {pkg.category === "software" ? <Code size={10} /> : pkg.category === "diseno" ? <ImageIcon size={10} /> : <Megaphone size={10} />}
                        {pkg.category === "software" ? "Software" : pkg.category === "diseno" ? "Diseño" : "Marketing"}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-[#20CDFE] transition-colors mb-1">{pkg.name}</h3>

                      <div className="text-xl font-black text-[#20CDFE] mb-3">
                        {pkg.price_type === "custom_text" ? (
                          <span className="text-sm font-bold text-amber-400">{pkg.price_text || "Por definir"}</span>
                        ) : (
                          <>{Number(pkg.base_price).toFixed(2)} <span className="text-xs font-semibold text-slate-400">Bs. / mes</span></>
                        )}
                      </div>

                      <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed">{pkg.description}</p>

                      {/* Items del paquete */}
                      {pkg.items && pkg.items.length > 0 && (
                        <div className="space-y-2 py-3 border-t border-b border-slate-800/60 mb-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Incluye:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.items.filter((i) => i.item_type === "por_cantidad").map((item, idx) => (
                              <span key={idx} className="bg-[#15233D]/80 border border-slate-700/50 text-slate-200 px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1">
                                <strong className="text-[#20CDFE]">{item.quantity}</strong> {item.name}
                              </span>
                            ))}
                          </div>
                          {pkg.items.filter((i) => i.item_type === "indefinido").map((item, idx) => (
                            <div key={idx} className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Check size={12} className="text-emerald-400 shrink-0" />
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botón de acción — SIEMPRE VISIBLE */}
                    <div className="pt-1">
                      {isThisActive ? (
                        <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 py-3 rounded-xl text-xs font-extrabold">
                          <BadgeCheck size={15} /> Plan Activo — Renovar al vencer
                        </div>
                      ) : activeRequest ? (
                        <div className="space-y-2">
                          <div className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 py-2.5 rounded-xl text-xs font-bold">
                            <Clock size={13} /> {PAYMENT_STATUS_LABELS[activeRequest.payment_status] || "Solicitud enviada"}
                          </div>
                          <p className="text-center text-[10px] text-slate-500">Tu pago está siendo revisado por el administrador.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rejectedRequest && (
                            <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold justify-center">
                              <XCircle size={11} /> Solicitud anterior rechazada — Puedes reintentar
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSubscribeModalPkg(pkg);
                              setPayRef("");
                              setPayNotes("");
                              setPayMethod("QR");
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-3 rounded-xl text-xs font-extrabold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20 transition-all"
                          >
                            {rejectedRequest ? <RotateCcw size={14} /> : <CreditCard size={14} />}
                            {rejectedRequest ? "Reintentar Suscripción" : "Suscribirme a este Plan"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Historial de Solicitudes de Pago ── */}
        {subscriptionPayments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-[#20CDFE]" />
              Mis Solicitudes de Suscripción
            </h3>
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Plan</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Método Pago</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {subscriptionPayments.map((r) => (
                    <tr key={r.id} className="hover:bg-[#0F192E] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">{r.package?.name || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[r.status] || "bg-slate-700 text-slate-300"}`}>
                          {r.payment_status === "pendiente_verificacion" && <Clock size={11} />}
                          {r.payment_status === "pago_verificado" && <CheckCircle2 size={11} />}
                          {r.payment_status === "rechazado" && <XCircle size={11} />}
                          {PAYMENT_STATUS_LABELS[r.payment_status] || r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{r.payment_method || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Registrar Pago de Suscripción ── */}
      {subscribeModalPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A101D] border border-[#20CDFE]/30 rounded-3xl shadow-2xl shadow-[#20CDFE]/10 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <CreditCard size={20} className="text-[#20CDFE]" />
                  Registrar Pago de Suscripción
                </h3>
                <p className="text-sm text-[#20CDFE] font-semibold mt-0.5">{subscribeModalPkg.name}</p>
              </div>
              <button onClick={() => setSubscribeModalPkg(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubscribeSubmit} className="p-6 space-y-5">
              {/* Precio */}
              <div className="bg-[#15233D]/60 rounded-2xl p-4 border border-slate-800/50">
                <div className="text-xs text-slate-400 mb-1 font-medium">Monto a pagar:</div>
                <div className="text-3xl font-black text-white">
                  {subscribeModalPkg.price_type === "custom_text"
                    ? subscribeModalPkg.price_text
                    : `${Number(subscribeModalPkg.base_price).toFixed(2)} Bs.`}
                </div>
                <div className="text-xs text-slate-400 mt-1">Plan mensual (30 días)</div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Método de Pago *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["QR", "Transferencia", "Efectivo"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        payMethod === m
                          ? "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/40"
                          : "bg-[#15233D]/40 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Referencia / Número de Confirmación</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Ej. TXN-123456, Ref. banco, etc."
                  className="w-full px-4 py-3 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]"
                />
              </div>

              {/* Subir Comprobante (Imagen/PDF) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Adjuntar Comprobante (Imagen o PDF)</span>
                  {receiptUrl && <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Adjuntado</span>}
                </label>
                
                <div className="relative border-2 border-dashed border-slate-700 hover:border-[#20CDFE]/50 rounded-2xl p-4 text-center bg-[#15233D]/30 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceiptFileChange}
                    disabled={uploadingReceipt}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  
                  {uploadingReceipt ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#20CDFE] py-2">
                      <div className="w-4 h-4 border-2 border-[#20CDFE] border-t-transparent rounded-full animate-spin" />
                      Subiendo comprobante...
                    </div>
                  ) : receiptUrl ? (
                    <div className="flex items-center justify-between gap-3 text-xs text-white">
                      <div className="flex items-center gap-2 truncate">
                        {receiptUrl.endsWith(".pdf") ? (
                          <FileText size={18} className="text-rose-400 shrink-0" />
                        ) : (
                          <ImageIcon size={18} className="text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate font-semibold text-slate-200">{receiptUrl.split('/').pop()}</span>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${receiptUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#20CDFE]/10 text-[#20CDFE] font-bold text-[11px] hover:bg-[#20CDFE]/20 z-20 flex items-center gap-1 shrink-0"
                      >
                        <Eye size={12} /> Ver
                      </a>
                    </div>
                  ) : (
                    <div className="py-2 text-slate-400 flex flex-col items-center gap-1">
                      <Upload size={20} className="text-[#20CDFE]" />
                      <p className="text-xs font-semibold text-slate-300">Haz clic o arrastra aquí tu comprobante</p>
                      <p className="text-[10px] text-slate-500">Formatos permitidos: JPG, PNG, WEBP, PDF (Máx 15MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Notas adicionales (opcional)</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  placeholder="Cualquier detalle adicional sobre el pago..."
                  className="w-full px-4 py-3 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] resize-none"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                El administrador revisará y verificará tu pago para activar la suscripción. Recibirás una notificación cuando sea aprobado.
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSubscribeModalPkg(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] text-sm font-extrabold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#20CDFE]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? "Enviando..." : "Enviar Solicitud de Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
