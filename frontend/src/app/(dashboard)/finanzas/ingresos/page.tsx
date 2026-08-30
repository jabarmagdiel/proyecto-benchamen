"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, DollarSign, Plus, Search, Filter, Calendar, Building2,
  FolderKanban, CreditCard, FileText, Trash2, Edit, Eye, Image as ImageIcon,
  ExternalLink, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { financesApi, companiesApi, projectsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { FinancialTransaction, Company, Project } from "@/types";

const INGRESOS_CATEGORIES = [
  { id: "proyecto", label: "Pago por Proyecto" },
  { id: "suscripcion", label: "Suscripción / Paquete" },
  { id: "servicio", label: "Servicio Extra / Adicional" },
  { id: "cobro_cliente", label: "Cobro Directo a Cliente" },
  { id: "otro", label: "Otro Ingreso" },
];

export default function IngresosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [companyFilter, setCompanyFilter] = useState("todas");

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Visor comprobante
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Preview local del archivo seleccionado (antes de subir)
  const [localFilePreview, setLocalFilePreview] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string>("");

  // Form State
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "proyecto",
    payment_method: "transferencia",
    payment_reference: "",
    receipt_url: "",
    receipt_drive_url: "",
    transaction_date: new Date().toISOString().slice(0, 10),
    company_id: "",
    project_id: "",
    description: "",
  });

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [transRes, compRes, projRes] = await Promise.all([
        financesApi.list({ type: "ingreso" }).catch((e) => {
          console.error("Error cargando transacciones:", e);
          return { data: [] };
        }),
        companiesApi.list().catch((e) => {
          console.error("Error cargando empresas:", e);
          return { data: [] };
        }),
        projectsApi.list().catch((e) => {
          console.error("Error cargando proyectos:", e);
          return { data: [] };
        }),
      ]);
      setTransactions(transRes.data || []);
      setCompanies(compRes.data || []);
      setProjects(projRes.data || []);
    } catch (e) {
      console.error("Error al cargar ingresos:", e);
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

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      title: "",
      amount: "",
      category: "proyecto",
      payment_method: "transferencia",
      payment_reference: "",
      receipt_url: "",
      receipt_drive_url: "",
      transaction_date: new Date().toISOString().slice(0, 10),
      company_id: "",
      project_id: "",
      description: "",
    });
    setLocalFilePreview(null);
    setLocalFileName("");
    setModalOpen(true);
  };

  const openEditModal = (t: FinancialTransaction) => {
    setEditingItem(t);
    setForm({
      title: t.title,
      amount: String(t.amount),
      category: t.category,
      payment_method: t.payment_method || "transferencia",
      payment_reference: t.payment_reference || "",
      receipt_url: t.receipt_url || "",
      receipt_drive_url: t.receipt_drive_url || "",
      transaction_date: t.transaction_date,
      company_id: t.company_id ? String(t.company_id) : "",
      project_id: t.project_id ? String(t.project_id) : "",
      description: t.description || "",
    });
    setLocalFilePreview(null);
    setLocalFileName("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      showToast("Por favor ingresa un título válido y un monto mayor a 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: "ingreso",
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || null,
        receipt_url: form.receipt_url || null,
        receipt_drive_url: form.receipt_drive_url || null,
        transaction_date: form.transaction_date,
        description: form.description || null,
        company_id: form.company_id ? Number(form.company_id) : null,
        project_id: form.project_id ? Number(form.project_id) : null,
      };

      if (editingItem) {
        await financesApi.update(editingItem.id, payload);
        showToast("✅ Ingreso actualizado correctamente");
      } else {
        await financesApi.create(payload);
        showToast("✅ Nuevo ingreso registrado correctamente");
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al guardar el ingreso", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este registro de ingreso?")) return;
    try {
      await financesApi.delete(id);
      showToast("Ingreso eliminado");
      loadData();
    } catch (e) {
      showToast("Error al eliminar", "error");
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
          El módulo de gestión de Ingresos está disponible únicamente para Administradores.
        </p>
        <Link href="/dashboard" className="mt-6 px-5 py-2.5 bg-[#20CDFE] text-[#07060B] font-bold text-xs rounded-xl">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  /* Filtrado de la tabla */
  const filteredTransactions = transactions.filter((t) => {
    const matchesCategory = categoryFilter === "todos" ? true : t.category === categoryFilter;
    const matchesCompany = companyFilter === "todas" ? true : String(t.company_id) === companyFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.title.toLowerCase().includes(query) ||
      (t.payment_reference || "").toLowerCase().includes(query) ||
      (t.company?.name || "").toLowerCase().includes(query);

    return matchesCategory && matchesCompany && matchesSearch;
  });

  const totalIngresos = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  // File Upload State
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Construir URL completa para visualizar comprobante
  const buildReceiptUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
    return url; // Cloudinary o externo → ya es URL completa
  };

  // Detectar si es una imagen que podemos mostrar inline
  const isImageUrl = (url: string) => {
    const clean = url.split("?")[0].split("#")[0].toLowerCase();
    return /\.(png|jpg|jpeg|webp|gif|bmp|avif|heic)$/.test(clean)
      || clean.includes("res.cloudinary.com"); // Cloudinary siempre imagen
  };

  // Detectar PDF
  const isPdfUrl = (url: string) => /\.pdf($|\?)/i.test(url);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local inmediato
    setLocalFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setLocalFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLocalFilePreview(null);
    }

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await financesApi.uploadReceipt(formData);
      setForm((prev) => ({ ...prev, receipt_url: res.data.url }));
      showToast("✅ Comprobante subido y listo para guardar");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Error al subir archivo de comprobante";
      showToast(`❌ ${msg}`, "error");
      setLocalFilePreview(null);
      setLocalFileName("");
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold animate-bounce ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header con breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/finanzas" className="inline-flex items-center gap-1.5 text-xs text-[#20CDFE] font-bold hover:underline mb-1">
              <ArrowLeft size={14} /> Volver a Finanzas Consolidadas
            </Link>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ArrowUpRight className="text-emerald-400" size={26} />
              Gestión de Ingresos (Cobros & Entradas)
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Registro centralizado de cobros por proyectos, servicios extra y pagos de clientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => financesApi.exportExcel({ type: "ingreso" })}
              className="bg-[#15233D] border border-slate-800 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <ExternalLink size={15} className="text-emerald-400" /> Exportar Informe Excel
            </button>

            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Registrar Nuevo Ingreso
            </button>
          </div>
        </div>

        {/* METRICAS DE INGRESOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL INGRESOS MANUALES</span>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {totalIngresos.toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{transactions.length} transacción(es) registrada(s)</p>
          </div>

          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PROMEDIO POR INGRESO</span>
            <div className="text-2xl font-black text-white mt-2">
              {(transactions.length > 0 ? totalIngresos / transactions.length : 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">Bs.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ticket promedio de entrada</p>
          </div>

          <div className="bg-gradient-to-br from-[#0A101D] to-[#15233D] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CATEGORÍA PRINCIPAL</span>
            <div className="text-xl font-bold text-[#20CDFE] mt-2 capitalize">
              Pago por Proyecto
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mayor frecuencia de entrada</p>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="bg-[#0A101D]/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setCategoryFilter("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                categoryFilter === "todos" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-[#15233D]/50 text-slate-400 border-slate-800"
              }`}
            >
              Todas las Categorías
            </button>
            {INGRESOS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  categoryFilter === cat.id ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-[#15233D]/50 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto o ref..."
              className="w-full pl-10 pr-4 py-2 bg-[#15233D]/60 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* TABLA DE INGRESOS */}
        <div className="bg-[#0A101D]/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#2E455C] border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30 text-emerald-400" />
              <p className="font-bold text-white text-base">No hay ingresos registrados con este filtro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Concepto / Título</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Monto (Bs.)</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Categoría</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Método & Ref</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Comprobante</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Fecha</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Empresa / Proyecto</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-bold text-xs uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-[#15233D]/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white text-sm">{t.title}</td>
                      <td className="px-5 py-4 font-black text-emerald-400 text-sm">
                        +{Number(t.amount).toFixed(2)} Bs.
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-bold capitalize">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-white capitalize">{t.payment_method || "transferencia"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Ref: {t.payment_reference || "N/A"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          {t.receipt_url && (
                            <button
                              onClick={() => setPreviewReceiptUrl(t.receipt_url || null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold text-xs"
                            >
                              <ImageIcon size={13} /> Ver Adjunto
                            </button>
                          )}
                          {t.receipt_drive_url && (
                            <a
                              href={t.receipt_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all font-bold text-xs"
                            >
                              <ExternalLink size={13} /> Ver Drive
                            </a>
                          )}
                          {!t.receipt_url && !t.receipt_drive_url && (
                            <span className="text-xs text-slate-500 italic">Sin comprobante</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{formatDate(t.transaction_date)}</td>
                      <td className="px-5 py-4 text-xs text-slate-300">
                        {t.company?.name || t.project?.name || "General / Agencia"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR INGRESO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="text-emerald-400" size={20} />
                {editingItem ? "Editar Registro de Ingreso" : "Registrar Nuevo Ingreso"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título / Concepto del Ingreso *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej. Cobro por desarrollo web Alfa Luxor"
                  className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Monto (Bs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INGRESOS_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Método de Pago</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="qr_fortaleza">QR Banco Fortaleza</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha del Ingreso</label>
                  <input
                    type="date"
                    required
                    value={form.transaction_date}
                    onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nro de Referencia / Comprobante</label>
                <input
                  type="text"
                  value={form.payment_reference}
                  onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                  placeholder="Ej. REF-8849204"
                  className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Comprobante / Recibo Adjunto
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploadingReceipt}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 cursor-pointer bg-[#15233D]/60 border border-slate-800 rounded-xl py-2 px-3"
                  />
                  {uploadingReceipt && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      Subiendo imagen...
                    </div>
                  )}
                  {/* Preview de imagen local */}
                  {localFilePreview && !uploadingReceipt && (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={localFilePreview} alt="Preview" className="w-full max-h-40 object-contain" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 text-[11px] text-emerald-400 font-bold truncate">
                        ✅ {localFileName}
                      </div>
                    </div>
                  )}
                  {/* Si ya tiene URL guardada (edición) y no hay preview local */}
                  {form.receipt_url && !localFilePreview && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <ImageIcon size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-emerald-300 truncate flex-1">Adjunto guardado</span>
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptUrl(form.receipt_url)}
                        className="text-[11px] text-emerald-400 font-bold hover:underline shrink-0"
                      >
                        Ver
                      </button>
                    </div>
                  )}

                  {/* Link externo — campo INDEPENDIENTE, puede coexistir con el archivo */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">+ también link externo</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <div className="relative">
                    <ExternalLink size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="url"
                      value={form.receipt_drive_url}
                      onChange={(e) => setForm({ ...form, receipt_drive_url: e.target.value })}
                      placeholder="Link de Google Drive, Dropbox u otro..."
                      disabled={uploadingReceipt}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#15233D]/60 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                  {form.receipt_drive_url && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <ExternalLink size={12} className="text-blue-400 shrink-0" />
                      <span className="text-[11px] text-blue-300 truncate flex-1">Link guardado</span>
                      <a
                        href={form.receipt_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 font-bold hover:underline shrink-0"
                      >
                        Abrir
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Empresa (Opcional)</label>
                  <select
                    value={form.company_id}
                    onChange={(e) => {
                      const newCompId = e.target.value;
                      setForm(prev => ({ ...prev, company_id: newCompId }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Sin empresa vinculada</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Proyecto (Opcional)</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm(prev => ({ ...prev, project_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Sin proyecto vinculado</option>
                    {(form.company_id ? projects.filter(p => p.company_id === Number(form.company_id)) : projects).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.company?.name || "Cliente Externo"})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingReceipt}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold hover:opacity-90 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingItem ? "Guardar Cambios" : "Registrar Ingreso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISOR INTELIGENTE DE COMPROBANTE */}
      {previewReceiptUrl && (() => {
        const rawUrl = previewReceiptUrl;
        const API_BASE_VIEWER = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const fullUrl = rawUrl.startsWith("/uploads/") ? `${API_BASE_VIEWER}${rawUrl}` : rawUrl;
        // Detección: imagen si tiene extensión imagen O es de Cloudinary
        const cleanPath = rawUrl.split("?")[0].split("#")[0].toLowerCase();
        const isImg = /\.(png|jpg|jpeg|webp|gif|bmp|avif|heic)$/.test(cleanPath)
          || cleanPath.includes("res.cloudinary.com");
        const isPDF = /\.pdf$/.test(cleanPath);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setPreviewReceiptUrl(null)}>
            <div className="bg-[#0A101D] border border-emerald-500/40 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <ImageIcon className="text-emerald-400" size={18} /> Comprobante de Ingreso
                </h4>
                <div className="flex items-center gap-3">
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all">
                    <ExternalLink size={13} /> Abrir original
                  </a>
                  <button onClick={() => setPreviewReceiptUrl(null)} className="p-2 text-slate-400 hover:text-white">✕</button>
                </div>
              </div>
              <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-[#07060B] min-h-[300px]">
                {isImg ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={fullUrl}
                    alt="Comprobante"
                    className="max-h-[68vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-700"
                    onError={(e) => {
                      // Si falla la imagen, mostrar botón de apertura
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `
                        <div class="text-center space-y-4">
                          <p class="text-white font-bold text-sm">No se pudo cargar la imagen</p>
                          <a href="${fullUrl}" target="_blank" rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl">
                            Abrir en nueva pestaña
                          </a>
                        </div>`;
                    }}
                  />
                ) : isPDF ? (
                  <iframe src={fullUrl} className="w-full h-[68vh] rounded-xl border border-slate-700" title="Comprobante PDF" />
                ) : (
                  <div className="text-center py-10 space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <FileText size={32} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">Enlace Externo</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto break-all font-mono">{rawUrl}</p>
                    </div>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
                    >
                      <ExternalLink size={16} /> Abrir en Pestaña Nueva
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
