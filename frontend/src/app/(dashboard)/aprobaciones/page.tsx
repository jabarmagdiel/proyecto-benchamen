"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, CheckCircle, AlertCircle, Eye, Calendar as CalendarIcon, Clock } from "lucide-react";
import { activitiesApi } from "@/lib/api";
import type { Activity } from "@/types";
import { ACTIVITY_TYPE_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AprobacionesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Los clientes solo verán las actividades de su empresa "En revisión"
      const r = await activitiesApi.list({ status: "en_revision" });
      setActivities(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id: number) => {
    try {
      await activitiesApi.approve(id);
      showToast("Actividad aprobada ✅");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error", "error");
    }
  };

  const handleObserve = async (id: number) => {
    const obs = prompt("Escribe el motivo del rechazo u observación:");
    if (!obs) return;
    try {
      await activitiesApi.observe(id, obs);
      showToast("Observación enviada 📝");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white">Aprobaciones Pendientes</h2>
        <p className="text-slate-400 text-sm mt-0.5">Revisa y aprueba el trabajo entregado</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 bg-[#07060B]/80 border border-[#2E455C]/50 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-[#2E455C]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#2E455C]/30">
            <CheckSquare size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No hay tareas pendientes</h3>
          <p className="text-slate-400 mt-1 max-w-md mx-auto">
            Todo el trabajo ha sido revisado o aún no se ha entregado nuevo material.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(a => (
            <div key={a.id} className="bg-[#07060B]/80 border border-[#2E455C]/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-slate-400 bg-[#2E455C]/30 px-2 py-1 rounded-md">
                  {ACTIVITY_TYPE_LABELS[a.activity_type]}
                </span>
                <StatusBadge status={a.status} />
              </div>

              <h3 className="font-bold text-white line-clamp-2 mb-1">{a.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-1">{a.project_name}</p>

              <div className="flex-1" />

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CalendarIcon size={14} className="text-slate-400" />
                  Creado: {formatDate(a.created_at)}
                </div>
                {a.deadline && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} className="text-slate-400" />
                    Vence: {formatDate(a.deadline)}
                  </div>
                )}
              </div>
              
              {(a.node_type === 'end' || a.current_stage?.node_type === 'end') && a.latest_evidence_url && (
                <div className="mb-4">
                  <a href={a.latest_evidence_url.startsWith('http') ? a.latest_evidence_url : `${process.env.NEXT_PUBLIC_API_URL}${a.latest_evidence_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-50 text-[#20CDFE] hover:bg-[#20CDFE]/20 font-semibold text-sm rounded-xl transition-colors border border-violet-100">
                    <span className="text-lg">⭐</span> Ver Producto Final
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[#2E455C]/30">
                <Link href={`/actividades/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-[#20CDFE] bg-[#2E455C]/30 hover:bg-[#20CDFE]/20 px-3 py-2 rounded-lg transition-colors font-medium">
                  <Eye size={13} /> Revisar
                </Link>
                <button onClick={() => handleObserve(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg transition-colors font-medium">
                  <AlertCircle size={13} /> Observar
                </button>
                <button onClick={() => handleApprove(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors font-medium">
                  <CheckCircle size={13} /> Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
