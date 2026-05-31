"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Search, Eye, ClipboardList, Calendar,
  User as UserIcon, Building2, AlertTriangle
} from "lucide-react";
import { projectsApi, activitiesApi, usersApi, departmentsApi } from "@/lib/api";
import type { Project, Activity, User as UserType } from "@/types";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  project_id: z.coerce.number().min(1, "Proyecto requerido"),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  activity_type: z.string().default("otro"),
  node_type: z.string().default("task"),
  priority: z.string().default("media"),
  assigned_user_id: z.coerce.number().optional().nullable(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, actRes, usrRes, depRes] = await Promise.all([
        projectsApi.get(projectId),
        activitiesApi.list({ project_id: projectId }),
        usersApi.list(),
        departmentsApi.getAll(),
      ]);
      setProject(projRes.data);
      setActivities(actRes.data);
      setUsers(usrRes.data);
      setDepartments(depRes.data);
    } catch (err) {
      console.error("Error loading project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = { ...data };
      if (!payload.start_date) payload.start_date = null;
      if (!payload.deadline) payload.deadline = null;
      if (payload.assigned_user_id === 0) payload.assigned_user_id = null;
      
      await activitiesApi.create(payload);
      showToast("Actividad creada correctamente");
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      let errorMsg = "Error al crear";
      const detail = e?.response?.data?.detail;
      if (detail) {
        errorMsg = typeof detail === 'string' ? detail : "Error de validación (revisa los campos)";
      }
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignUser = async (activityId: number, newUserId: string) => {
    try {
      const payload = { assigned_user_id: newUserId ? parseInt(newUserId) : null };
      await activitiesApi.update(activityId, payload);
      showToast("Responsable asignado correctamente");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al asignar responsable", "error");
    }
  };

  const handleOpenCreateModal = () => {
    reset({
      project_id: projectId,
      activity_type: "otro",
      priority: "media",
      title: "",
      description: "",
      start_date: "",
      deadline: "",
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-slate-400">
        Proyecto no encontrado
      </div>
    );
  }

  // Filtrar actividades localmente por búsqueda y estado
  const filteredActivities = activities.filter((act) => {
    const matchesSearch = act.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus ? act.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Calcular contadores de actividades para el progreso
  const totalActs = activities.length;
  const approvedActs = activities.filter((a) => a.status === "aprobada").length;
  const progressPercent = totalActs > 0 ? Math.round((approvedActs / totalActs) * 100) : 0;

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[#2E455C]/30 text-slate-400 hover:text-slate-300 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs bg-[#2E455C]/30 text-slate-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Building2 size={12} /> {project.company?.name}
              </span>
              <span className="text-xs bg-violet-50 text-[#20CDFE] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <UserIcon size={12} /> Responsable: {project.main_responsible?.name || "Sin asignar"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white truncate">{project.name}</h1>
          </div>
          {isAdmin && (
            <button onClick={handleOpenCreateModal} className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-violet-500/25 cursor-pointer">
              <Plus size={16} /> Nueva actividad
            </button>
          )}
        </div>

        {/* Resumen e información general */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de información */}
          <div className="lg:col-span-2 bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-white text-base mb-2">Descripción del Proyecto</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {project.description || "Sin descripción proporcionada."}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#2E455C]/20 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Prioridad</p>
                <div className="mt-1"><PriorityBadge priority={project.priority} /></div>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Estado</p>
                <div className="mt-1"><StatusBadge status={project.status as any} /></div>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Fecha inicio</p>
                <p className="text-white font-medium mt-1">{formatDate(project.start_date)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Fecha límite</p>
                <p className="text-white font-medium mt-1">{formatDate(project.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de progreso */}
          <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-white text-base mb-4">Progreso del Proyecto</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-extrabold text-white">{progressPercent}%</span>
                <span className="text-xs text-slate-400 font-medium">completado</span>
              </div>
              <div className="w-full bg-[#2E455C]/30 h-3 rounded-full overflow-hidden mb-4">
                <div className="gradient-primary h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center border-t border-[#2E455C]/20 pt-4">
              <div>
                <p className="text-2xl font-bold text-white">{totalActs}</p>
                <p className="text-xs text-slate-400">Total actividades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{approvedActs}</p>
                <p className="text-xs text-slate-400">Aprobadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador y filtros de actividades */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar actividad en este proyecto..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-[#2E455C]/50 bg-[#07060B]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-[#2E455C]/50 rounded-xl bg-[#07060B]/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Listado de actividades */}
        <div className="bg-[#07060B]/50 backdrop-blur-xl rounded-2xl border border-[#2E455C]/50 shadow-sm overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se encontraron actividades</p>
              <p className="text-xs mt-1">Intenta con otros filtros o crea una nueva actividad.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2E455C]/30 bg-[#2E455C]/10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Actividad</th>
                    <th className="px-6 py-3.5">Tipo</th>
                    <th className="px-6 py-3.5">Prioridad</th>
                    <th className="px-6 py-3.5">Responsable</th>
                    <th className="px-6 py-3.5">Fecha Límite</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-white">
                  {filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#2E455C]/20/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{act.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400 capitalize">{ACTIVITY_TYPE_LABELS[act.activity_type] || act.activity_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={act.priority} />
                      </td>
                      <td className="px-6 py-4">
                        {(act.node_type === 'end' || act.current_stage?.node_type === 'end') ? (
                          <span className="font-medium text-[#20CDFE] bg-violet-50 px-2.5 py-1 rounded-md text-xs">Aprobación del Cliente</span>
                        ) : isAdmin ? (() => {
                          let allowedUsers = users;
                          if (act.current_stage?.department) {
                            const targetDep = departments.find(d => d.name === act.current_stage?.department);
                            if (targetDep) {
                              allowedUsers = users.filter(u => u.department_id === targetDep.id);
                            }
                          }
                          return (
                            <select
                              value={act.assigned_user_id || ""}
                              onChange={(e) => handleAssignUser(act.id, e.target.value)}
                              className="bg-[#2E455C]/20 border border-[#2E455C]/50 text-white text-xs rounded-lg focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] block w-full p-1.5"
                            >
                              <option value="">Sin asignar</option>
                              {allowedUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          );
                        })() : (
                          <span className="font-medium text-slate-300">{act.assigned_user?.name || "Sin asignar"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(act.deadline || project.deadline)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={act.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/actividades/${act.id}`} className="inline-flex p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear actividad */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07060B]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#2E455C]/50 w-full max-w-lg animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2E455C]/30 shrink-0">
              <h3 className="text-lg font-bold text-white">Nueva actividad</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl leading-none cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Proyecto</label>
                  <input
                    type="text"
                    disabled
                    value={project.name}
                    className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm bg-[#2E455C]/20 text-slate-400 focus:outline-none"
                  />
                  <input type="hidden" {...register("project_id")} value={projectId} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Título *</label>
                  <input {...register("title")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                  <textarea {...register("description")} rows={2} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                    <select {...register("activity_type")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de la Tarea</label>
                    <select {...register("node_type")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      <option value="task">Tarea Estándar</option>
                      <option value="decision">Decisión</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad</label>
                    <select {...register("priority")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha inicio</label>
                    <input 
                      type="date" 
                      min={project?.start_date ? String(project.start_date).split('T')[0] : undefined}
                      max={project?.deadline ? String(project.deadline).split('T')[0] : undefined}
                      {...register("start_date")} 
                      className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha límite</label>
                    <input 
                      type="date" 
                      min={project?.start_date ? String(project.start_date).split('T')[0] : undefined}
                      max={project?.deadline ? String(project.deadline).split('T')[0] : undefined}
                      {...register("deadline")} 
                      className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Departamento</label>
                    <select 
                      value={selectedDepartmentId}
                      onChange={(e) => {
                        setSelectedDepartmentId(e.target.value);
                        // Resetear el responsable si cambia el departamento
                        reset({ ...register, assigned_user_id: null });
                      }}
                      className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                    >
                      <option value="">Todos los departamentos</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Responsable</label>
                    <select {...register("assigned_user_id")} className="w-full px-3 py-2.5 border border-[#2E455C]/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                      <option value="">Sin asignar</option>
                      {users
                        .filter(u => !selectedDepartmentId || u.department_id === Number(selectedDepartmentId))
                        .map(u => <option key={u.id} value={u.id}>{u.name} ({u.position || u.role})</option>)
                      }
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-[#2E455C]/30 bg-[#2E455C]/10 shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#2E455C]/50 bg-[#07060B]/80 rounded-xl text-sm text-slate-300 hover:bg-[#2E455C]/20 transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-violet-500/10">
                  {submitting ? "Creando..." : "Crear actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
