"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, Send, CheckCircle2, Clock, XCircle, AlertTriangle,
  Code, Image as ImageIcon, Megaphone, Tag, X, ChevronRight,
  FileText, Calendar, Info, RefreshCw, BadgeCheck, Upload, Eye, CreditCard
} from "lucide-react";
import { packagesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { ServicePackage, PackageRequest } from "@/types";

/* ── Helpers ── */
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  pendiente:  { bg: "bg-amber-500/20",   text: "text-amber-300",  icon: Clock },
  aceptada:   { bg: "bg-emerald-500/20", text: "text-emerald-300", icon: CheckCircle2 },
  en_proceso: { bg: "bg-blue-500/20",    text: "text-blue-300",   icon: Clock },
  entregada:  { bg: "bg-teal-500/20",    text: "text-teal-300",   icon: CheckCircle2 },
  rechazada:  { bg: "bg-rose-500/20",    text: "text-rose-300",   icon: XCircle },
};

const STATUS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente revisión",
  aceptada:   "Aceptada",
  en_proceso: "En proceso",
  entregada:  "Entregada",
  rechazada:  "Rechazada",
};

export default function MisServiciosPage() {
  const { user, profile } = useAuth();
  const companyId = profile?.company_id || user?.company_id;

  const [services, setServices] = useState<ServicePackage[]>([]);
  const [myRequests, setMyRequests] = useState<PackageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  /* Modal solicitud */
  const [selectedService, setSelectedService] = useState<ServicePackage | null>(null);
  const [reqTitle, setReqTitle] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqDate, setReqDate] = useState("");

  /* Datos de pago opcionales */
  const [payMethod, setPayMethod] = useState("QR");
  const [payRef, setPayRef] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  /* Modal visor comprobante */
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [previewReceiptTitle, setPreviewReceiptTitle] = useState<string>("");

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
      const sRes = await packagesApi.list({ offering_type: "individual_service" });
      setServices(sRes.data.filter((s: ServicePackage) => s.is_active));

      const rRes = await packageRequestsApi.list();
      setMyRequests(rRes.data.filter((r: PackageRequest) => r.request_type === "work_request"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !companyId) {
      showToast("No se pudo identificar tu empresa. Contacta al administrador.", "error");
      return;
    }
    if (!reqTitle.trim()) {
      showToast("El título del proyecto es obligatorio.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await packageRequestsApi.create({
        company_id: companyId,
        package_id: selectedService.id,
        request_type: "work_request",
        deliverable_type: selectedService.name,
        quantity_requested: 1,
        title: reqTitle.trim(),
        payment_method: payMethod,
        payment_reference: payRef || undefined,
        payment_receipt_url: receiptUrl || undefined,
        notes: reqNotes
          ? `${reqNotes}${reqDate ? `\n\nFecha deseada de entrega: ${reqDate}` : ""}`
          : reqDate ? `Fecha deseada de entrega: ${reqDate}` : undefined,
      });
      showToast("✅ Solicitud enviada correctamente. El equipo la revisará.");
      setSelectedService(null);
      setReqTitle("");
      setReqNotes("");
      setReqDate("");
      setPayRef("");
      setReceiptUrl("");
      setPayMethod("QR");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al enviar la solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const activeRequests = myRequests.filter((r) => !["rechazada", "entregada"].includes(r.status));
  const historyRequests = myRequests.filter((r) => ["rechazada", "entregada"].includes(r.status));

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold transition-all duration-300 max-w-sm
          ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="bg-[#0A101D]/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={24} className="text-emerald-400" />
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Solicitar Servicios</h2>
              </div>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                Contrata servicios puntuales sin necesidad de un plan mensual. Cuéntanos tu proyecto y el equipo se pondrá en contacto contigo para coordinar detalles y precio.
              </p>
            </div>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-[#0A101D]/60 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-bold transition-all shrink-0">
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>
        </div>

        {/* ── Solicitudes activas ── */}
        {activeRequests.length > 0 && (
          <div className="bg-[#0A101D]/50 border border-emerald-500/20 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-4">
              <Clock size={15} /> Mis Solicitudes en Curso ({activeRequests.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeRequests.map((r) => {
                const style = STATUS_STYLES[r.status] || STATUS_STYLES.pendiente;
                const Icon = style.icon;
                return (
                  <div key={r.id} className="bg-[#07060B]/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{r.title || r.deliverable_type || "Solicitud"}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{r.package?.name} · {formatDate(r.created_at)}</span>
                        {r.payment_method && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                            {r.payment_method}
                          </span>
                        )}
                        {r.payment_receipt_url && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewReceiptUrl(r.payment_receipt_url!);
                              setPreviewReceiptTitle(r.title || r.deliverable_type || "Servicio");
                            }}
                            className="text-[#20CDFE] hover:underline text-[10px] font-bold flex items-center gap-0.5"
                          >
                            <Eye size={10} /> Comprobante
                          </button>
                        )}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${style.bg} ${style.text} border-current/20`}>
                      <Icon size={11} /> {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Catálogo de Servicios Individuales ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag size={18} className="text-emerald-400" /> Servicios Disponibles
              </h3>
              <p className="text-slate-400 text-xs mt-1">Selecciona el servicio que necesitas y describe tu proyecto.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#2E455C] border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 bg-[#0A101D]/40 rounded-2xl border border-slate-800/50">
              <Sparkles size={40} className="mx-auto mb-3 opacity-20 text-emerald-400" />
              <p className="font-bold text-slate-400">No hay servicios individuales disponibles en este momento.</p>
              <p className="text-slate-500 text-xs mt-1">El administrador irá actualizando el catálogo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => {
                const pendingReq = myRequests.find(
                  (r) => r.package_id === svc.id && ["pendiente", "aceptada", "en_proceso"].includes(r.status)
                );

                return (
                  <div key={svc.id} className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-6 shadow-xl group">
                    <div>
                      {/* Category badge */}
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-3 border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                        {svc.category === "software" ? <Code size={10} /> : svc.category === "diseno" ? <ImageIcon size={10} /> : <Megaphone size={10} />}
                        {svc.category === "software" ? "Software" : svc.category === "diseno" ? "Diseño" : "Marketing"}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">{svc.name}</h3>

                      {/* Precio */}
                      <div className="text-base font-black mb-3">
                        {svc.price_type === "custom_text" ? (
                          <span className="text-amber-400">{svc.price_text || "Precio a cotizar"}</span>
                        ) : (
                          <span className="text-emerald-400">{Number(svc.base_price).toFixed(2)} <span className="text-xs font-semibold text-slate-400">Bs.</span></span>
                        )}
                      </div>

                      <p className="text-slate-400 text-xs line-clamp-4 mb-5 leading-relaxed">{svc.description || "Sin descripción disponible."}</p>
                    </div>

                    {/* Acción */}
                    {pendingReq ? (
                      <div className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 py-2.5 rounded-xl text-xs font-bold">
                        <Clock size={13} /> Solicitud en curso — {STATUS_LABELS[pendingReq.status]}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedService(svc);
                          setReqTitle("");
                          setReqNotes("");
                          setReqDate("");
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl text-xs font-extrabold hover:opacity-90 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Send size={14} /> Solicitar este Servicio
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Historial ── */}
        {historyRequests.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-400 mb-3 flex items-center gap-2">
              <FileText size={15} /> Historial de Solicitudes
            </h3>
            <div className="bg-[#0A101D]/40 border border-slate-800/50 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase">Servicio</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase">Título</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase">Estado</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium text-xs uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {historyRequests.map((r) => {
                    const style = STATUS_STYLES[r.status] || STATUS_STYLES.pendiente;
                    const Icon = style.icon;
                    return (
                      <tr key={r.id} className="hover:bg-[#0F192E] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-300 text-xs">{r.package?.name || "—"}</td>
                        <td className="px-5 py-3.5 font-bold text-white text-sm">{r.title || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                            <Icon size={11} /> {STATUS_LABELS[r.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(r.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Formulario de Solicitud ── */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A101D] border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-500/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 sticky top-0 bg-[#0A101D] z-10">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Sparkles size={20} className="text-emerald-400" />
                  Solicitar Servicio
                </h3>
                <p className="text-sm text-emerald-400 font-semibold mt-0.5">{selectedService.name}</p>
              </div>
              <button onClick={() => setSelectedService(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              {/* Info precio */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-emerald-300 font-bold">
                      {selectedService.price_type === "custom_text"
                        ? selectedService.price_text || "Precio a coordinar"
                        : `Precio Base: ${Number(selectedService.base_price).toFixed(2)} Bs.`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Puedes registrar tu pago mediante QR o Transferencia, o enviar la solicitud para coordinar con el equipo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Título del proyecto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  required
                  placeholder="Ej. Sesión fotográfica producto X, Diseño logo marca Y..."
                  className="w-full px-4 py-3 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Descripción / Especificaciones del Proyecto
                </label>
                <textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe con detalle qué necesitas: objetivos, referencias visuales, formato, ubicación, etc."
                  className="w-full px-4 py-3 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Fecha deseada */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Fecha Deseada de Entrega (opcional)
                </label>
                <input
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* ── SECCIÓN DE PAGO (QR / TRANSFERENCIA / COMPROBANTE) ── */}
              <div className="pt-3 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Método de Pago & Comprobante</h4>
                </div>

                {/* Selección Método */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "QR", label: "📱 QR" },
                    { id: "Transferencia", label: "🏦 Transferencia" },
                    { id: "Efectivo", label: "💵 Efectivo" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        payMethod === m.id
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md"
                          : "bg-[#15233D]/40 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Mostrar QR o Banco */}
                {payMethod === "QR" && (
                  <div className="bg-[#07060B]/80 border border-emerald-500/30 rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2">Escanea el código QR para realizar el pago:</p>
                    <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BENCHAMEN_PAGO_SERVICIO"
                        alt="QR Pago Benchamen"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-[#20CDFE] font-bold mt-2">Banco Bisa / Mercantil Santa Cruz — Benchamen SRL</p>
                  </div>
                )}

                {payMethod === "Transferencia" && (
                  <div className="bg-[#07060B]/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5 text-slate-300">
                    <p className="font-bold text-emerald-400">Datos Bancarios para Transferencia:</p>
                    <p>• <strong>Banco:</strong> Banco Bisa S.A.</p>
                    <p>• <strong>Cta. Corriente:</strong> 123456789-01</p>
                    <p>• <strong>Titular:</strong> BENCHAMEN MARKETING S.R.L.</p>
                    <p>• <strong>NIT:</strong> 4829102019</p>
                  </div>
                )}

                {/* Nro Referencia */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nro. de Referencia / Transacción (opcional)
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Ej. REF-84920412"
                    className="w-full px-4 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                {/* Subir comprobante */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Adjuntar Comprobante (Imagen o PDF)</span>
                    {receiptUrl && <span className="text-emerald-400 font-bold">✓ Subido</span>}
                  </label>

                  <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center bg-[#07060B]/40 transition-colors">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptFileChange}
                      disabled={uploadingReceipt}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {uploadingReceipt ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold py-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        Subiendo comprobante...
                      </div>
                    ) : receiptUrl ? (
                      <div className="flex items-center justify-between gap-2 px-2 py-1 bg-emerald-500/10 rounded-xl">
                        <span className="text-xs text-emerald-300 font-bold truncate">Comprobante adjuntado</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setReceiptUrl(""); }}
                          className="text-rose-400 text-xs hover:underline font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs">
                        <Upload size={20} className="text-emerald-400" />
                        <span className="font-bold text-slate-300">Haz clic o arrastra aquí tu comprobante de pago</span>
                        <span className="text-[10px] text-slate-500">Formatos permitidos: JPG, PNG, WEBP, PDF (Máx. 10MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reqTitle.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-extrabold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? "Enviando..." : "Enviar Solicitud con Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Visor Comprobante ── */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A101D] border border-emerald-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                Comprobante de Pago: <span className="text-emerald-300">{previewReceiptTitle}</span>
              </h4>
              <button onClick={() => setPreviewReceiptUrl(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center bg-black/50">
              {previewReceiptUrl.endsWith(".pdf") ? (
                <iframe src={previewReceiptUrl} className="w-full h-[60vh] rounded-xl border border-slate-800" />
              ) : (
                <img src={previewReceiptUrl} alt="Comprobante" className="max-h-[70vh] object-contain rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
