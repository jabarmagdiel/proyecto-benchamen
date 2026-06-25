"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package as PkgIcon, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { packagesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().default(""),
  base_price: z.preprocess((val) => Number(val), z.number().min(0)),
});
type FormData = z.infer<typeof schema>;

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  en_proceso: "En Proceso",
  entregada: "Entregada",
  rechazada: "Rechazada",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-600",
  aceptada: "bg-indigo-100 text-indigo-700",
  en_proceso: "bg-blue-100 text-blue-700",
  entregada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-rose-100 text-rose-700",
};

export default function PaquetesPage() {
  const [tab, setTab] = useState<"catalogo" | "solicitudes">("catalogo");
  const [packages, setPackages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const load = async () => {
    setLoading(true);
    try {
      const p = await packagesApi.list();
      setPackages(p.data);
      const r = await packageRequestsApi.list();
      setRequests(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    reset({ name: p.name, description: p.description || "", base_price: p.base_price });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await packagesApi.update(editing.id, data);
        showToast("Paquete actualizado");
      } else {
        await packagesApi.create(data);
        showToast("Paquete creado");
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
      await packagesApi.delete(deleteId);
      showToast("Paquete eliminado");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await packageRequestsApi.updateStatus(id, { status });
      showToast("Estado actualizado");
      load();
    } catch (e: any) {
      showToast("Error al actualizar", "error");
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Gestión de Paquetes</h2>
            <p className="text-slate-400 text-sm mt-0.5">Catálogo y solicitudes de clientes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#0A101D]/80 border border-slate-800/50 rounded-xl p-1 flex">
              <button 
                onClick={() => setTab("catalogo")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === "catalogo" ? "bg-[#20CDFE]/20 text-[#20CDFE]" : "text-slate-400 hover:text-white"}`}
              >
                Catálogo
              </button>
              <button 
                onClick={() => setTab("solicitudes")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === "solicitudes" ? "bg-[#20CDFE]/20 text-[#20CDFE]" : "text-slate-400 hover:text-white"}`}
              >
                Solicitudes
                {requests.filter(r => r.status === "pendiente").length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                    {requests.filter(r => r.status === "pendiente").length}
                  </span>
                )}
              </button>
            </div>
            
            {tab === "catalogo" && (
              <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20">
                <Plus size={16} /> Nuevo paquete
              </button>
            )}
          </div>
        </div>

        {tab === "catalogo" ? (
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : packages.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <PkgIcon size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay paquetes creados</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Paquete</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Descripción</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Precio Base</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Creado</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/5">
                  {packages.map((p) => (
                    <tr key={p.id} className="hover:bg-[#0F192E] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{p.name}</td>
                      <td className="px-4 py-3.5 text-slate-400 max-w-[200px] truncate">{p.description}</td>
                      <td className="px-4 py-3.5 text-emerald-400 font-semibold">{Number(p.base_price).toFixed(2)} Bs.</td>
                      <td className="px-4 py-3.5 text-slate-400">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE]"><Pencil size={14}/></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-100/10 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <PkgIcon size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay solicitudes de clientes</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Cliente / Empresa</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Paquete</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/5">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#0F192E] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{r.client_user?.name}</div>
                        <div className="text-[10px] text-slate-400">{r.company?.name}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#20CDFE]">{r.package?.name}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <select 
                          value={r.status}
                          onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full outline-none cursor-pointer appearance-none ${STATUS_COLORS[r.status]}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aceptada">Aceptada</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="entregada">Entregada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/proyectos?from_request=${r.id}&company_id=${r.company_id}&name=${encodeURIComponent('Proyecto: ' + (r.package?.name || ''))}`} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
                          Crear Proyecto <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-800/50 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
              <h3 className="text-lg font-bold text-white">{editing ? "Editar paquete" : "Nuevo paquete"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                <input {...register("name")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
                <textarea {...register("description")} rows={3} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Precio Base (Bs.)</label>
                <input type="number" step="0.01" {...register("base_price")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
                {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-[#15233D]">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-[#20CDFE] text-[#07060B] py-2.5 rounded-xl font-bold hover:opacity-90">{submitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 rounded-2xl border border-slate-800/50 w-full max-w-sm p-6 text-center">
            <Trash2 size={40} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar paquete?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-800/50 text-slate-300 hover:bg-[#15233D]">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
