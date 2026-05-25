"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import { Users, BarChart3, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface CapacityData {
  user_id: number;
  name: string;
  department_name: string | null;
  active_activities_count: number;
  weekly_tracked_hours: number;
  capacity_status: "Libre" | "Ocupado" | "Sobrecargado";
}

export default function CapacidadPage() {
  const [data, setData] = useState<CapacityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersApi.capacity();
        setData(res.data);
      } catch (e) {
        console.error("Error loading capacity", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;
  }

  // Agrupar por departamento
  const grouped = data.reduce((acc, item) => {
    const dep = item.department_name || "Sin Departamento";
    if (!acc[dep]) acc[dep] = [];
    acc[dep].push(item);
    return acc;
  }, {} as Record<string, CapacityData[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Carga Laboral (Capacidad)</h2>
        <p className="text-slate-500 text-sm mt-0.5">Estado de ocupación de los operativos en la semana actual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(grouped).map(([dept, users]) => (
          <div key={dept} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={16} className="text-violet-600" /> {dept}
            </h3>
            
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.user_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-blue-500" />
                          {u.active_activities_count} tareas
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} className="text-amber-500" />
                          {u.weekly_tracked_hours} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    u.capacity_status === 'Sobrecargado' ? 'bg-red-100 text-red-700' :
                    u.capacity_status === 'Ocupado' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {u.capacity_status === 'Sobrecargado' && <AlertTriangle size={12} />}
                    {u.capacity_status === 'Ocupado' && <BarChart3 size={12} />}
                    {u.capacity_status === 'Libre' && <CheckCircle2 size={12} />}
                    {u.capacity_status}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-slate-400">No hay usuarios en este departamento</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
