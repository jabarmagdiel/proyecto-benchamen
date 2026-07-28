"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Package as PkgIcon, CheckCircle2, Clock, XCircle, ArrowRight,
  Eye, EyeOff, Video, Camera, Image as ImageIcon, Layout, Megaphone, CreditCard,
  Send, ShieldCheck, Calendar, Sparkles, RefreshCw
} from "lucide-react";
import { packagesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ServicePackage, PackageRequest, CompanyPackage } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().default(""),
  base_price: z.preprocess((val) => Number(val), z.number().min(0)),
  is_active: z.boolean().default(true),
  videos_count: z.preprocess((val) => Number(val || 0), z.number().min(0)),
  drone_count: z.preprocess((val) => Number(val || 0), z.number().min(0)),
  arts_count: z.preprocess((val) => Number(val || 0), z.number().min(0)),
  template_arts_count: z.preprocess((val) => Number(val || 0), z.number().min(0)),
  ad_management: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente_verificacion: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  pago_verificado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rechazado: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const DELIVERABLE_LABELS: Record<string, { label: string; icon: any }> = {
  video: { label: "Edición de Video", icon: Video },
  drone: { label: "Filmación con Dron", icon: Camera },
  art: { label: "Arte / Diseño Gráfico", icon: ImageIcon },
  template_art: { label: "Arte de Plantilla", icon: Layout },
  ad: { label: "Gestión de Publicidad", icon: Megaphone },
};

export default function PaquetesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";
  const isClient = user?.role === "cliente";

  const [tab, setTab] = useState<"catalogo" | "pagos" | "trabajos">("catalogo");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [mySubscription, setMySubscription] = useState<CompanyPackage | null>(null);
  const [loading, setLoading] = useState(true);

  /* Modal de Crear / Editar Paquete */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* Modal de Registro de Pago (Cliente) */
  const [subscribeModalPkg, setSubscribeModalPkg] = useState<ServicePackage | null>(null);
  const [payMethod, setPayMethod] = useState("QR");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  /* Modal de Solicitar Trabajo (Cliente) */
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [workDeliverable, setWorkDeliverable] = useState("video");
  const [workQty, setWorkQty] = useState(1);
  const [workTitle, setWorkTitle] = useState("");
  const [workNotes, setWorkNotes] = useState("");

  /* Modal Verificar Pago (Admin) */
  const [verifyModalReq, setVerifyModalReq] = useState<PackageRequest | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const load = async () => {
    setLoading(true);
    try {
      const p = await packagesApi.list();
      setPackages(p.data);
      const r = await packageRequestsApi.list();
      setRequests(r.data);

      if (user?.company_id) {
        const subRes = await packagesApi.getCompanyPackages(user.company_id);
        const activeSub = subRes.data.find((s: CompanyPackage) => s.status === "activo") || subRes.data[0] || null;
        setMySubscription(activeSub);
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Acciones de Paquete */
  const openCreate = () => {
    setEditing(null);
    reset({
      name: "",
      description: "",
      base_price: 0,
      is_active: true,
      videos_count: 0,
      drone_count: 0,
      arts_count: 0,
      template_arts_count: 0,
      ad_management: false,
    });
    setModalOpen(true);
  };

  const openEdit = (p: ServicePackage) => {
    setEditing(p);
    reset({
      name: p.name,
      description: p.description || "",
      base_price: p.base_price,
      is_active: p.is_active,
      videos_count: p.videos_count || 0,
      drone_count: p.drone_count || 0,
      arts_count: p.arts_count || 0,
      template_arts_count: p.template_arts_count || 0,
      ad_management: p.ad_management || false,
    });
    setModalOpen(true);
  };

  const onSubmitPackage = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await packagesApi.update(editing.id, data);
        showToast("Paquete actualizado correctamente");
      } else {
        await packagesApi.create(data);
        showToast("Paquete creado con éxito");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al guardar el paquete", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (pkg: ServicePackage) => {
    try {
      await packagesApi.toggleVisibility(pkg.id);
      showToast(pkg.is_active ? "Paquete ocultado del catálogo" : "Paquete visible en el catálogo");
      load();
    } catch (e: any) {
      showToast("Error al cambiar visibilidad", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await packagesApi.delete(deleteId);
      showToast("Paquete eliminado");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al eliminar", "error");
    } finally {
      setDeleteId(null);
    }
  };

  /* Enviar Solicitud de Pago / Suscripción (Cliente) */
  const handleSubscribeSubmit = async () => {
    if (!subscribeModalPkg || !user?.company_id) return;
    setSubmitting(true);
    try {
      await packageRequestsApi.create({
        company_id: user.company_id,
        package_id: subscribeModalPkg.id,
        request_type: "subscription_payment",
        payment_method: payMethod,
        payment_reference: payRef,
        notes: payNotes,
      });
      showToast("🎉 Pago registrado. En espera de verificación por el administrador.");
      setSubscribeModalPkg(null);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al registrar el pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* Enviar Solicitud de Trabajo / Entregable (Cliente) */
  const handleWorkRequestSubmit = async () => {
    if (!mySubscription || !user?.company_id) return;
    setSubmitting(true);
    try {
      await packageRequestsApi.create({
        company_id: user.company_id,
        package_id: mySubscription.package_id,
        request_type: "work_request",
        deliverable_type: workDeliverable,
        quantity_requested: workQty,
        title: workTitle || `Solicitud de ${DELIVERABLE_LABELS[workDeliverable]?.label}`,
        notes: workNotes,
      });
      showToast("✅ Solicitud de trabajo enviada a revisión.");
      setWorkModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al enviar la solicitud de trabajo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* Verificar Pago (Admin) */
  const handleVerifyPayment = async (status: "pago_verificado" | "rechazado") => {
    if (!verifyModalReq) return;
    setSubmitting(true);
    try {
      await packageRequestsApi.verifyPayment(verifyModalReq.id, { payment_status: status });
      showToast(status === "pago_verificado" ? "✅ Pago verificado y suscripción activada" : "❌ Pago rechazado");
      setVerifyModalReq(null);
      load();
    } catch (e: any) {
      showToast("Error al verificar el pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* Aprobar / Rechazar Solicitud de Trabajo (Admin) */
  const handleWorkAction = async (id: number, action: "approve" | "reject") => {
    try {
      await packageRequestsApi.workAction(id, { action });
      showToast(action === "approve" ? "✅ Trabajo aprobado y cupo descontado" : "Solicitud rechazada");
      load();
    } catch (e: any) {
      showToast("Error al procesar la solicitud de trabajo", "error");
    }
  };

  const paymentRequests = requests.filter(r => r.request_type === "subscription_payment");
  const workRequests = requests.filter(r => r.request_type === "work_request");

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold animate-bounce ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in pb-10">
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-[#20CDFE]" size={24} />
              Gestión de Paquetes y Suscripciones Mensuales
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Catálogo de servicios, pagos mensualizados y solicitudes de entregables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0A101D]/80 border border-slate-800/80 rounded-xl p-1 flex shadow-lg">
              <button
                onClick={() => setTab("catalogo")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "catalogo" ? "bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30" : "text-slate-400 hover:text-white"}`}
              >
                Catálogo de Paquetes
              </button>

              <button
                onClick={() => setTab("pagos")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${tab === "pagos" ? "bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30" : "text-slate-400 hover:text-white"}`}
              >
                Verificación de Pagos
                {paymentRequests.filter(r => r.payment_status === "pendiente_verificacion").length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse">
                    {paymentRequests.filter(r => r.payment_status === "pendiente_verificacion").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTab("trabajos")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${tab === "trabajos" ? "bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30" : "text-slate-400 hover:text-white"}`}
              >
                Solicitudes de Trabajo
                {workRequests.filter(r => r.status === "pendiente").length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#20CDFE] text-black text-[10px] font-black">
                    {workRequests.filter(r => r.status === "pendiente").length}
                  </span>
                )}
              </button>
            </div>

            {isAdmin && tab === "catalogo" && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#20CDFE]/20"
              >
                <Plus size={18} /> Nuevo Paquete
              </button>
            )}
          </div>
        </div>

        {/* Banner Mi Suscripción Activa (Solo Visible para Clientes) */}
        {isClient && (
          <div className="bg-gradient-to-br from-[#15233D] to-[#0A101D] border border-[#20CDFE]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#20CDFE]/10 rounded-full blur-3xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#20CDFE] mb-1">
                  <ShieldCheck size={16} /> Estado de Suscripción Actual
                </div>
                <h3 className="text-xl font-bold text-white">
                  {mySubscription?.package?.name || "Sin Suscripción Activa"}
                </h3>
                {mySubscription?.end_date && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={13} className="text-amber-400" />
                    Válido hasta: <span className="text-white font-medium">{formatDate(mySubscription.end_date)}</span>
                  </p>
                )}
              </div>

              {mySubscription ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-[#0A101D]/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Video size={12} className="text-[#20CDFE]" /> Videos
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {mySubscription.videos_remaining} rest.
                    </div>
                  </div>

                  <div className="bg-[#0A101D]/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Camera size={12} className="text-indigo-400" /> Dron
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {mySubscription.drone_remaining} rest.
                    </div>
                  </div>

                  <div className="bg-[#0A101D]/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <ImageIcon size={12} className="text-purple-400" /> Artes
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {mySubscription.arts_remaining} rest.
                    </div>
                  </div>

                  <button
                    onClick={() => setWorkModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-3 rounded-xl text-xs font-black hover:scale-105 transition-all shadow-lg shadow-[#20CDFE]/20 ml-2"
                  >
                    <Send size={15} /> Solicitar Entregable / Trabajo
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Selecciona uno de los paquetes disponibles del catálogo para suscribirte.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 1: CATÁLOGO DE PAQUETES ── */}
        {tab === "catalogo" && (
          <div className="grid grid-[#0A101D] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400 bg-[#0A101D]/50 border border-slate-800/50 rounded-2xl">
                <PkgIcon size={48} className="mx-auto mb-3 opacity-30 text-[#20CDFE]" />
                <p className="font-bold text-white text-base">No hay paquetes disponibles en el catálogo</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-xl relative overflow-hidden group ${
                    !pkg.is_active ? "border-slate-800 opacity-60" : "border-slate-800/80 hover:border-[#20CDFE]/50 hover:shadow-2xl hover:shadow-[#20CDFE]/10"
                  }`}
                >
                  <div>
                    {/* Header Tarjeta */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#20CDFE] transition-colors">
                          {pkg.name}
                        </h3>
                        <div className="text-xl font-black text-[#20CDFE] mt-1">
                          {Number(pkg.base_price).toFixed(2)} <span className="text-xs font-semibold text-slate-400">Bs. / mes</span>
                        </div>
                      </div>

                      {isAdmin ? (
                        <button
                          onClick={() => handleToggleVisibility(pkg)}
                          title={pkg.is_active ? "Visible para clientes (Clic para Ocultar)" : "Oculto para clientes (Clic para Mostrar)"}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            pkg.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {pkg.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                          <span>{pkg.is_active ? "Visible" : "Oculto"}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#20CDFE]/10 text-[#20CDFE] border border-[#20CDFE]/30 uppercase tracking-wider">
                          Mensual
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 text-xs line-clamp-3 mb-5 leading-relaxed">
                      {pkg.description || "Sin descripción disponible."}
                    </p>

                    {/* Desglose de Contenidos Mensuales */}
                    <div className="space-y-2 py-3 border-t border-b border-slate-800/60 mb-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Contenido Mensual Incluido:
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 bg-[#15233D]/60 px-3 py-2 rounded-xl text-slate-300">
                          <Video size={14} className="text-[#20CDFE]" />
                          <span><strong className="text-white">{pkg.videos_count || 0}</strong> Videos</span>
                        </div>

                        <div className="flex items-center gap-2 bg-[#15233D]/60 px-3 py-2 rounded-xl text-slate-300">
                          <Camera size={14} className="text-indigo-400" />
                          <span><strong className="text-white">{pkg.drone_count || 0}</strong> Dron</span>
                        </div>

                        <div className="flex items-center gap-2 bg-[#15233D]/60 px-3 py-2 rounded-xl text-slate-300">
                          <ImageIcon size={14} className="text-purple-400" />
                          <span><strong className="text-white">{pkg.arts_count || 0}</strong> Artes</span>
                        </div>

                        <div className="flex items-center gap-2 bg-[#15233D]/60 px-3 py-2 rounded-xl text-slate-300">
                          <Layout size={14} className="text-amber-400" />
                          <span><strong className="text-white">{pkg.template_arts_count || 0}</strong> Plantillas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#15233D]/60 px-3 py-2 rounded-xl text-xs text-slate-300 mt-2">
                        <Megaphone size={14} className={pkg.ad_management ? "text-emerald-400" : "text-slate-500"} />
                        <span>Gestión Publicitaria: <strong className={pkg.ad_management ? "text-emerald-400" : "text-slate-500"}>{pkg.ad_management ? "Incluida" : "No Incluida"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {isAdmin ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => openEdit(pkg)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#15233D] hover:bg-[#20CDFE]/20 hover:text-[#20CDFE] text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700/50"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => setDeleteId(pkg.id)}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubscribeModalPkg(pkg)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-3 rounded-xl text-xs font-extrabold hover:opacity-95 shadow-lg shadow-[#20CDFE]/20 transition-all"
                      >
                        <CreditCard size={15} /> Suscribirme / Registrar Pago
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB 2: VERIFICACIÓN DE PAGOS ── */}
        {tab === "pagos" && (
          <div className="bg-[#0A101D]/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : paymentRequests.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <CreditCard size={48} className="mx-auto mb-3 opacity-30 text-[#20CDFE]" />
                <p className="font-bold text-white text-base">No hay pagos pendientes de verificación</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Cliente / Empresa</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Paquete Suscrito</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Método y Ref.</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Fecha</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Estado Pago</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paymentRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#15233D]/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{r.client_user?.name || "Cliente"}</div>
                        <div className="text-xs text-[#20CDFE] font-medium">{r.company?.name || "Empresa"}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{r.package?.name}</div>
                        <div className="text-xs text-emerald-400 font-semibold">{Number(r.package?.base_price || 0).toFixed(2)} Bs. / mes</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-slate-200">{r.payment_method || "QR / Transferencia"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Ref: {r.payment_reference || "S/N"}</div>
                      </td>

                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {formatDate(r.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${PAYMENT_STATUS_COLORS[r.payment_status] || "bg-slate-800 text-slate-300 border-slate-700"}`}>
                          {r.payment_status === "pendiente_verificacion" && "⏳ Pendiente"}
                          {r.payment_status === "pago_verificado" && "✅ Pago Verificado"}
                          {r.payment_status === "rechazado" && "❌ Rechazado"}
                        </span>
                      </td>

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
            )}
          </div>
        )}

        {/* ── TAB 3: SOLICITUDES DE TRABAJO ── */}
        {tab === "trabajos" && (
          <div className="bg-[#0A101D]/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : workRequests.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Send size={48} className="mx-auto mb-3 opacity-30 text-[#20CDFE]" />
                <p className="font-bold text-white text-base">No hay solicitudes de trabajo recibidas</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Cliente / Empresa</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Tipo de Entregable</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Título y Notas</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Estado</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {workRequests.map((r) => {
                    const iconConfig = DELIVERABLE_LABELS[r.deliverable_type || "video"] || DELIVERABLE_LABELS.video;
                    const IconComp = iconConfig.icon;
                    return (
                      <tr key={r.id} className="hover:bg-[#15233D]/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white">{r.client_user?.name || "Cliente"}</div>
                          <div className="text-xs text-[#20CDFE] font-medium">{r.company?.name || "Empresa"}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#15233D] px-3 py-1.5 rounded-xl border border-slate-700/50 w-fit">
                            <IconComp size={15} className="text-[#20CDFE]" />
                            <span>{iconConfig.label}</span>
                            <span className="text-[10px] bg-[#20CDFE]/20 text-[#20CDFE] px-1.5 py-0.5 rounded-md font-mono">
                              x{r.quantity_requested || 1}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-bold text-white text-xs truncate">{r.title || "Solicitud de trabajo"}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{r.notes || "Sin notas adicionadas"}</div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.status === "pendiente" ? "bg-amber-500/20 text-amber-300" :
                            r.status === "aceptada" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isAdmin && r.status === "pendiente" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleWorkAction(r.id, "approve")}
                                className="bg-emerald-500 text-black font-extrabold px-3 py-1 rounded-xl text-xs hover:opacity-90"
                              >
                                Aprobar (-1 Cupo)
                              </button>
                              <button
                                onClick={() => handleWorkAction(r.id, "reject")}
                                className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl text-xs hover:bg-rose-500/30"
                              >
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">Procesado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR PAQUETE (Siguiendo el dibujo del usuario) ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#15233D]/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#20CDFE]" />
                {editing ? "Editar Paquete" : "Nuevo Paquete de Servicio"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmitPackage)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">NOMBRE</label>
                <input
                  {...register("name")}
                  placeholder="Ej. Paquete Estándar - Alfa Bolivia"
                  className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-[#15233D]/60 text-white focus:ring-2 focus:ring-[#20CDFE] text-sm"
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">DESCRIPCIÓN</label>
                <textarea
                  {...register("description")}
                  rows={2}
                  placeholder="Descripción concisa de lo que ofrece el paquete..."
                  className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-[#15233D]/60 text-white focus:ring-2 focus:ring-[#20CDFE] text-sm"
                />
              </div>

              {/* SECCIÓN CONTENIDO (DIBUJO DEL USUARIO: Video, Artes, Dron, etc conselector de Cantidad) */}
              <div className="bg-[#15233D]/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-black text-[#20CDFE] uppercase tracking-wider flex items-center gap-1.5">
                  <Layout size={14} /> CONTENIDO MENSUAL DEL PAQUETE
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Video size={13} className="text-[#20CDFE]" /> Videos (Cantidad)
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register("videos_count")}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Camera size={13} className="text-indigo-400" /> Filmaciones Dron
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register("drone_count")}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <ImageIcon size={13} className="text-purple-400" /> Cantidad de Artes
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register("arts_count")}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Layout size={13} className="text-amber-400" /> Artes de Plantilla
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register("template_arts_count")}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <Megaphone size={14} className="text-emerald-400" /> ¿Incluye Gestión de Publicidad?
                  </label>
                  <input
                    type="checkbox"
                    {...register("ad_management")}
                    className="w-4 h-4 accent-[#20CDFE] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">PRECIO BASE (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("base_price")}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-[#15233D]/60 text-[#20CDFE] font-bold focus:ring-2 focus:ring-[#20CDFE] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">VISIBILIDAD</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="is_active_cb"
                      {...register("is_active")}
                      className="w-4 h-4 accent-[#20CDFE] rounded cursor-pointer"
                    />
                    <label htmlFor="is_active_cb" className="text-xs font-bold text-slate-200 cursor-pointer">
                      {watch("is_active") ? "Visible a Clientes" : "Oculto en Catálogo"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-slate-800 rounded-xl text-slate-300 font-bold text-xs hover:bg-[#15233D]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-3 rounded-xl font-extrabold text-xs hover:opacity-90"
                >
                  {submitting ? "Guardando..." : "Guardar Paquete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL SUSCRIPCIÓN / REGISTRAR PAGO (Cliente) ── */}
      {subscribeModalPkg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="text-[#20CDFE]" /> Suscripción a {subscribeModalPkg.name}
            </h3>
            <p className="text-xs text-slate-400">
              Monto a transferir / pagar: <strong className="text-[#20CDFE]">{Number(subscribeModalPkg.base_price).toFixed(2)} Bs. / mes</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs font-bold"
                >
                  <option value="QR">Transferencia QR</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Pago en Efectivo / Oficina</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Número de Referencia / Comprobante</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Ej. Nro de Transacción #98412"
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas del Pago (Opcional)</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre la transferencia..."
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSubscribeModalPkg(null)} className="flex-1 py-2.5 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold">
                Cancelar
              </button>
              <button
                onClick={handleSubscribeSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-2.5 rounded-xl font-extrabold text-xs"
              >
                {submitting ? "Registrando..." : "Confirmar y Enviar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SOLICITAR TRABAJO (Cliente) ── */}
      {workModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="text-[#20CDFE]" /> Solicitar Entregable / Trabajo
            </h3>
            <p className="text-xs text-slate-400">
              Usa los cupos incluidos en tu paquete suscrito para enviar una solicitud de trabajo.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Entregable</label>
                <select
                  value={workDeliverable}
                  onChange={(e) => setWorkDeliverable(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs font-bold"
                >
                  <option value="video">Edición de Video (Disponibles: {mySubscription?.videos_remaining || 0})</option>
                  <option value="drone">Filmación con Dron (Disponibles: {mySubscription?.drone_remaining || 0})</option>
                  <option value="art">Arte / Diseño Gráfico (Disponibles: {mySubscription?.arts_remaining || 0})</option>
                  <option value="template_art">Arte de Plantilla (Disponibles: {mySubscription?.template_arts_remaining || 0})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cantidad a Solicitar</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={workQty}
                  onChange={(e) => setWorkQty(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título / Nombre del Trabajo</label>
                <input
                  type="text"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="Ej. Video promocional de Campaña de Agosto"
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Instrucciones o Notas</label>
                <textarea
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  rows={2}
                  placeholder="Describa el requerimiento para el equipo..."
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-xl bg-[#15233D] text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setWorkModalOpen(false)} className="flex-1 py-2.5 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold">
                Cancelar
              </button>
              <button
                onClick={handleWorkRequestSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-2.5 rounded-xl font-extrabold text-xs"
              >
                {submitting ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VERIFICAR PAGO (Admin) ── */}
      {verifyModalReq && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in text-center">
            <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-white">¿Verificar Pago del Cliente?</h3>
            <p className="text-xs text-slate-300">
              Cliente: <strong className="text-white">{verifyModalReq.client_user?.name}</strong> (<span className="text-[#20CDFE]">{verifyModalReq.company?.name}</span>)<br />
              Paquete: <strong className="text-emerald-400">{verifyModalReq.package?.name}</strong> ({Number(verifyModalReq.package?.base_price || 0).toFixed(2)} Bs.)<br />
              Ref: <span className="font-mono text-slate-300">{verifyModalReq.payment_reference || "N/A"}</span>
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

      {/* ── MODAL BORRAR PAQUETE ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
            <Trash2 size={40} className="mx-auto text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar Paquete?</h3>
            <p className="text-slate-400 text-xs mb-5">Esta acción es irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl text-xs font-extrabold hover:bg-rose-600">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
