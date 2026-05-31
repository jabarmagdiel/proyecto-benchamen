"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, Eye, CheckCircle, AlertCircle,
  Clock, XCircle, ClipboardList, LayoutList, LayoutGrid,
  User as UserIcon, Calendar as CalendarIcon
} from "lucide-react";
import { activitiesApi, projectsApi, companiesApi, usersApi, workflowsApi } from "@/lib/api";
import type { Activity, ActivityStatus, Company, Project, User, Workflow, WorkflowStage } from "@/types";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS, PRIORITY_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  project_id: z.coerce.number().min(1, "Proyecto requerido"),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  activity_type: z.string().default("otro"),
  priority: z.string().default("media"),
  assigned_user_id: z.coerce.number().optional().nullable(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type ViewMode = "list" | "board";

export default function ActividadesPage() {
  const { user: currentUser } = useAuth();
  
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [observeModal, setObserveModal] = useState<{ id: number } | null>(null);
  const [observation, setObservation] = useState("");
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
      if (filterProject) params.project_id = filterProject;
      if (filterUser) params.assigned_user_id = filterUser;
      const [actRes, projRes, compRes, usrRes, wfRes] = await Promise.all([
        activitiesApi.list(params),
        projectsApi.list(),
        companiesApi.list(),
        usersApi.list(),
        workflowsApi.list(),
      ]);
      setActivities(actRes.data);
      setProjects(projRes.data);
      setCompanies(compRes.data);
      setUsers(usrRes.data);
      setWorkflows(wfRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterCompany, filterProject, filterUser]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await activitiesApi.create(data);
      showToast("Actividad creada correctamente");
      setModalOpen(false); load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al crear", "error"); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id: number) => {
    try { await activitiesApi.approve(id); showToast("✅ Actividad aprobada"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleObserve = async () => {
    if (!observeModal || !observation.trim()) return;
    try {
      await activitiesApi.observe(observeModal.id, observation);
      showToast("⚠️ Observación enviada"); setObserveModal(null); setObservation(""); load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar esta actividad?")) return;
    try { await activitiesApi.cancel(id); showToast("Actividad cancelada"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleAssignUser = async (activityId: number, userId: string) => {
    try {
      const assigned_user_id = userId ? parseInt(userId) : null;
      await activitiesApi.update(activityId, { assigned_user_id });
      showToast("Responsable actualizado");
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al asignar usuario", "error"); }
  };

  const handleUpdateStatus = async (activityId: number, newStatus: ActivityStatus) => {
    try {
      await activitiesApi.update(activityId, { status: newStatus });
      showToast("Estado actualizado");
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al actualizar estado", "error"); }
  };

  const handleUpdateStage = async (activityId: number, newStageId: number) => {
    try {
      await activitiesApi.update(activityId, { current_stage_id: newStageId });
      showToast("Etapa actualizada");
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al actualizar etapa", "error"); }
  };

  // Agrupación para el Kanban Board
  const columns: { id: ActivityStatus; title: string; color: string; border: string; bg: string }[] = [
    { id: "pendiente", title: "Pendientes", color: "text-slate-300", border: "border-[#2E455C]/50", bg: "bg-[#2E455C]/30/50" },
    { id: "en_proceso", title: "En Progreso", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50/50" },
    { id: "en_revision", title: "En Revisión", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50/50" },
    { id: "aprobada", title: "Completadas", color: "text-green-600", border: "border-green-200", bg: "bg-green-50/50" },
    { id: "cancelada", title: "Canceladas", color: "text-red-600", border: "border-red-200", bg: "bg-red-50/50" },
  ];

  const renderBoardCard = (a: Activity) => {
    const overdue = isOverdue(a.deadline, a.status);
    
    return (
      <div key={a.id} className={`p-4 rounded-xl border bg-[#07060B]/80 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md ${overdue ? "border-red-200" : "border-[#2E455C]/30"}`}>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/actividades/${a.id}`} className="font-bold text-white hover:text-[#20CDFE] transition-colors text-sm line-clamp-2">
            {a.title}
          </Link>
          <div className="shrink-0"><PriorityBadge priority={a.priority} /></div>
        </div>

        <div className="text-xs text-slate-400 font-medium line-clamp-1">
          {a.project_name} <span className="opacity-50">· {a.company_name}</span>
        </div>

        {/* Detalles e iconos */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-1 border-t border-[#2E455C]/20 pt-3">
          <div className={`flex items-center gap-1 font-semibold ${overdue ? "text-red-500" : ""}`}>
            <CalendarIcon size={12} />
            {a.deadline ? formatDate(a.deadline) : "Sin fecha"}
          </div>
          {(a.evidence_count || 0) > 0 && (
            <div className="flex items-center gap-1 font-semibold text-[#20CDFE] bg-violet-50 px-2 py-0.5 rounded-md">
              <ClipboardList size={12} /> {a.evidence_count} ev.
            </div>
          )}
        </div>

        {/* Asignación y acciones */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="relative">
            <UserIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={a.assigned_user_id || ""}
              onChange={(e) => handleAssignUser(a.id, e.target.value)}
              className="w-full text-xs font-semibold appearance-none bg-[#2E455C]/20 hover:bg-[#2E455C]/30 border border-[#2E455C]/50 rounded-lg py-2 pl-8 pr-3 cursor-pointer outline-none transition-colors text-white"
            >
              <option value="">Sin asignar</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Acciones de etapa dinámicas */}
          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto custom-scrollbar pb-1">
             {(() => {
                const proj = projects.find(p => p.id === a.project_id);
                const wf = proj ? workflows.find(w => w.id === proj.workflow_id) : null;
                if (!wf || !wf.stages || wf.stages.length === 0) {
                  // Fallback a botones de estado legacy
                  return (
                    <>
                      {["pendiente", "asignada"].includes(a.status) && (
                          <button onClick={() => handleUpdateStatus(a.id, "en_proceso")} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                            Iniciar
                          </button>
                      )}
                      {["en_proceso", "observada"].includes(a.status) && (
                          <button onClick={() => handleUpdateStatus(a.id, "en_revision")} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                            Revisión
                          </button>
                      )}
                      {a.status === "en_revision" && currentUser?.role === "administrador" && (
                          <button onClick={() => handleApprove(a.id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 hover:bg-green-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                            Aprobar
                          </button>
                      )}
                    </>
                  );
                }

                // Botones dinámicos de etapa
                const currentStageIndex = wf.stages.findIndex(s => s.id === a.current_stage_id);
                const nextStage = currentStageIndex >= 0 && currentStageIndex < wf.stages.length - 1 ? wf.stages[currentStageIndex + 1] : null;
                const prevStage = currentStageIndex > 0 ? wf.stages[currentStageIndex - 1] : null;

                if (!a.current_stage_id && wf.stages.length > 0) {
                  return (
                    <button onClick={() => handleUpdateStage(a.id, wf.stages[0].id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-[#2E455C]/20 text-indigo-700 hover:bg-indigo-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                      Iniciar Flujo
                    </button>
                  );
                }

                return (
                  <>
                    {prevStage && (
                      <button onClick={() => handleUpdateStage(a.id, prevStage.id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-[#2E455C]/20 text-white hover:bg-[#2E455C]/30 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                        ← Retroceder
                      </button>
                    )}
                    {nextStage && (
                      <button onClick={() => handleUpdateStage(a.id, nextStage.id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-[#2E455C]/20 text-indigo-700 hover:bg-indigo-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                        Avanzar a {nextStage.name}
                      </button>
                    )}
                  </>
                );
             })()}
             {["en_proceso", "observada"].includes(a.status) && (
                <button onClick={() => handleUpdateStatus(a.id, "en_revision")} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 py-1.5 rounded-lg transition-colors">
                  Enviar a rev.
                </button>
             )}
             {a.status === "en_revision" && currentUser?.role === "administrador" && (
                <>
                  <button onClick={() => handleApprove(a.id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg transition-colors" title="Aprobar">
                    Aprobar
                  </button>
                  <button onClick={() => setObserveModal({ id: a.id })} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 py-1.5 rounded-lg transition-colors" title="Observar">
                    Observar
                  </button>
                </>
             )}
             {!["aprobada", "cancelada"].includes(a.status) && (
                <button onClick={() => handleCancel(a.id)} className="w-8 h-8 flex items-center justify-center shrink-0 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Cancelar">
                  <XCircle size={14} />
                </button>
             )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-emerald-500 shadow-emerald-500/25" : "bg-red-500 shadow-red-500/25"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-100px)]">

        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Actividades</h2>
            <p className="text-slate-400 text-sm mt-0.5">{activities.length} actividad{activities.length !== 1 ? "es" : ""}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-[#2E455C]/30 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "board" ? "bg-[#07060B]/80 text-[#20CDFE] shadow-sm font-bold" : "text-slate-400 hover:text-slate-300"}`}
                title="Vista de Tablero"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#07060B]/80 text-[#20CDFE] shadow-sm font-bold" : "text-slate-400 hover:text-slate-300"}`}
                title="Vista de Lista"
              >
                <LayoutList size={18} />
              </button>
            </div>

            <button onClick={() => { reset({ activity_type: "otro", priority: "media" }); setModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20 transition-all">
              <Plus size={16} /> <span className="hidden sm:inline">Nueva actividad</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar actividad..." className="pl-9 pr-4 py-2.5 rounded-xl border border-[#2E455C]/50 bg-[#07060B]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los estados</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todas las empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los proyectos</option>
            {projects.filter(p => !filterCompany || p.company?.id.toString() === filterCompany).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los usuarios</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Contenido (Loading, Lista o Tablero) */}
        {loading ? (
            <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
        ) : activities.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 border-dashed">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="font-semibold text-lg text-slate-400">No se encontraron actividades</p>
            <p className="text-sm mt-1">Intenta ajustando los filtros o creando una nueva.</p>
          </div>
        ) : viewMode === "board" ? (
          /* Kanban Board View */
          <div className="flex-1 flex gap-5 overflow-x-auto pb-4 h-full snap-x">
            {(() => {
              // Determinar qué columnas mostrar
              let activeColumns = columns;
              let isDynamic = false;
              let dynamicStages: WorkflowStage[] = [];

              if (filterProject) {
                const selectedProject = projects.find(p => p.id.toString() === filterProject);
                if (selectedProject && selectedProject.workflow_id) {
                  const wf = workflows.find(w => w.id === selectedProject.workflow_id);
                  if (wf && wf.stages && wf.stages.length > 0) {
                    isDynamic = true;
                    dynamicStages = wf.stages;
                  }
                }
              }

              if (isDynamic) {
                return dynamicStages.map(stage => {
                  const colActivities = activities.filter(a => a.current_stage_id === stage.id);
                  return (
                    <div key={stage.id} className="flex flex-col min-w-[320px] w-[320px] max-w-[320px] snap-center shrink-0 h-full rounded-2xl border border-[#2E455C]/50 bg-[#2E455C]/10">
                      <div className="p-4 font-black text-sm uppercase tracking-wider flex items-center justify-between border-b border-[#2E455C]/50">
                        <span className="text-white">{stage.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#07060B]/80 border border-[#2E455C]/50 text-slate-400">{colActivities.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {colActivities.map(renderBoardCard)}
                      </div>
                    </div>
                  );
                });
              } else {
                // Default static columns
                return columns.map(col => {
                  const colActivities = activities.filter(a => a.status === col.id);
                  return (
                    <div key={col.id} className={`flex flex-col min-w-[320px] w-[320px] max-w-[320px] snap-center shrink-0 h-full rounded-2xl border ${col.border} ${col.bg}`}>
                      <div className={`p-4 font-black text-sm uppercase tracking-wider flex items-center justify-between border-b ${col.border}`}>
                        <span className={col.color}>{col.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-[#07060B]/80 border ${col.border} ${col.color}`}>{colActivities.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {colActivities.map(renderBoardCard)}
                      </div>
                    </div>
                  );
                });
              }
            })()}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm overflow-hidden flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#2E455C]/20 border-b border-[#2E455C]/30 sticky top-0 z-10">
                <tr>
                  {["Actividad", "Proyecto / Empresa", "Tipo", "Responsable", "Prioridad", "Estado", "Vence", "Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activities.map((a) => {
                  const overdue = isOverdue(a.deadline, a.status);
                  return (
                    <tr key={a.id} className={`hover:bg-[#2E455C]/10 transition-colors ${overdue ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3.5">
                        <Link href={`/actividades/${a.id}`} className="font-semibold text-white hover:text-[#20CDFE] transition-colors line-clamp-1 max-w-[200px] block">
                          {a.title}
                        </Link>
                        {a.evidence_count ? <span className="text-xs text-slate-400">{a.evidence_count} evidencia{a.evidence_count > 1 ? "s" : ""}</span> : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-white text-xs font-medium">{a.project_name}</p>
                        <p className="text-slate-400 text-xs">{a.company_name}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{ACTIVITY_TYPE_LABELS[a.activity_type]}</td>
                      <td className="px-4 py-3.5 text-slate-300 text-xs">
                        <select
                          value={a.assigned_user_id || ""}
                          onChange={(e) => handleAssignUser(a.id, e.target.value)}
                          className="bg-transparent border border-[#2E455C]/50 rounded-md py-1 px-2 text-xs focus:ring-2 focus:ring-violet-200 hover:border-violet-300 outline-none transition-colors"
                        >
                          <option value="">Sin asignar</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5"><PriorityBadge priority={a.priority} /></td>
                      <td className="px-4 py-3.5">
                        <select
                          value={a.status}
                          onChange={(e) => handleUpdateStatus(a.id, e.target.value as ActivityStatus)}
                          className="bg-transparent border border-[#2E455C]/50 rounded-md py-1 px-2 text-xs focus:ring-2 focus:ring-violet-200 hover:border-violet-300 outline-none transition-colors"
                        >
                          {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        {a.deadline ? (
                          <span className={`text-xs font-medium ${overdue ? "text-red-600" : "text-slate-400"}`}>
                            {overdue ? "⚠️ " : ""}{formatDate(a.deadline)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link href={`/actividades/${a.id}`} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Ver detalle">
                            <Eye size={14} />
                          </Link>
                          {a.status === "en_revision" && currentUser?.role === "administrador" && (
                            <>
                              <button onClick={() => handleApprove(a.id)} className="p-1.5 rounded-lg hover:bg-green-100 text-slate-400 hover:text-green-600 transition-colors" title="Aprobar">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => setObserveModal({ id: a.id })} className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors" title="Observar">
                                <AlertCircle size={14} />
                              </button>
                            </>
                          )}
                          {!["aprobada", "cancelada"].includes(a.status) && (
                            <button onClick={() => handleCancel(a.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Cancelar">
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

      {/* Modal crear actividad */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07060B]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#2E455C]/50 w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2E455C]/30 shrink-0">
              <h3 className="text-lg font-bold text-white">Nueva actividad</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-[#2E455C]/30"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Proyecto *</label>
                  <select {...register("project_id")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80">
                    <option value="">Seleccionar proyecto</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.company?.name})</option>)}
                  </select>
                  {errors.project_id && <p className="text-red-500 text-xs mt-1">{errors.project_id.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título *</label>
                  <input {...register("title")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80" placeholder="Ej. Diseño de logotipo" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descripción</label>
                  <textarea {...register("description")} rows={2} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80 resize-none" placeholder="Detalles de la tarea..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo</label>
                    <select {...register("activity_type")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80">
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prioridad</label>
                    <select {...register("priority")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80">
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha inicio</label>
                    <input {...register("start_date")} type="date" className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha límite</label>
                    <input {...register("deadline")} type="date" className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Responsable</label>
                  <select {...register("assigned_user_id")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#07060B]/80">
                    <option value="">Sin asignar</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.position || u.role})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-[#2E455C]/30 bg-[#2E455C]/20/80 shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#2E455C]/50 bg-[#07060B]/80 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#2E455C]/20 transition-colors shadow-sm">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-violet-500/20">
                  {submitting ? "Creando..." : "Crear actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal observación */}
      {observeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07060B]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#2E455C]/50 w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">Observar actividad</h3>
            <p className="text-slate-400 text-sm mb-4">Escribe una observación para el responsable.</p>
            <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={3} placeholder="Describe qué debe corregirse..." className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none mb-4 bg-[#07060B]/80" />
            <div className="flex gap-3">
              <button onClick={() => { setObserveModal(null); setObservation(""); }} className="flex-1 px-4 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#2E455C]/20 transition-colors">Cancelar</button>
              <button onClick={handleObserve} disabled={!observation.trim()} className="flex-1 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-lg shadow-amber-500/20">
                Enviar observación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
