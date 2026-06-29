"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Building2, Package, Percent } from "lucide-react";
import { companiesApi, packagesApi } from "@/lib/api";
import type { Company } from "@/types";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contact_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional().default(""),
  address: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.enum(["activo", "inactivo"]).default("activo"),
  dashboard_url: z.string().url("URL inválida").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Cotizador State
  const [quoterOpen, setQuoterOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [companyPackages, setCompanyPackages] = useState<any[]>([]);
  
  // Quote form state
  const [selectedPackageId, setSelectedPackageId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await companiesApi.list({ search });
      setCompanies(r.data);
      const p = await packagesApi.list();
      setCatalog(p.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", contact_name: "", phone: "", email: "", address: "", description: "", dashboard_url: "", status: "activo" });
    setModalOpen(true);
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    reset({ name: c.name, contact_name: c.contact_name || "", phone: c.phone || "", email: c.email || "", address: c.address || "", description: c.description || "", dashboard_url: c.dashboard_url || "", status: c.status });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await companiesApi.update(editing.id, data);
        showToast("Empresa actualizada correctamente");
      } else {
        await companiesApi.create(data);
        showToast("Empresa creada correctamente");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al guardar", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await companiesApi.delete(deleteId);
      showToast("Empresa eliminada");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al eliminar", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // --- Funciones del Cotizador ---
  const openQuoter = async (c: Company) => {
    setSelectedCompany(c);
    setQuoterOpen(true);
    setSelectedPackageId("");
    setQuantity(1);
    setDiscount(0);
    try {
      const r = await packagesApi.getCompanyPackages(c.id);
      setCompanyPackages(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedPackageId || !selectedCompany) return;
    const pkg = catalog.find((p) => p.id === Number(selectedPackageId));
    if (!pkg) return;
    
    const basePrice = pkg.base_price;
    const subtotal = basePrice * quantity;
    const finalPrice = subtotal - (subtotal * (discount / 100));

    try {
      await packagesApi.assignToCompany({
        company_id: selectedCompany.id,
        package_id: pkg.id,
        quantity,
        discount_percentage: discount,
        final_price: finalPrice
      });
      showToast("Paquete asignado y cotizado");
      // Reload company packages
      const r = await packagesApi.getCompanyPackages(selectedCompany.id);
      setCompanyPackages(r.data);
      // Reset form
      setSelectedPackageId("");
      setQuantity(1);
      setDiscount(0);
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al asignar paquete", "error");
    }
  };

  const handleRemovePackage = async (cpId: number) => {
    if (!selectedCompany) return;
    try {
      await packagesApi.removeFromCompany(cpId);
      showToast("Paquete removido");
      const r = await packagesApi.getCompanyPackages(selectedCompany.id);
      setCompanyPackages(r.data);
    } catch (e: any) {
      showToast("Error al remover paquete", "error");
    }
  };

  // Calcular totales
  const totalCotizado = companyPackages.reduce((acc, cp) => acc + Number(cp.final_price), 0);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Empresas / Clientes</h2>
            <p className="text-slate-400 text-sm mt-0.5">{companies.length} empresa{companies.length !== 1 ? "s" : ""} registrada{companies.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#20CDFE]/20">
            <Plus size={16} /> Nueva empresa
          </button>
        </div>

        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-800/50 bg-[#0A101D]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
          />
        </div>

        {/* Tabla */}
        <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay empresas registradas</p>
              <p className="text-sm mt-1">Crea la primera empresa para comenzar</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#15233D] border-b border-slate-800/50">
                <tr>
                  {["Empresa", "Contacto", "Teléfono", "Email", "Proyectos", "Estado", "Creado", "Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#0F192E] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{c.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{c.contact_name || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-300">{c.phone || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-300">{c.email || "-"}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-[#20CDFE]/20 text-[#20CDFE] px-2.5 py-1 rounded-full text-xs font-semibold">{c.project_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === "activo" ? "bg-green-100 text-green-700" : "bg-[#1C2C4D] text-slate-300"}`}>
                        {c.status === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openQuoter(c)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Cotizar / Paquetes">
                          <Package size={14} />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0">
              <h3 className="text-lg font-bold text-white">{editing ? "Editar empresa" : "Nueva empresa"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nombre *</label>
                    <input {...register("name")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Persona de contacto</label>
                    <input {...register("contact_name")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono</label>
                    <input {...register("phone")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Correo</label>
                    <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dirección</label>
                  <input {...register("address")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
                  <textarea {...register("description")} rows={2} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">URL de Dashboard de Rendimiento (Looker Studio, PowerBI, etc.)</label>
                  <input {...register("dashboard_url")} type="url" placeholder="https://lookerstudio.google.com/embed/reporting/..." className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]" />
                  {errors.dashboard_url && <p className="text-red-500 text-xs mt-1">{errors.dashboard_url.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estado</label>
                  <select {...register("status")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE]">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-800/50 bg-[#0F192E] shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-[#15233D] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cotizador */}
      {quoterOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-3xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#20CDFE]/10 rounded-lg text-[#20CDFE]">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cotizador de Paquetes</h3>
                  <p className="text-xs text-slate-400">Cliente: {selectedCompany.name}</p>
                </div>
              </div>
              <button onClick={() => setQuoterOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Formulario de asignación */}
              <div className="lg:w-1/3 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Paquete Base</label>
                  <select 
                    value={selectedPackageId} 
                    onChange={(e) => setSelectedPackageId(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                  >
                    <option value="">Seleccionar paquete...</option>
                    {catalog.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${Number(p.base_price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Descuento (%)</label>
                    <div className="relative">
                      <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={discount} 
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="pl-8 pr-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#15233D] rounded-xl p-4 border border-slate-800/50">
                  <p className="text-xs text-slate-400 mb-1">Precio Final Calculado</p>
                  <p className="text-xl font-bold text-emerald-400">
                    ${(() => {
                      if (!selectedPackageId) return "0.00";
                      const p = catalog.find(x => x.id === Number(selectedPackageId));
                      if (!p) return "0.00";
                      const sub = p.base_price * quantity;
                      return (sub - (sub * (discount / 100))).toFixed(2);
                    })()}
                  </p>
                </div>

                <button 
                  onClick={handleAssignPackage}
                  disabled={!selectedPackageId}
                  className="w-full bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Agregar a la Cotización
                </button>
              </div>

              {/* Lista de paquetes asignados */}
              <div className="lg:w-2/3 bg-[#0A101D]/50 rounded-xl border border-slate-800/50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800/50 bg-[#15233D]">
                  <h4 className="font-semibold text-white text-sm">Paquetes Asignados</h4>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {companyPackages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-sm">Esta empresa no tiene paquetes asignados.</p>
                    </div>
                  ) : (
                    companyPackages.map(cp => (
                      <div key={cp.id} className="flex items-center justify-between bg-[#15233D] p-3 rounded-xl border border-[#20CDFE]/5">
                        <div>
                          <p className="font-bold text-white text-sm">{cp.package?.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cant: {cp.quantity} | Dto: {Number(cp.discount_percentage)}% | 
                            Base: ${Number(cp.package?.base_price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-400">${Number(cp.final_price).toFixed(2)}</span>
                          <button onClick={() => handleRemovePackage(cp.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-slate-800/50 bg-[#15233D] flex justify-between items-center shrink-0">
                  <span className="text-slate-300 font-medium text-sm">Total Cotizado:</span>
                  <span className="text-2xl font-bold text-white">${totalCotizado.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-800/50 shrink-0 flex justify-end">
              <button onClick={() => setQuoterOpen(false)} className="px-6 py-2.5 bg-[#20CDFE] text-[#0A101D] font-bold rounded-xl hover:opacity-90">
                Cerrar Cotizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar empresa?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-[#15233D] transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
