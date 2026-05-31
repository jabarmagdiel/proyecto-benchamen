"use client";

import { useState, useEffect } from "react";
import { departmentsApi, usersApi } from "@/lib/api";
import { Department, User } from "@/types";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

export default function Roles OperativosPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  const [formData, setFormData] = useState<{name: string, description: string, is_active: boolean, user_ids: number[]}>({
    name: "",
    description: "",
    is_active: true,
    user_ids: []
  });

  const loadData = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.list()
      ]);
      setDepartments(deptRes.data);
      setUsers(userRes.data);
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
      // user_ids depends on the users belonging to the department
      // We will filter from the `users` list those who have department_id === dept.id
      const deptUserIds = users.filter((u: any) => u.department_id === dept.id).map(u => u.id);
      
      setFormData({
        name: dept.name,
        description: dept.description || "",
        is_active: dept.is_active,
        user_ids: deptUserIds
      });
    } else {
      setEditingDept(null);
      setFormData({ name: "", description: "", is_active: true, user_ids: [] });
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

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este rol operativo?")) return;
    try {
      await departmentsApi.delete(id);
      loadData();
    } catch (err) {
      console.error("Error deleting department:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando roles operativos...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-violet-500" />
            Roles Operativos
          </h1>
          <p className="text-slate-400">Gestiona las áreas encargadas de las etapas del flujo.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-[#20CDFE]/20 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo Rol Operativo
        </button>
      </div>

      <div className="bg-[#0A101D]/80 rounded-2xl shadow-sm border border-[#20CDFE]/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#15233D] border-b border-[#20CDFE]/10 text-slate-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-[#15233D] transition-colors">
                <td className="px-6 py-4 font-medium text-white">{dept.name}</td>
                <td className="px-6 py-4 text-slate-400">{dept.description || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${dept.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1C2C4D] text-slate-300'}`}>
                    {dept.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(dept)} className="p-2 text-slate-400 hover:text-[#20CDFE] hover:bg-[#15233D] rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  No hay roles operativos creados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/80 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#20CDFE]/10 flex justify-between items-center bg-[#15233D]">
              <h3 className="font-bold text-white">
                {editingDept ? "Editar Rol Operativo" : "Nuevo Rol Operativo"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Nombre</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-[#20CDFE]/10 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    placeholder="Ej. Diseño Gráfico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#20CDFE]/10 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    placeholder="Opcional"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded text-[#20CDFE] focus:ring-violet-500 w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-white">Rol Operativo activo</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Operadores del Rol Operativo</label>
                  <div className="bg-[#15233D] border border-[#20CDFE]/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-[#1C2C4D] rounded">
                        <input 
                          type="checkbox"
                          className="rounded text-[#20CDFE] focus:ring-violet-500 w-4 h-4"
                          checked={formData.user_ids.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, user_ids: [...formData.user_ids, user.id]});
                            } else {
                              setFormData({...formData, user_ids: formData.user_ids.filter(id => id !== user.id)});
                            }
                          }}
                        />
                        <span className="text-sm text-white">{user.name} <span className="text-xs text-slate-400">({user.email})</span></span>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">No hay usuarios disponibles.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-300 hover:bg-[#1C2C4D] font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
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
