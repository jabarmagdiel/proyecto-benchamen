"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, FolderKanban, ChevronRight } from "lucide-react";
import { projectsApi, companiesApi, usersApi, workflowsApi } from "@/lib/api";
import type { Project, Company, User, ProjectStatus, Priority, Workflow } from "@/types";
import { formatDate } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  company_id: z.coerce.number().min(1, "Empresa requerida"),
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["planificado", "en_proceso", "en_pausa", "finalizado", "cancelado"]).default("planificado"),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  main_responsible_id: z.coerce.number().optional().nullable(),
  workflow_id: z.coerce.number().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planificado: "bg-[#2E455C]/30 text-slate-300",
  en_proceso:  "bg-[#20CDFE]/20 text-[#20CDFE]",
  en_pausa:    "bg-amber-100 text-amber-700",
  finalizado:  "bg-green-100 text-green-700",
  cancelado:   "bg-red-100 text-red-700",
};

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCompany) params.company_id = filterCompany;
      const [projRes, compRes, usrRes, wfRes] = await Promise.all([
        projectsApi.list(params),
        companiesApi.list(),
        usersApi.list(),
        workflowsApi.list()
      ]);
      setProjects(projRes.data);
      setCompanies(compRes.data);
      setUsers(usrRes.data);
      setWorkflows(wfRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterCompany]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => { setEditing(null); reset({ status: "planificado", priority: "media" }); setModalOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    reset({ company_id: p.company_id, name: p.name, description: p.description || "", start_date: p.start_date || "", deadline: p.deadline || "", status: p.status, priority: p.priority, main_responsible_id: p.main_responsible_id || null, workflow_id: p.workflow_id || null });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    if (data.workflow_id === 0) data.workflow_id = null;
    if (data.main_responsible_id === 0) data.main_responsible_id = null;
    try {
      if (editing) { await projectsApi.update(editing.id, data); showToast("Proyecto actualizado"); }
      else { await projectsApi.create(data); showToast("Proyecto creado"); }
      setModalOpen(false); load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al guardar", "error"); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await projectsApi.delete(deleteId); showToast("Proyecto eliminado"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error al eliminar", "error"); }
    finally { setDeleteId(null); }
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
          <h2 className="text-xl font-bold text-white">Proyectos</h2>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} proyecto{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25">
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto..." className="pl-9 pr-4 py-2.5 rounded-xl border border-[#2E455C]/50 bg-[#07060B]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">Todos los estados</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">Todas las empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid de cards */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50">
          <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay proyectos</p>
          <p className="text-sm mt-1">Crea el primer proyecto para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/proyectos/${p.id}`} className="font-semibold text-white hover:text-[#20CDFE] transition-colors line-clamp-1">
                    {p.name}
                  </Link>
                  <p className="text-slate-400 text-xs mt-0.5">{p.company?.name}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              {p.description && <p className="text-slate-400 text-xs line-clamp-2">{p.description}</p>}
              {/* Progreso */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progreso</span><span className="font-semibold text-[#20CDFE]">{p.progress ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-[#2E455C]/30 rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${p.progress ?? 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status]}`}>{PROJECT_STATUS_LABELS[p.status]}</span>
                <span className="text-xs text-slate-400">📅 {formatDate(p.deadline)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{p.activity_count ?? 0} actividades</span>
                <Link href={`/proyectos/${p.id}`} className="flex items-center gap-0.5 text-violet-500 hover:text-[#20CDFE] font-medium transition-colors">
                  Ver detalle <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07060B]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#2E455C]/50 w-full max-w-lg animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2E455C]/30 shrink-0">
              <h3 className="text-lg font-bold text-white">{editing ? "Editar proyecto" : "Nuevo proyecto"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa *</label>
                  <select {...register("company_id")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="">Seleccionar empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.company_id && <p className="text-red-500 text-xs mt-1">{errors.company_id.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del proyecto *</label>
                  <input {...register("name")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                  <textarea {...register("description")} rows={2} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha inicio</label>
                    <input {...register("start_date")} type="date" className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha límite</label>
                    <input {...register("deadline")} type="date" className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Estado</label>
                    <select {...register("status")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad</label>
                    <select {...register("priority")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Flujo de Trabajo (Workflow)</label>
                  <select {...register("workflow_id")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="">Sin Flujo (Estático)</option>
                    {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Si seleccionas un flujo, el tablero Kanban de actividades usará estas etapas en lugar de los estados fijos.</p>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-[#2E455C]/30 bg-[#2E455C]/10 shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#2E455C]/50 bg-[#07060B]/80 rounded-xl text-sm text-slate-300 hover:bg-[#2E455C]/20 transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-violet-500/10">
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear proyecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07060B]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#2E455C]/50 w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar proyecto?</h3>
            <p className="text-slate-400 text-sm mb-6">Se eliminarán también todas las actividades asociadas.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm text-slate-300 hover:bg-[#2E455C]/20">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
