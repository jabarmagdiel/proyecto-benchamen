"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package as PkgIcon } from "lucide-react";
import { packagesApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().default(""),
  base_price: z.preprocess((val) => Number(val), z.number().min(0)),
});
type FormData = z.infer<typeof schema>;

export default function PaquetesPage() {
  const [packages, setPackages] = useState<any[]>([]);
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
      const r = await packagesApi.list();
      setPackages(r.data);
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

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Catálogo de Paquetes</h2>
            <p className="text-slate-400 text-sm mt-0.5">Gestiona los paquetes y precios base</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20">
            <Plus size={16} /> Nuevo paquete
          </button>
        </div>

        <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <PkgIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay paquetes creados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#15233D] border-b border-[#20CDFE]/10">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Paquete</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Descripción</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Precio Base</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Creado</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0F192E] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white">{p.name}</td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-[200px] truncate">{p.description}</td>
                    <td className="px-4 py-3.5 text-emerald-400 font-semibold">${Number(p.base_price).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE]"><Pencil size={14}/></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#20CDFE]/10 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-[#20CDFE]/10">
              <h3 className="text-lg font-bold text-white">{editing ? "Editar paquete" : "Nuevo paquete"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                <input {...register("name")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
                <textarea {...register("description")} rows={3} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Precio Base ($)</label>
                <input type="number" step="0.01" {...register("base_price")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl bg-[#0A101D] text-white focus:ring-2 focus:ring-[#20CDFE]" />
                {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-[#20CDFE]/10 rounded-xl text-slate-300 hover:bg-[#15233D]">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-[#20CDFE] text-[#07060B] py-2.5 rounded-xl font-bold hover:opacity-90">{submitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 rounded-2xl border border-[#20CDFE]/10 w-full max-w-sm p-6 text-center">
            <Trash2 size={40} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar paquete?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[#20CDFE]/10 text-slate-300 hover:bg-[#15233D]">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
