"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Users, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { usersApi, companiesApi, departmentsApi } from "@/lib/api";
import type { User, Company, Department } from "@/types";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  position: z.string().optional().default(""),
  role: z.enum(["administrador", "operativo", "cliente"]).default("operativo"),
  department_ids: z.array(z.coerce.number()).optional().default([]),
  company_id: z.coerce.number().optional().nullable(),
}).refine(data => {
  if (data.role === "cliente" && !data.company_id) {
    return false;
  }
  return true;
}, {
  message: "La empresa es requerida para el rol cliente",
  path: ["company_id"],
});

type FormData = z.infer<typeof schema>;

const ROLE_COLORS = {
  administrador: "bg-[#20CDFE]/20 text-[#20CDFE]",
  operativo: "bg-blue-100 text-blue-700",
  cliente: "bg-emerald-100 text-emerald-700",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      role: "operativo",
      company_id: null,
    }
  });

  const selectedRole = watch("role");

  const loadCompaniesAndDepartments = async () => {
    try {
      const [compRes, deptRes] = await Promise.all([
        companiesApi.list(),
        departmentsApi.getAll()
      ]);
      setCompanies(compRes.data);
      setDepartments(deptRes.data);
    } catch (e) {
      console.error("Error al cargar empresas o especialidades", e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await usersApi.list({ search });
      setUsers(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompaniesAndDepartments();
  }, []);

  useEffect(() => {
    load();
  }, [search]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", email: "", position: "", role: "operativo", department_ids: [], password: "", company_id: null });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    reset({
      name: u.name,
      email: u.email,
      position: u.position || "",
      role: u.role,
      department_ids: u.departments?.map(d => d.id) || [],
      password: "",
      company_id: u.company_id || null
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      if (payload.role !== "cliente") {
        payload.company_id = null;
      }
      if (editing) {
        await usersApi.update(editing.id, payload);
        showToast("Usuario actualizado");
      } else {
        await usersApi.create(payload);
        showToast("Usuario creado");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, name: string, active: boolean) => {
    try {
      await usersApi.toggle(id);
      showToast(`${name} ${active ? "desactivado" : "activado"}`);
      load();
    } catch (e: any) {
      showToast("Error al cambiar estado", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      showToast("Usuario eliminado");
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
            <h2 className="text-xl font-bold text-white">Usuarios</h2>
            <p className="text-slate-400 text-sm mt-0.5">{users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-lg shadow-[#20CDFE]/20">
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..." className="pl-9 pr-4 py-2.5 rounded-xl border border-[#20CDFE]/10 bg-[#0A101D]/80 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-200" />
        </div>

        <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay usuarios</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#15233D] border-b border-[#20CDFE]/10">
                <tr>
                  {["Usuario", "Email", "Cargo", "Especialidad / Empresa", "Rol", "Estado", "Creado", "Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => {
                  const company = companies.find(c => c.id === u.company_id);
                  return (
                    <tr key={u.id} className={`hover:bg-[#0F192E] transition-colors ${!u.is_active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{u.name.charAt(0)}</span>
                          </div>
                          <span className="font-semibold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{u.email}</td>
                      <td className="px-4 py-3.5 text-slate-400">{u.position || "-"}</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {u.role === "cliente" ? (company?.name || "Cargando empresa...") : (u.departments?.map(d => d.name).join(", ") || "-")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[u.role]}`}>
                          {u.role === "administrador" ? "Admin" : u.role === "cliente" ? "Cliente" : "Operativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-[#1C2C4D] text-slate-400"}`}>
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-[#20CDFE]/20 text-slate-400 hover:text-[#20CDFE] transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleToggle(u.id, u.name, u.is_active)} className={`p-1.5 rounded-lg transition-colors ${u.is_active ? "hover:bg-amber-100 text-slate-400 hover:text-amber-600" : "hover:bg-green-100 text-slate-400 hover:text-green-600"}`} title={u.is_active ? "Desactivar" : "Activar"}>
                            {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#20CDFE]/10 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-[#20CDFE]/10">
              <h3 className="text-lg font-bold text-white">{editing ? "Editar usuario" : "Nuevo usuario"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre *</label>
                  <input {...register("name")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cargo (Ej. Director Creativo)</label>
                  <input {...register("position")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Especialidades</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                    {departments.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          value={d.id}
                          {...register("department_ids")}
                          className="rounded border-[#2E455C] bg-[#0A101D] text-[#20CDFE] focus:ring-[#20CDFE] focus:ring-offset-[#07060B]"
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
                <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</label>
                <input {...register("password")} type="password" className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rol *</label>
                <select {...register("role")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="operativo">Operativo</option>
                  <option value="administrador">Administrador</option>
                  <option value="cliente">Cliente (Empresa)</option>
                </select>
              </div>

              {selectedRole === "cliente" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Empresa *</label>
                  <select {...register("company_id")} className="w-full px-3 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="">Seleccionar empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.company_id && <p className="text-red-500 text-xs mt-1">{errors.company_id.message as string}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm text-slate-300 hover:bg-[#15233D]">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-[#20CDFE]/10 w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar usuario?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-[#20CDFE]/10 rounded-xl text-sm text-slate-300 hover:bg-[#15233D]">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
