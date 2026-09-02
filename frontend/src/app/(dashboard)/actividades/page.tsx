"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, Eye, CheckCircle, AlertCircle,
  Clock, XCircle, ClipboardList, LayoutList, LayoutGrid,
  User as UserIcon, Calendar as CalendarIcon, Trash2, Play, Send, Pencil
} from "lucide-react";
import { activitiesApi, projectsApi, companiesApi, usersApi, departmentsApi } from "@/lib/api";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendarUtils";
import type { Activity, ActivityStatus, Company, Project, User } from "@/types";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS, PRIORITY_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";

const schema = z.object({
  project_id: z.coerce.number().optional().nullable(),
  is_independent: z.boolean().optional(),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  reference_link: z.string().optional(),
  activity_type: z.string().default("otro"),
  priority: z.string().default("media"),
  assigned_user_id: z.coerce.number().optional().nullable(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  workflow_id: z.coerce.number().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

type ViewMode = "list" | "board";

export default function ActividadesPage() {
  const { user: currentUser } = useAuth();
  const { subscribe } = useWebSocket();
  
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const isToday = (dateInput?: string | Date | null) => {
    if (!dateInput) return false;
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };
  
  const [modalOpen, setModalOpen] = useState(false);
  const [observeModal, setObserveModal] = useState<{ id: number } | null>(null);
  const [observation, setObservation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [isIndependent, setIsIndependent] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus && filterStatus !== "atrasada") params.status = filterStatus;
      if (filterCompany) params.company_id = filterCompany;
      if (filterProject) params.project_id = filterProject;
      if (filterUser) params.assigned_user_id = filterUser;
      const [actRes, projRes, compRes, usrRes, depRes] = await Promise.all([
        activitiesApi.list(params),
        projectsApi.list(),
        companiesApi.list(),
        usersApi.list(),
        departmentsApi.getAll(),
      ]);
      let loadedActs = actRes.data;
      if (filterStatus === "atrasada") {
        loadedActs = loadedActs.filter((a: Activity) => isOverdue(a.deadline, a.status));
      }
      setActivities(loadedActs);
      setProjects(projRes.data);
      setCompanies(compRes.data);
      setUsers(usrRes.data);
      setDepartments(depRes.data);
    } finally { setLoading(false); }
  };

  const getAssignableUsers = () => {
    const currentId = currentUser?.user_id || currentUser?.id;
    const fullCurrentUser = users.find(u => u.id === currentId) || currentUser;
    
    // Helper para obtener el nivel real desde la lista de departamentos cargados
    const getDeptLevel = (deptId: number) => {
      const found = departments.find(d => d.id === deptId);
      return found?.level ?? 1;
    };

    const userDepts = (fullCurrentUser as any)?.departments || [];
    const currentMinLevel = userDepts.length > 0 
      ? Math.min(...userDepts.map((d: any) => getDeptLevel(d.id))) 
      : 999;

    return users.filter((u) => {
      // 1. Regla: Un usuario no puede asignarse una tarea a sí mismo
      if (u.id === currentId) return false;

      // 2. Excluir usuarios rol cliente
      if (u.role === "cliente") return false;

      // 3. Filtro por departamento seleccionado en modal si aplica
      if (selectedDepartmentId && !u.departments?.some((d: any) => d.id === Number(selectedDepartmentId))) {
        return false;
      }

      // 4. Administrador puede asignar a cualquier usuario (excepto a sí mismo y clientes)
      if (currentUser?.role === "administrador") return true;

      // 5. Gerencia: Asignación por Escalafón Dinámico de Jerarquía
      if (currentUser?.role === "gerencia") {
        const uDepts = u.departments || [];
        if (uDepts.length === 0) return true;

        // Calcular el nivel máximo de autoridad del usuario destino (mínimo número de level)
        const uMinLevel = Math.min(...uDepts.map((d: any) => getDeptLevel(d.id)));

        // Un Gerente NO puede delegar a otro Gerente de igual o mayor autoridad (uMinLevel <= currentMinLevel)
        if (u.role === "gerencia" && uMinLevel <= currentMinLevel) {
          return false;
        }

        // Tampoco puede delegar a operadores de departamentos de mayor jerarquía (uMinLevel < currentMinLevel)
        if (uMinLevel < currentMinLevel) {
          return false;
        }

        // Puede delegar a Operadores de su propio departamento o de departamentos de igual o menor jerarquía (level >= currentMinLevel)
        return uDepts.some((d: any) => getDeptLevel(d.id) >= currentMinLevel);
      }

      return true;
    });
  };

  useEffect(() => { load(); }, [search, filterStatus, filterCompany, filterProject, filterUser]);

  useEffect(() => {
    const unsubscribe = subscribe("activities", () => {
      load();
    });
    return () => unsubscribe();
  }, [subscribe]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const openNewModal = () => {
    setEditingActivity(null);
    setIsIndependent(false);
    reset({
      title: "",
      description: "",
      reference_link: "",
      activity_type: "otro",
      priority: "media",
      assigned_user_id: undefined,
      start_date: "",
      deadline: "",
      workflow_id: undefined,
      project_id: undefined,
    });
    setModalOpen(true);
  };

  const openEditModal = (a: Activity) => {
    setEditingActivity(a);
    setIsIndependent(!a.project_id);
    reset({
      title: a.title,
      description: a.description || "",
      reference_link: a.reference_link || "",
      activity_type: a.activity_type,
      priority: a.priority,
      assigned_user_id: a.assigned_user_id || undefined,
      start_date: a.start_date || "",
      deadline: a.deadline || "",
      workflow_id: a.workflow_id || undefined,
      project_id: a.project_id || undefined,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = { ...data };
      if (!payload.start_date) payload.start_date = null;
      if (!payload.deadline) payload.deadline = null;
      if (payload.assigned_user_id === 0) payload.assigned_user_id = null;
      if (payload.workflow_id === 0) payload.workflow_id = null;
      if (isIndependent || !payload.project_id || Number(payload.project_id) === 0) {
        payload.project_id = null;
      }

      if (editingActivity) {
        await activitiesApi.update(editingActivity.id, payload);
        showToast("Actividad actualizada correctamente");
      } else {
        await activitiesApi.create(payload);
        showToast("Actividad creada correctamente");
      }
      setModalOpen(false);
      setEditingActivity(null);
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al procesar", "error"); }
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
    const act = activities.find(a => a.id === id);
    if (act && !canModifyActivity(act)) {
      showToast("No tienes permisos para cancelar actividades creadas por la Administración", "error");
      return;
    }
    if (!confirm("¿Cancelar esta actividad?")) return;
    try { await activitiesApi.cancel(id); showToast("Actividad cancelada"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de ELIMINAR DEFINITIVAMENTE esta actividad de la base de datos? Esta acción es irreversible.")) return;
    try {
      await activitiesApi.delete(id);
      showToast("Actividad eliminada de la base de datos 🗑️");
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al eliminar", "error"); }
  };

  const canModifyActivity = (a: Activity) => {
    if (currentUser?.role === "administrador") return true;

    const isCreatedByAdmin = a.created_by?.role === "administrador" || (a as any).created_by_role === "administrador";
    if (isCreatedByAdmin) return false;

    const currentId = currentUser?.user_id || currentUser?.id;
    if (a.created_by_id === currentId || a.created_by?.id === currentId) return true;

    return false;
  };

  const handleAssignUser = async (activityId: number, userId: string) => {
    const act = activities.find(a => a.id === activityId);
    if (act && !canModifyActivity(act)) {
      showToast("No tienes permisos para modificar actividades creadas por la Administración", "error");
      return;
    }
    try {
      const assigned_user_id = userId ? parseInt(userId) : null;
      await activitiesApi.update(activityId, { assigned_user_id });
      showToast("Responsable actualizado");
      load();
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al asignar usuario", "error"); }
  };

  const handleUpdateStatus = async (activityId: number, newStatus: ActivityStatus) => {
    const act = activities.find(a => a.id === activityId);
    if (act && !canModifyActivity(act)) {
      showToast("No tienes permisos para modificar el estado de actividades creadas por la Administración", "error");
      return;
    }
    try {
      if (newStatus === "aprobada") {
        await activitiesApi.approve(activityId);
        showToast("✅ Actividad aprobada correctamente");
      } else if (newStatus === "cancelada") {
        await activitiesApi.cancel(activityId);
        showToast("Actividad cancelada");
      } else if (newStatus === "en_proceso") {
        try {
          await activitiesApi.start(activityId);
          showToast("▶️ Actividad iniciada");
        } catch {
          await activitiesApi.update(activityId, { status: newStatus });
          showToast("Estado actualizado");
        }
      } else if (newStatus === "en_revision") {
        try {
          await activitiesApi.sendReview(activityId);
          showToast("📤 Enviado a revisión");
        } catch {
          await activitiesApi.update(activityId, { status: newStatus });
          showToast("Estado actualizado");
        }
      } else {
        await activitiesApi.update(activityId, { status: newStatus });
        showToast("Estado actualizado");
      }
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
    { id: "pendiente", title: "Pendientes", color: "text-slate-300", border: "border-slate-800/50", bg: "bg-[#1C2C4D]/50" },
    { id: "en_proceso", title: "En Progreso", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50/50" },
    { id: "en_revision", title: "En Revisión", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50/50" },
    { id: "aprobada", title: "Completadas", color: "text-green-600", border: "border-green-200", bg: "bg-green-50/50" },
    { id: "cancelada", title: "Canceladas", color: "text-red-600", border: "border-red-200", bg: "bg-red-50/50" },
  ];

  const renderBoardCard = (a: Activity) => {
    const overdue = isOverdue(a.deadline, a.status);
    
    return (
      <div key={a.id} className={`p-4 rounded-xl border bg-[#0A101D]/80 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md ${overdue ? "border-red-200" : "border-slate-800/50"}`}>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/actividades/${a.id}`} className="font-bold text-white hover:text-[#20CDFE] transition-colors text-sm line-clamp-2">
            {a.title}
          </Link>
          <div className="shrink-0 flex items-center gap-1">
            {canModifyActivity(a) && (
              <button onClick={() => openEditModal(a)} className="p-1 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-[#15233D] transition-colors" title="Editar información">
                <Pencil size={13} />
              </button>
            )}
            <PriorityBadge priority={a.priority} />
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium line-clamp-1">
          {a.project_name} <span className="opacity-50">· {a.company_name}</span>
        </div>

        {/* Detalles e iconos */}
        <div className="flex flex-col gap-1.5 text-xs text-slate-400 mt-1 border-t border-[#2E455C]/20 pt-3">
          <div className="flex items-center justify-between">
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

          {a.deadline && (
            <div className="flex items-center gap-1.5 pt-1">
              <a
                href={getGoogleCalendarUrl({
                  title: `[Benchamen] ${a.title}`,
                  description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                  date: a.deadline,
                  startTime: "09:00",
                  endTime: "18:00"
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#4285F4]/20 text-[#4285F4] hover:bg-[#4285F4]/30 border border-[#4285F4]/30 flex items-center gap-1 transition-colors"
                title="Añadir a Google Calendar"
              >
                📅 Google Calendar
              </a>
              <button
                onClick={() => downloadIcsFile({
                  title: `[Benchamen] ${a.title}`,
                  description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                  date: a.deadline!,
                  startTime: "09:00",
                  endTime: "18:00"
                })}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors"
                title="Descargar iCal (.ics)"
              >
                📥 iCal
              </button>
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
              disabled={!canModifyActivity(a)}
              className="w-full text-xs font-semibold appearance-none bg-[#15233D] hover:bg-[#1C2C4D] border border-slate-800/50 rounded-lg py-2 pl-8 pr-3 cursor-pointer outline-none transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                const isWorkflow = !!a.workflow_id;
                
                return (
                  <>
                    {["pendiente", "asignada"].includes(a.status) && (
                        <button onClick={() => handleUpdateStatus(a.id, "en_proceso")} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap">
                          Iniciar {isWorkflow && a.current_stage ? `(${a.current_stage.name})` : ""}
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
             {a.status === "en_revision" && (currentUser?.role === "administrador" || currentUser?.role === "gerencia") && (
                <>
                  <button onClick={() => handleApprove(a.id)} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg transition-colors" title="Aprobar">
                    Aprobar
                  </button>
                  <button onClick={() => setObserveModal({ id: a.id })} className="flex-1 text-[10px] uppercase tracking-wider font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 py-1.5 rounded-lg transition-colors" title="Observar">
                    Observar
                  </button>
                </>
             )}
             {!["aprobada", "cancelada"].includes(a.status) && canModifyActivity(a) && (
                <button onClick={() => handleCancel(a.id)} className="w-8 h-8 flex items-center justify-center shrink-0 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Cancelar">
                  <XCircle size={14} />
                </button>
             )}
             {(a.status === "cancelada" || currentUser?.role === "administrador") && (
                <button onClick={() => handleDelete(a.id)} className="w-8 h-8 flex items-center justify-center shrink-0 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-500/30" title="Eliminar de la BD">
                  <Trash2 size={14} />
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
            <div className="flex bg-[#1C2C4D] p-1 rounded-xl">
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "board" ? "bg-[#0A101D]/80 text-[#20CDFE] shadow-sm font-bold" : "text-slate-400 hover:text-slate-300"}`}
                title="Vista de Tablero"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#0A101D]/80 text-[#20CDFE] shadow-sm font-bold" : "text-slate-400 hover:text-slate-300"}`}
                title="Vista de Lista"
              >
                <LayoutList size={18} />
              </button>
            </div>

            <button onClick={openNewModal} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20 transition-all">
              <Plus size={16} /> <span className="hidden sm:inline">Nueva actividad</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar actividad..." className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-800/50 bg-[#0A101D]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los estados</option>
            <option value="atrasada">⚠️ Tareas Atrasadas</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todas las empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los proyectos</option>
            {projects.filter(p => !filterCompany || p.company?.id.toString() === filterCompany).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2.5 border border-slate-800/50 rounded-xl bg-[#0A101D]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 font-medium text-slate-300">
            <option value="">Todos los usuarios</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
              showHistory
                ? "bg-purple-900/40 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10"
                : "bg-[#0A101D]/80 text-slate-400 border-slate-800/50 hover:text-white"
            }`}
            title={showHistory ? "Mostrando todas las actividades completadas y canceladas" : "Ocultando completadas y canceladas de días anteriores"}
          >
            <Clock size={15} className={showHistory ? "text-purple-400" : "text-slate-400"} />
            <span>{showHistory ? "Histórico Completo" : "Actividades de Hoy"}</span>
            {!showHistory && (
              <span className="bg-purple-950 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30">
                {activities.filter(a => (a.status === "aprobada" && !isToday(a.approved_at || a.updated_at)) || (a.status === "cancelada" && !isToday(a.updated_at))).length} ocultas
              </span>
            )}
          </button>
        </div>

        {/* Contenido (Loading, Lista o Tablero) */}
        {loading ? (
            <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
        ) : activities.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 border-dashed">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="font-semibold text-lg text-slate-400">No se encontraron actividades</p>
            <p className="text-sm mt-1">Intenta ajustando los filtros o creando una nueva.</p>
          </div>
        ) : viewMode === "board" ? (
          /* Kanban Board View */
          <div className="flex-1 flex gap-5 overflow-x-auto pb-4 h-full snap-x">
            {(() => {
                const hiddenCompletedCount = activities.filter(a => a.status === "aprobada" && !isToday(a.approved_at || a.updated_at)).length;
                const hiddenCancelledCount = activities.filter(a => a.status === "cancelada" && !isToday(a.updated_at)).length;

                return columns.map(col => {
                  const colActivities = activities.filter(a => {
                    if (a.status !== col.id) return false;
                    // Auto-ocultar completadas y canceladas de días anteriores si showHistory es false
                    if (!showHistory) {
                      if (col.id === "aprobada") {
                        return isToday(a.approved_at || a.updated_at);
                      }
                      if (col.id === "cancelada") {
                        return isToday(a.updated_at);
                      }
                    }
                    return true;
                  });

                  return (
                    <div key={col.id} className={`flex flex-col min-w-[320px] w-[320px] max-w-[320px] snap-center shrink-0 h-full rounded-2xl border ${col.border} ${col.bg}`}>
                      <div className={`p-4 font-black text-sm uppercase tracking-wider flex items-center justify-between border-b ${col.border}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={col.color}>{col.title}</span>
                          {(col.id === "aprobada" || col.id === "cancelada") && !showHistory && (
                            <span className="text-[10px] text-slate-400 font-normal lowercase">(hoy)</span>
                          )}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-[#0A101D]/80 border ${col.border} ${col.color}`}>{colActivities.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {col.id === "aprobada" && hiddenCompletedCount > 0 && !showHistory && (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
                            <p className="text-[11px] text-emerald-300 font-semibold">
                              ✨ {hiddenCompletedCount} {hiddenCompletedCount === 1 ? "actividad completada" : "actividades completadas"} en días anteriores.
                            </p>
                            <button
                              onClick={() => setShowHistory(true)}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-200 underline"
                            >
                              Ver histórico completo
                            </button>
                          </div>
                        )}

                        {col.id === "cancelada" && hiddenCancelledCount > 0 && !showHistory && (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-center space-y-1">
                            <p className="text-[11px] text-red-300 font-semibold">
                              🗑️ {hiddenCancelledCount} {hiddenCancelledCount === 1 ? "actividad cancelada" : "actividades canceladas"} en días anteriores.
                            </p>
                            <button
                              onClick={() => setShowHistory(true)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-200 underline"
                            >
                              Ver histórico completo
                            </button>
                          </div>
                        )}

                        {colActivities.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs font-medium opacity-60">
                            Sin actividades {col.id === "aprobada" || col.id === "cancelada" ? "de hoy" : ""}
                          </div>
                        ) : (
                          colActivities.map(renderBoardCard)
                        )}
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#15233D] border-b border-slate-800/50 sticky top-0 z-10">
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
                    <tr key={a.id} className={`hover:bg-[#0F192E] transition-colors ${overdue ? "bg-red-50/30" : ""}`}>
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
                          disabled={!canModifyActivity(a)}
                          className="bg-transparent border border-slate-800/50 rounded-md py-1 px-2 text-xs focus:ring-2 focus:ring-violet-200 hover:border-violet-300 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          disabled={!canModifyActivity(a)}
                          className="bg-transparent border border-slate-800/50 rounded-md py-1 px-2 text-xs focus:ring-2 focus:ring-violet-200 hover:border-violet-300 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        {a.deadline ? (
                          <div className="space-y-1">
                            <span className={`text-xs font-medium block ${overdue ? "text-red-500 font-bold" : "text-slate-300"}`}>
                              {overdue ? "⚠️ " : ""}{formatDate(a.deadline)}
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={getGoogleCalendarUrl({
                                  title: `[Benchamen] ${a.title}`,
                                  description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                                  date: a.deadline,
                                  startTime: "09:00",
                                  endTime: "18:00"
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4285F4]/20 text-[#4285F4] hover:bg-[#4285F4]/30 border border-[#4285F4]/30 transition-colors"
                                title="Añadir a Google Calendar"
                              >
                                📅 Google
                              </a>
                              <button
                                onClick={() => downloadIcsFile({
                                  title: `[Benchamen] ${a.title}`,
                                  description: `${a.description || ""}\nProyecto: ${a.project_name || ""}\nEmpresa: ${a.company_name || ""}`,
                                  date: a.deadline!,
                                  startTime: "09:00",
                                  endTime: "18:00"
                                })}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                                title="Descargar iCal (.ics)"
                              >
                                📥 iCal
                              </button>
                            </div>
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link href={`/actividades/${a.id}`} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Ver detalle">
                            <Eye size={14} />
                          </Link>
                          {canModifyActivity(a) && (
                            <button onClick={() => openEditModal(a)} className="p-1.5 rounded-lg hover:bg-violet-900/40 text-violet-400 hover:text-violet-300 transition-colors" title="Editar actividad">
                              <Pencil size={14} />
                            </button>
                          )}
                          {["pendiente", "asignada"].includes(a.status) && (a.assigned_user_id === currentUser?.id || currentUser?.role === "administrador") && (
                            <button onClick={() => handleUpdateStatus(a.id, "en_proceso")} className="p-1.5 rounded-lg hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 transition-colors" title="Iniciar Trabajo">
                              <Play size={14} />
                            </button>
                          )}
                          {["en_proceso", "observada"].includes(a.status) && (a.assigned_user_id === currentUser?.id || currentUser?.role === "administrador") && (
                            <button onClick={() => handleUpdateStatus(a.id, "en_revision")} className="p-1.5 rounded-lg hover:bg-blue-900/40 text-[#20CDFE] hover:text-white transition-colors" title="Enviar a Revisión">
                              <Send size={14} />
                            </button>
                          )}
                          {a.status === "en_revision" && (currentUser?.role === "administrador" || currentUser?.role === "gerencia") && (
                             <>
                               <button onClick={() => handleApprove(a.id)} className="p-1.5 rounded-lg hover:bg-green-100 text-slate-400 hover:text-green-600 transition-colors" title="Aprobar">
                                 <CheckCircle size={14} />
                               </button>
                               <button onClick={() => setObserveModal({ id: a.id })} className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors" title="Observar">
                                 <AlertCircle size={14} />
                               </button>
                             </>
                          )}
                          {!["aprobada", "cancelada"].includes(a.status) && canModifyActivity(a) && (
                            <button onClick={() => handleCancel(a.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Cancelar">
                              <XCircle size={14} />
                            </button>
                          )}
                          {(a.status === "cancelada" || currentUser?.role === "administrador") && (
                            <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 transition-colors" title="Eliminar de la Base de Datos">
                              <Trash2 size={14} />
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
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0">
              <h3 className="text-lg font-bold text-white">
                {editingActivity ? "Editar información de la actividad" : "Nueva actividad"}
              </h3>
              <button onClick={() => { setModalOpen(false); setEditingActivity(null); }} className="text-slate-400 hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-[#1C2C4D]"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

                {/* Opción Habilitable: Trabajo Independiente / Sin Proyecto */}
                <div className="p-3 bg-[#15233D]/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-white block">Trabajo Independiente / Cliente Externo</label>
                    <span className="text-[11px] text-slate-400 block">Habilitar creación sin requerir un proyecto asignado</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isIndependent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsIndependent(checked);
                      if (checked) {
                        setValue("project_id", null);
                      }
                    }}
                    className="w-5 h-5 accent-[#20CDFE] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Proyecto {isIndependent ? "(Opcional / Deshabilitado)" : "*"}
                  </label>
                  <select 
                    {...register("project_id")} 
                    disabled={isIndependent}
                    className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">(Sin Proyecto / Trabajo Independiente)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.company?.name || "Cliente Externo"})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título *</label>
                  <input {...register("title")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80" placeholder="Ej. Diseño de logotipo" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Concepto / Descripción del Trabajo</label>
                  <textarea {...register("description")} rows={3} className="w-full px-3.5 py-2.5 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#0A101D]/80 resize-none text-white" placeholder="Detalla el concepto, requerimientos e instrucciones del trabajo..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    🔗 Link Referencial / Materiales (Drive, Figma, Canva, etc.)
                  </label>
                  <input
                    {...register("reference_link")}
                    type="url"
                    className="w-full px-3.5 py-2.5 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#0A101D]/80 text-white"
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo</label>
                    <select {...register("activity_type")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80">
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prioridad</label>
                    <select {...register("priority")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80">
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha inicio</label>
                    <input {...register("start_date")} type="date" className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha límite</label>
                    <input {...register("deadline")} type="date" className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80" />
                  </div>
                </div>

                {currentUser?.role === "administrador" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Filtrar por Área / Departamento</label>
                      <select 
                        value={selectedDepartmentId}
                        onChange={(e) => {
                          setSelectedDepartmentId(e.target.value);
                          setValue("assigned_user_id", null);
                        }}
                        className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80 text-white"
                      >
                        <option value="">Todos los departamentos</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Responsable Inicial</label>
                      <select {...register("assigned_user_id")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80 text-white">
                        <option value="">Sin asignar</option>
                        {getAssignableUsers().map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.position || (u.role === "gerencia" ? "Gerente" : "Operativo")})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Responsable Inicial</label>
                    <select {...register("assigned_user_id")} className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-[#0A101D]/80 text-white">
                      <option value="">Sin asignar</option>
                      {getAssignableUsers().map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.position || (u.role === "gerencia" ? "Gerente" : "Operativo")})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-800/50 bg-[#15233D]/80 shrink-0">
                <button type="button" onClick={() => { setModalOpen(false); setEditingActivity(null); }} className="flex-1 px-4 py-2.5 border border-slate-800/50 bg-[#0A101D]/80 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#15233D] transition-colors shadow-sm">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-violet-500/20">
                  {submitting ? (editingActivity ? "Guardando..." : "Creando...") : (editingActivity ? "Guardar cambios" : "Crear actividad")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal observación */}
      {observeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">Observar actividad</h3>
            <p className="text-slate-400 text-sm mb-4">Escribe una observación para el responsable.</p>
            <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={3} placeholder="Describe qué debe corregirse..." className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none mb-4 bg-[#0A101D]/80" />
            <div className="flex gap-3">
              <button onClick={() => { setObserveModal(null); setObservation(""); }} className="flex-1 px-4 py-2.5 border border-slate-800/50 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#15233D] transition-colors">Cancelar</button>
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
