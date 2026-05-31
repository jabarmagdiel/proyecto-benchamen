"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, GitMerge, MoreVertical, Trash, Edit } from "lucide-react";
import { workflowsApi } from "@/lib/api";
import { Workflow } from "@/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadWorkflows = async () => {
    try {
      const res = await workflowsApi.list();
      setWorkflows(res.data);
    } catch (err) {
      showToast("No se pudieron cargar los flujos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await workflowsApi.create({
        name: "Nuevo Flujo de Trabajo",
        description: "Descripción de mi nuevo flujo...",
      });
      showToast("Flujo creado exitosamente.");
      router.push(`/workflows/${res.data.id}`);
    } catch (err) {
      showToast("Error al crear el flujo.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este flujo de trabajo?")) return;
    try {
      await workflowsApi.delete(id);
      showToast("Flujo eliminado.");
      loadWorkflows();
    } catch (err) {
      showToast("No se puede eliminar un flujo en uso.", "error");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando flujos...</div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center bg-[#07060B]/80 p-6 rounded-2xl shadow-sm border border-[#2E455C]/30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Flujos de Trabajo</h1>
          <p className="text-slate-400 mt-1">
            Diseña los procesos automáticos y embudos (pipelines) para los proyectos de tu agencia.
          </p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25">
          <Plus className="h-4 w-4" />
          Crear Flujo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div key={wf.id} className="bg-[#07060B]/80 rounded-2xl p-6 shadow-sm border border-[#2E455C]/30 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => router.push(`/workflows/${wf.id}`)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Editar">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(wf.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                <Trash className="h-4 w-4" />
              </button>
            </div>
            
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
              <GitMerge className="h-5 w-5" />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{wf.name}</h3>
            <p className="text-sm text-slate-400 line-clamp-2 h-10 mb-4">
              {wf.description || "Sin descripción"}
            </p>
            
            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-[#2E455C]/20 pt-4 mt-2">
              <span>{wf.stages?.length || 0} Etapas configuradas</span>
              <span>Creado {format(new Date(wf.created_at), "MMM d, yyyy", { locale: es })}</span>
            </div>
          </div>
        ))}
      </div>
      
      {workflows.length === 0 && (
        <div className="text-center bg-[#07060B]/80 p-12 rounded-2xl border border-[#2E455C]/30 border-dashed">
          <div className="h-12 w-12 bg-[#2E455C]/20 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <GitMerge className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Sin Flujos de Trabajo</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Aún no has creado ningún flujo de trabajo para tu agencia. Los flujos te permiten diseñar los pasos que siguen tus proyectos.
          </p>
          <button onClick={handleCreate} className="px-4 py-2 border border-[#2E455C]/50 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#2E455C]/20 transition-colors">
            Crear mi primer flujo
          </button>
        </div>
      )}
    </div>
  );
}
