"use client";

import { useState, useEffect } from "react";
import { departmentsApi, usersApi } from "@/lib/api";
import { Department, User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash2, Building2, Shield, ArrowDown, Crown, Layers, Sparkles } from "lucide-react";

export default function RolesOperativosPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  const [formData, setFormData] = useState<{name: string, description: string, level: number, is_active: boolean, user_ids: number[]}>({
    name: "",
    description: "",
    level: 1,
    is_active: true,
    user_ids: []
  });

  const loadData = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.list()
      ]);
      // Sort departments by hierarchy level ascending
      const sorted = (deptRes.data || []).sort((a: Department, b: Department) => (a.level || 1) - (b.level || 1));
      setDepartments(sorted);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      const deptUserIds = users.filter((u: any) => u.departments?.some((d: any) => d.id === dept.id) || u.department_id === dept.id).map(u => u.id);
      
      setFormData({
        name: dept.name,
        description: dept.description || "",
        level: dept.level || 1,
        is_active: dept.is_active,
        user_ids: deptUserIds
      });
    } else {
      setEditingDept(null);
      setFormData({ name: "", description: "", level: departments.length + 1, is_active: true, user_ids: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentsApi.update(editingDept.id, formData);
      } else {
        await departmentsApi.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error("Error saving department:", err);
    }
  };

  const saveNormalizedLevels = async (list: Department[]) => {
    setDepartments(list);
    try {
      await Promise.all(
        list.map((dept, idx) => {
          const newLvl = idx + 1;
          if (dept.level !== newLvl) {
            return departmentsApi.update(dept.id, { level: newLvl });
          }
          return Promise.resolve();
        })
      );
    } catch (err) {
      console.error("Error saving normalized levels:", err);
    }
  };

  const handleSwapIndex = async (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= departments.length || toIndex >= departments.length || fromIndex === toIndex) return;

    const list = [...departments];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    // Update levels sequentially
    const updatedList = list.map((d, idx) => ({ ...d, level: idx + 1 }));
    await saveNormalizedLevels(updatedList);
  };

  const handleMoveToLevel = async (currentIndex: number, targetLevel: number) => {
    const targetIndex = Math.max(0, Math.min(departments.length - 1, targetLevel - 1));
    await handleSwapIndex(currentIndex, targetIndex);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este rol operativo?")) return;
    try {
      await departmentsApi.delete(id);
      loadData();
    } catch (err) {
      console.error("Error deleting department:", err);
    }
  };

  if (user && user.role !== "administrador") {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          🔒
        </div>
        <h2 className="text-lg font-bold text-white">Acceso Restringido</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Solo el Administrador del sistema tiene permisos para gestionar la Jerarquía de Mando y Roles Operativos.
        </p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando roles y jerarquía...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="text-[#20CDFE]" />
            Roles Operativos & Jerarquía de Mando
          </h1>
          <p className="text-slate-400 text-sm">
            Define las áreas operativas y el nivel de jerarquía (escalafón de poder) para la asignación de tareas.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#20CDFE]/20 hover:opacity-90 transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo Rol Operativo
        </button>
      </div>

      {/* Tarjeta de Visualización Dinámica de Jerarquía */}
      <div className="bg-[#0A101D]/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Crown className="text-amber-400" size={20} />
            <h2 className="text-base font-extrabold text-white">Escalafón Dinámico de Autoridad</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🖱️ Drag & Drop Interactivo
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Nivel 1 = Máxima Autoridad
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Arrastra y suelta las tarjetas para reordenar la jerarquía, o usa los botones ⬆️ / ⬇️. El reordenamiento actualizará automáticamente la jerarquía de mando.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {departments.map((dept, index) => (
            <div 
              key={`h-${dept.id}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", index.toString());
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = Number(e.dataTransfer.getData("text/plain"));
                if (!isNaN(fromIndex)) {
                  handleSwapIndex(fromIndex, index);
                }
              }}
              className="bg-[#15233D]/80 border border-slate-800 hover:border-[#20CDFE]/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-[#20CDFE]/15 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-purple-200 border border-purple-500/40 shadow-sm flex items-center gap-1">
                  <Crown size={10} className="text-amber-400" />
                  Nivel {index + 1}
                </span>

                {/* Botones de Reordenamiento Dinámico */}
                <div className="flex items-center gap-1 bg-[#0A101D] border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => handleSwapIndex(index, index - 1)}
                    disabled={index === 0}
                    className="px-1.5 py-0.5 hover:bg-[#20CDFE]/20 text-slate-300 hover:text-[#20CDFE] rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs font-bold"
                    title="Subir posición"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => handleSwapIndex(index, index + 1)}
                    disabled={index === departments.length - 1}
                    className="px-1.5 py-0.5 hover:bg-[#20CDFE]/20 text-slate-300 hover:text-[#20CDFE] rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs font-bold"
                    title="Bajar posición"
                  >
                    ⬇️
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                  <Shield size={14} className="text-[#20CDFE]" />
                  {dept.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{dept.description || "Sin descripción"}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Asignar Nivel:</span>
                <select
                  value={index + 1}
                  onChange={(e) => handleMoveToLevel(index, Number(e.target.value))}
                  className="bg-[#0A101D] border border-slate-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg focus:ring-1 focus:ring-[#20CDFE] outline-none cursor-pointer"
                >
                  {departments.map((_, idx) => (
                    <option key={`lvl-opt-${idx + 1}`} value={idx + 1}>Nivel {idx + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Roles */}
      <div className="bg-[#0A101D]/80 rounded-3xl shadow-sm border border-slate-800/80 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#15233D] border-b border-slate-800/80 text-slate-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Jerarquía / Nivel</th>
              <th className="px-6 py-4">Nombre del Rol</th>
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-[#15233D]/50 transition-colors">
                <td className="px-6 py-4 font-bold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Shield size={12} className="text-purple-400" />
                    Nivel {dept.level || 1}
                  </span>
                </td>
                <td className="px-6 py-4 font-extrabold text-white">{dept.name}</td>
                <td className="px-6 py-4 text-slate-400 text-xs">{dept.description || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${dept.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {dept.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(dept)} className="p-2 text-slate-400 hover:text-[#20CDFE] hover:bg-[#15233D] rounded-xl transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No hay roles operativos ni jerarquías creadas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#15233D]">
              <h3 className="font-bold text-white text-base">
                {editingDept ? "Editar Rol Operativo & Jerarquía" : "Nuevo Rol Operativo"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Rol Operativo / Área *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-[#20CDFE] outline-none"
                  placeholder="Ej. Diseño Gráfico, Marketing, Sistemas..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nivel de Jerarquía / Autoridad (1 = Mayor Autoridad) *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: Number(e.target.value)})}
                  className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-[#20CDFE] outline-none"
                >
                  <option value={1}>Nivel 1 - Sistemas / Dirección (Superior)</option>
                  <option value={2}>Nivel 2 - Marketing y Audiovisual</option>
                  <option value={3}>Nivel 3 - Diseño Gráfico</option>
                  <option value={4}>Nivel 4 - Operaciones / Administración</option>
                  <option value={5}>Nivel 5 - Soporte / Auxiliar</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Los gerentes de un nivel menor pueden asignar tareas a personal de niveles iguales o superiores.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-[#15233D]/60 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-[#20CDFE] outline-none resize-none"
                  placeholder="Descripción opcional del área..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded text-[#20CDFE] focus:ring-[#20CDFE] w-4 h-4"
                />
                <label htmlFor="is_active" className="text-xs font-bold text-slate-300">Rol Operativo activo</label>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Integrantes Asignados a este Rol</label>
                <div className="bg-[#15233D]/60 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-[#1C2C4D] rounded-lg transition-colors">
                      <input 
                        type="checkbox"
                        className="rounded text-[#20CDFE] focus:ring-[#20CDFE] w-4 h-4"
                        checked={formData.user_ids.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, user_ids: [...formData.user_ids, user.id]});
                          } else {
                            setFormData({...formData, user_ids: formData.user_ids.filter(id => id !== user.id)});
                          }
                        }}
                      />
                      <span className="text-xs text-white font-semibold">{user.name} <span className="text-[10px] text-slate-400">({user.role})</span></span>
                    </label>
                  ))}
                  {users.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">No hay usuarios disponibles.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-bold text-xs rounded-xl hover:opacity-90 shadow-md shadow-[#20CDFE]/20 transition-all"
                >
                  {editingDept ? "Guardar Cambios" : "Crear Rol Operativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
