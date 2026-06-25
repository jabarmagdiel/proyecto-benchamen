"use client";

import { useEffect, useState } from "react";
import { Package as PkgIcon, Send, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { packagesApi, packageRequestsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente de revisión",
  aceptada: "Aceptada - Preparando proyecto",
  en_proceso: "En Proceso",
  entregada: "Entregada / Finalizada",
  rechazada: "Rechazada",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-600 border-slate-200",
  aceptada: "bg-indigo-100 text-indigo-700 border-indigo-200",
  en_proceso: "bg-blue-100 text-blue-700 border-blue-200",
  entregada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rechazada: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_ICONS: Record<string, any> = {
  pendiente: Clock,
  aceptada: CheckCircle2,
  en_proceso: Clock,
  entregada: CheckCircle2,
  rechazada: XCircle,
};

export default function MisPaquetesPage() {
  const { user, profile } = useAuth();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Cargar catálogo de paquetes general
      const pRes = await packagesApi.list();
      setCatalog(pRes.data);

      // Cargar mis solicitudes de paquetes
      const rRes = await packageRequestsApi.list();
      setRequests(rRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRequestPackage = async (packageId: number) => {
    if (!profile?.company_id) {
      showToast("Error: No tienes una empresa asignada. Contacta al administrador.", "error");
      return;
    }
    
    setSubmitting(packageId);
    try {
      await packageRequestsApi.create({
        package_id: packageId,
        company_id: profile.company_id,
        notes: "Solicitado desde el portal de clientes"
      });
      showToast("Paquete solicitado correctamente. Nos pondremos en contacto pronto.");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al solicitar paquete", "error");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <h2 className="text-2xl font-bold text-white">Catálogo de Paquetes</h2>
          <p className="text-slate-400 text-sm mt-1">Explora nuestros servicios y solicita los paquetes que necesites.</p>
        </div>

        {/* ─── CATÁLOGO DE PAQUETES ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
          ) : catalog.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <PkgIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay paquetes disponibles en el catálogo en este momento.</p>
            </div>
          ) : (
            catalog.map((p) => {
              // Si ya lo solicitó y está pendiente/en proceso, mostrarlo
              const isRequested = requests.find(r => r.package_id === p.id && r.status !== "rechazada" && r.status !== "entregada");
              
              return (
                <div key={p.id} className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 flex flex-col justify-between hover:border-slate-800 transition-all shadow-sm hover:shadow-lg group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#20CDFE]/20 to-[#1ED1B4]/10 border border-slate-800 flex items-center justify-center mb-4 text-[#20CDFE]">
                      <PkgIcon size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{p.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4">{p.description}</p>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-black text-white mb-4">
                      {Number(p.base_price).toFixed(2)} Bs.
                      <span className="text-xs text-slate-500 font-normal ml-1">/ servicio</span>
                    </div>

                    {isRequested ? (
                      <button disabled className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Ya solicitado
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRequestPackage(p.id)}
                        disabled={submitting === p.id}
                        className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] hover:opacity-90 flex items-center justify-center gap-2 transition-opacity"
                      >
                        {submitting === p.id ? "Procesando..." : <><Send size={16} /> Solicitar Paquete</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── MIS SOLICITUDES ─── */}
        <div className="pt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Mis Solicitudes Activas</h2>
            <p className="text-slate-400 text-sm mt-1">Estado de los paquetes que has solicitado recientemente.</p>
          </div>

          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">Aún no has solicitado ningún paquete.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#15233D] border-b border-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Paquete</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Fecha Solicitud</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/5">
                  {requests.map((r) => {
                    const StatusIcon = STATUS_ICONS[r.status] || Clock;
                    return (
                      <tr key={r.id} className="hover:bg-[#0F192E] transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-500">#{r.id}</td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {r.package?.name || "Paquete Eliminado"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}`}>
                            <StatusIcon size={12} />
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">{formatDate(r.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
